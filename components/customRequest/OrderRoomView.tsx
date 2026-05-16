"use client";

import { useState } from "react";
import type { loadOrderBundle } from "@/lib/customRequest/customRequestQueries";
import type { OrderDetailPageData } from "@/lib/customRequest/orderDetailQueries";
import { hasActiveDisputeForOrderRows } from "@/lib/customRequest/orderDisputeHelpers";

import {
  ORDER_INSERT_STATUS_PENDING,
  ORDER_MENTOR_WORK_STARTED_PRIMARY_STATUS,
  ORDER_STATUSES_MENTOR_START_WORK_ALLOWED,
  isOrderStatusAllowingStudentAccept,
  isOrderRowTerminalForActions,
  isOrderRowPaymentConfirmedForMentorWork,
  normalizedPrimaryOrderStatus,
  orderStatusLabelForUi,
} from "@/lib/customRequest/orderLifecycleConstants";
import { mapDataErrorMessage } from "@/lib/utils/mapDataError";
import { shortOrderIdForDisplay } from "@/lib/utils/formatOrderIdForDisplay";
import { OrderActionBar } from "@/components/customRequest/order/OrderActionBar";
import type { AppRole } from "@/lib/types/user";
import { OrderDeliverablesPanel } from "@/components/customRequest/order/OrderDeliverablesPanel";
import { OrderDisputesPanel } from "@/components/customRequest/order/OrderDisputesPanel";
import { OrderEventsLogPanel } from "@/components/customRequest/order/OrderEventsLogPanel";
import { OrderProgressSection } from "@/components/customRequest/order/OrderProgressSection";
import { OrderRevisionsPanel } from "@/components/customRequest/order/OrderRevisionsPanel";
import {
  hasRightSettlementBlockContent,
  OrderLeftContextPanel,
  OrderPaymentSettlementBlock,
  OrderRoomPageHeader,
  OrderSettlementLineCard,
  OrderRightSidebarMentor,
} from "@/components/customRequest/order/OrderSummaryHeader";
import { ORDER_ROOM_APP_SURFACE_CLASS, ORDER_ROOM_CONTENT_MAX } from "@/lib/customRequest/orderLifecycleConstants";
import { CustomRequestPolicyNotice } from "@/components/customRequest/CustomRequestPolicyNotice";
import { ContactMaskingNotice } from "@/components/customRequest/ContactMaskingNotice";
import { CustomRequestStatusBanner } from "@/components/customRequest/CustomRequestStatusBanner";

type Bundle = Awaited<ReturnType<typeof loadOrderBundle>>;
type Row = Record<string, unknown>;

/** 분쟁 open/under_review/escalated 시 납품·수락·수정요청·작업시작을 잠금(서버 액션과 동기). */
function disputeLifecycleBlockReason(detail: OrderDetailPageData): string | null {
  if (hasActiveDisputeForOrderRows(detail.bundle.disputes.rows ?? [])) {
    return "진행 중인 분쟁이 있어 이 작업은 제한됩니다.";
  }
  return null;
}

function studentAcceptDisabledReason(
  actorRole: AppRole,
  view: "student" | "mentor",
  order: Row,
  detail: OrderDetailPageData
): string | null {
  if (view !== "student" || actorRole !== "student") {
    return "학생 본인 의뢰에서만 납품 수락을 사용할 수 있습니다.";
  }
  const byDispute = disputeLifecycleBlockReason(detail);
  if (byDispute) {
    return byDispute;
  }
  const hasDel = (detail.bundle.deliverables.rows?.length ?? 0) > 0;
  if (!hasDel) {
    return "등록된 납품이 있어야 수락할 수 있습니다.";
  }
  const norm = normalizedPrimaryOrderStatus(order);
  if (!norm) {
    return "주문 상태를 확인할 수 없습니다.";
  }
  if (isOrderRowTerminalForActions(order)) {
    return "이미 완료된 주문입니다.";
  }
  if (!isOrderStatusAllowingStudentAccept(norm)) {
    return `현재 단계(${orderStatusLabelForUi(norm)})에서는 수락할 수 없습니다.`;
  }
  return null;
}

function mentorStartDisabledReason(
  actorRole: AppRole,
  view: "student" | "mentor",
  order: Row,
  detail: OrderDetailPageData,
  byDdl: string | null
): string | null {
  const byDispute = disputeLifecycleBlockReason(detail);
  if (byDispute) {
    return byDispute;
  }
  if (view === "mentor" && actorRole === "mentor" && !isOrderRowPaymentConfirmedForMentorWork(order)) {
    return "학생 측 결제가 완료된 뒤에만 작업을 시작할 수 있습니다.";
  }
  if (byDdl) {
    return byDdl;
  }
  if (view !== "mentor" || actorRole !== "mentor") {
    return "멘토 본인에게 배정된 주문에서만 작업 시작을 사용할 수 있습니다.";
  }
  const norm = normalizedPrimaryOrderStatus(order);
  if (!norm) {
    return "주문 상태를 확인할 수 없습니다.";
  }
  if (isOrderRowTerminalForActions(order)) {
    return "이미 완료된 주문입니다.";
  }
  if (norm === ORDER_MENTOR_WORK_STARTED_PRIMARY_STATUS) {
    return "이미 작업이 시작된 상태입니다.";
  }
  if (!ORDER_STATUSES_MENTOR_START_WORK_ALLOWED.has(norm)) {
    return `현재 단계(${orderStatusLabelForUi(norm)})에서는 작업을 시작할 수 없습니다.`;
  }
  return null;
}

function studentRevisionRequestDisabledReason(
  actorRole: AppRole,
  view: "student" | "mentor",
  order: Row,
  detail: OrderDetailPageData
): string | null {
  if (view !== "student" || actorRole !== "student") {
    return "학생 본인 의뢰에서만 수정 요청을 보낼 수 있습니다.";
  }
  const byDispute = disputeLifecycleBlockReason(detail);
  if (byDispute) {
    return byDispute;
  }
  const hasDel = (detail.bundle.deliverables.rows?.length ?? 0) > 0;
  if (!hasDel) {
    return "등록된 납품이 있어야 수정 요청을 할 수 있습니다.";
  }
  const norm = normalizedPrimaryOrderStatus(order);
  if (!norm) {
    return "주문 상태를 확인할 수 없습니다.";
  }
  if (isOrderRowTerminalForActions(order)) {
    return "이미 완료·종료된 주문에는 수정 요청을 할 수 없습니다.";
  }
  if (!isOrderStatusAllowingStudentAccept(norm)) {
    return `납품 검토·수락 단계에서만 수정 요청할 수 있습니다(현재: ${orderStatusLabelForUi(norm)}).`;
  }
  return null;
}

/**
 * 분쟁 신청 폼: 학생/멘토, 비종료, 미진행 분쟁.
 * - terminal: 이 화면에서 신규 티켓 열지 않음(정책, 사후는 운영·별도).
 * - 멘토: 납품 1건 이상 또는 학생 검토 가능 상태에서만 신청(서버 액션과 동일).
 */
function openDisputeApplicationDisabledReason(
  actorRole: AppRole,
  order: Row,
  detail: OrderDetailPageData
): string | null {
  if (actorRole !== "student" && actorRole !== "mentor") {
    return "학생·멘토만 이 화면에서 분쟁을 신청할 수 있습니다.";
  }
  const norm = normalizedPrimaryOrderStatus(order);
  if (!norm) {
    return "주문 상태를 확인할 수 없어 분쟁을 신청할 수 없습니다.";
  }
  if (isOrderRowTerminalForActions(order)) {
    // 정책: terminal 이후 동일 주문 URL 로는 신규 분쟁 티켓을 열지 않음(사후 클레임은 운영·별도).
    return "종료·완료된 주문에는 이 화면에서 새 분쟁을 열 수 없습니다.";
  }
  if (hasActiveDisputeForOrderRows(detail.bundle.disputes.rows ?? [])) {
    return "이미 진행 중인 분쟁이 있습니다.";
  }
  if (actorRole === "mentor") {
    // 멘토 분쟁은 납품 이후 단계에서만 허용한다. 납품 전 진행 이슈는 메시지/고객센터로 처리.
    const hasDel = (detail.bundle.deliverables.rows?.length ?? 0) > 0;
    const inStudentReview = isOrderStatusAllowingStudentAccept(norm);
    if (!hasDel && !inStudentReview) {
      return "멘토는 납품이 등록된 이후(또는 학생 검토·수락 단계)에만 분쟁을 신청할 수 있습니다. 납품 전 이슈는 주문 메시지·고객센터로 문의해 주세요.";
    }
  }
  return null;
}

export function OrderRoomView(props: {
  bundle: Bundle;
  detail: OrderDetailPageData | null;
  orderId: string;
  view: "student" | "mentor";
  actorRole: AppRole;
  accessDenied: boolean;
  accessDetail?: string;
  /** 멘토: 맞춤의뢰 주문 목록 등 허브로 돌아가는 경로(OrderRoomPageHeader breadcrumb) */
  mentorOrderHubHref?: string;
  mentorStartDdlDisabledReason: string | null;
}) {
  if (props.view === "mentor") {
    return <OrderRoomViewMentor {...props} />;
  }
  const {
    bundle,
    detail,
    orderId,
    view,
    actorRole,
    accessDenied,
    mentorOrderHubHref,
    mentorStartDdlDisabledReason,
  } = props;
  const o = bundle.order.row;

  if (accessDenied) {
    return (
      <p className="mb-3 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950">
        이 주문에 접근할 권한이 없습니다. 의뢰를 등록한 학생, 배정된 멘토, 운영자만 볼 수 있습니다.
      </p>
    );
  }

  if (!o) {
    const errMsg = bundle.order.error ? mapDataErrorMessage(String(bundle.order.error)) : "주문을 찾을 수 없습니다.";
    return (
      <div className="space-y-2 text-sm text-slate-600">
        <p>{errMsg}</p>
      </div>
    );
  }

  if (!detail) {
    return null;
  }

  const orderNorm = normalizedPrimaryOrderStatus(o as Row);
  const isTerminalOrder = isOrderRowTerminalForActions(o as Row);
  const mentorDeliverableBlockReason = (() => {
    if (actorRole !== "mentor") {
      return "멘토만 납품을 등록할 수 있습니다.";
    }
    if (!isOrderRowPaymentConfirmedForMentorWork(o as Row)) {
      return "학생 측 결제가 완료된 뒤에만 납품을 등록할 수 있습니다.";
    }
    const d = disputeLifecycleBlockReason(detail);
    if (d) {
      return d;
    }
    if (isOrderRowTerminalForActions(o as Row)) {
      return "완료된 주문에서는 납품을 추가로 등록할 수 없습니다.";
    }
    if (orderNorm === ORDER_INSERT_STATUS_PENDING) {
      return "멘토가 작업을 시작한 뒤에 납품을 등록할 수 있습니다.";
    }
    if (orderNorm !== ORDER_MENTOR_WORK_STARTED_PRIMARY_STATUS && orderNorm !== "delivered") {
      return `이 단계(${orderNorm ? orderStatusLabelForUi(orderNorm) : "—"})에서는 납품을 등록할 수 없습니다.`;
    }
    return null;
  })();

  const revBlock = studentRevisionRequestDisabledReason(actorRole, view, o as Row, detail);
  const disputeFormBlock = openDisputeApplicationDisabledReason(actorRole, o as Row, detail);
  const hasActiveDispute = Boolean(detail.hasActiveDispute);
  const activeDisputeActionBlock = hasActiveDispute ? "진행 중인 분쟁이 있어 이 작업은 제한됩니다." : null;
  const oid = String((o as Row).id ?? "");
  const idForDisplay = String(oid || orderId).trim();

  return (
    <div className={`${ORDER_ROOM_APP_SURFACE_CLASS} w-full`} data-views="custom-order-room">
      <div
        className={`${ORDER_ROOM_CONTENT_MAX} !max-w-[min(100%,90rem)] px-3 pb-4 pt-2 sm:px-4 sm:pb-5 sm:pt-3 lg:px-6 lg:pb-6 lg:pt-4`}
      >
        <OrderRoomPageHeader
          detail={detail}
          view={view}
          backHref={"/custom-request"}
        />
        <div className="mt-4 space-y-3">
          <CustomRequestPolicyNotice />
          <ContactMaskingNotice />
          <CustomRequestStatusBanner order={o as Row} disputeRows={detail.bundle.disputes.rows ?? []} />
        </div>
        <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-12 lg:items-stretch lg:gap-6">
          <aside className="order-2 min-w-0 space-y-4 lg:order-1 lg:col-span-3 lg:sticky lg:top-24 lg:self-start">
            <OrderLeftContextPanel
              detail={detail}
              view={view}
              isTerminalOrder={isTerminalOrder}
              orderIdDisplay={idForDisplay}
            />
          </aside>
          <div className="order-1 min-w-0 lg:order-2 lg:col-span-6">
            <OrderProgressSection
              detail={detail}
              orderId={idForDisplay}
              view={view}
              actorRole={actorRole}
              hasOrderPartyAccess={!accessDenied}
              orderTerminal={isTerminalOrder}
            />
          </div>
          <aside className="order-3 min-w-0 space-y-4 lg:order-3 lg:col-span-3 lg:sticky lg:top-24 lg:self-start">
            <OrderDeliverablesPanel
              detail={detail}
              orderId={oid}
              view={view}
              actorRole={actorRole}
              mentorDeliverableBlockReason={mentorDeliverableBlockReason}
              orderTerminal={isTerminalOrder}
            />
            {hasRightSettlementBlockContent(detail, o as Row, actorRole) ? (
              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">정산</p>
                <div className="space-y-3">
                  <OrderPaymentSettlementBlock
                    detail={detail}
                    orderRow={o as Row}
                    orderId={oid}
                    actorRole={actorRole}
                  />
                  <OrderSettlementLineCard detail={detail} />
                </div>
              </div>
            ) : null}
            <OrderActionBar
              view={view}
              actorRole={actorRole}
              orderId={oid}
              orderTerminal={isTerminalOrder}
              studentAcceptDisabledReason={studentAcceptDisabledReason(actorRole, view, o as Row, detail)}
              mentorStartDisabledReason={mentorStartDisabledReason(
                actorRole,
                view,
                o as Row,
                detail,
                mentorStartDdlDisabledReason
              )}
              studentRevisionRequestDisabledReason={revBlock}
              openDisputeApplicationDisabledReason={disputeFormBlock}
              hasActiveDispute={hasActiveDispute}
              mentorRevisionJumpDisabledReason={null}
            />
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">기록</p>
              <OrderRevisionsPanel
                detail={detail}
                orderId={oid}
                actorRole={actorRole}
                hasOrderPartyAccess={!accessDenied}
                studentRevisionRequestDisabledReason={revBlock}
                orderTerminal={isTerminalOrder}
                workspaceCompact
                revisionAccent={"default"}
              />
              <OrderDisputesPanel
                detail={detail}
                orderId={oid}
                actorRole={actorRole}
                hasOrderPartyAccess={!accessDenied}
                openDisputeApplicationDisabledReason={disputeFormBlock}
                orderTerminal={isTerminalOrder}
                workspaceCompact
              />
            </div>
            <OrderEventsLogPanel detail={detail} />
          </aside>
        </div>
        <p className="mt-6 text-center text-xs text-slate-400">참고 주문 식별: {shortOrderIdForDisplay(idForDisplay)}</p>
      </div>
    </div>
  );
}

/**
 * ========================================================
 * MENTOR ONLY VISUAL UPGRADES (SAFETY ENCAPSULATED)
 * ========================================================
 */

function OrderRoomViewMentor(props: {
  bundle: Bundle;
  detail: OrderDetailPageData | null;
  orderId: string;
  view: "student" | "mentor";
  actorRole: AppRole;
  accessDenied: boolean;
  accessDetail?: string;
  mentorOrderHubHref?: string;
  mentorStartDdlDisabledReason: string | null;
}) {
  const {
    bundle,
    detail,
    orderId,
    view,
    actorRole,
    accessDenied,
    mentorOrderHubHref,
    mentorStartDdlDisabledReason,
  } = props;
  
  type TabKey = "채팅" | "작업 파일" | "요청사항" | "진행 관리";
  const [activeTab, setActiveTab] = useState<TabKey>("채팅");

  const o = bundle.order.row;

  if (accessDenied) {
    return (
      <div className="p-8 text-center">
        <p className="inline-flex rounded-xl border border-amber-200 bg-amber-50 px-6 py-3 text-sm font-medium text-amber-900">
          이 주문에 접근할 권한이 없습니다.
        </p>
      </div>
    );
  }

  if (!o) {
    const errMsg = bundle.order.error ? mapDataErrorMessage(String(bundle.order.error)) : "주문을 찾을 수 없습니다.";
    return (
      <div className="p-8 text-center text-slate-600 font-medium">
        <p>{errMsg}</p>
      </div>
    );
  }

  if (!detail) return null;

  const orderNorm = normalizedPrimaryOrderStatus(o as Row);
  const isTerminalOrder = isOrderRowTerminalForActions(o as Row);
  const mentorDeliverableBlockReason = (() => {
    if (view !== "mentor" || actorRole !== "mentor") return "멘토 전용입니다.";
    if (!isOrderRowPaymentConfirmedForMentorWork(o as Row)) {
      return "결제가 완료된 뒤에만 납품을 등록할 수 있습니다.";
    }
    const d = disputeLifecycleBlockReason(detail);
    if (d) return d;
    if (isOrderRowTerminalForActions(o as Row)) {
      return "완료된 주문에서는 납품을 추가할 수 없습니다.";
    }
    if (orderNorm === ORDER_INSERT_STATUS_PENDING) {
      return "멘토가 작업을 시작한 뒤에 납품할 수 있습니다.";
    }
    if (orderNorm !== ORDER_MENTOR_WORK_STARTED_PRIMARY_STATUS && orderNorm !== "delivered") {
      return `현재 단계에서는 납품 등록이 불가합니다.`;
    }
    return null;
  })();

  const revBlock = studentRevisionRequestDisabledReason(actorRole, view, o as Row, detail);
  const disputeFormBlock = openDisputeApplicationDisabledReason(actorRole, o as Row, detail);
  const hasActiveDispute = Boolean(detail.hasActiveDispute);
  const activeDisputeActionBlock = hasActiveDispute ? "문제 해결 진행 중에는 제한됩니다." : null;
  const oid = String((o as Row).id ?? "");
  const idForDisplay = String(oid || orderId).trim();

  const tabs: TabKey[] = ["채팅", "작업 파일", "요청사항", "진행 관리"];

  return (
    <div className="min-h-screen w-full bg-[#F8FAFC] py-6">
      <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8">
        {/* TOP: Shared Mentor Header (Restructured) */}
        <OrderRoomPageHeader
          detail={detail}
          view={view}
          backHref={mentorOrderHubHref ?? "/mentor/custom-request/orders"}
        />

        <div className="mt-4 space-y-3">
          <CustomRequestPolicyNotice />
          <ContactMaskingNotice />
          <CustomRequestStatusBanner order={o as Row} disputeRows={detail.bundle.disputes.rows ?? []} />
        </div>

        {/* MAIN: 2-Column Workspace Layout */}
        <div className="mt-6 flex flex-col gap-6 lg:flex-row lg:items-start">
          {/* LEFT CONTENT: Tabs + Content area */}
          <div className="flex-1 min-w-0 flex flex-col">
            {/* The Flat White Tab Bar */}
            <div className="flex items-center border-b border-slate-200 bg-white px-2 rounded-t-xl">
              {tabs.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`relative px-5 py-4 text-[15px] font-bold transition-colors ${
                    activeTab === tab ? "text-blue-600" : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  {tab}
                  {activeTab === tab && (
                    <span className="absolute bottom-0 left-0 right-0 h-[3px] rounded-full bg-blue-600" />
                  )}
                </button>
              ))}
            </div>

            {/* ACTIVE TAB CONTENT AREA */}
            <div className="rounded-b-xl bg-white border-x border-b border-slate-200 p-0 shadow-[0_2px_10px_rgba(0,0,0,0.02)] overflow-hidden">
              {activeTab === "채팅" && (
                <OrderProgressSection
                  detail={detail}
                  orderId={idForDisplay}
                  view={view}
                  actorRole={actorRole}
                  hasOrderPartyAccess={!accessDenied}
                  orderTerminal={isTerminalOrder}
                />
              )}

              {activeTab === "작업 파일" && (
                <div className="p-6 space-y-6">
                  <OrderDeliverablesPanel
                    detail={detail}
                    orderId={oid}
                    view={view}
                    actorRole={actorRole}
                    mentorDeliverableBlockReason={mentorDeliverableBlockReason}
                    orderTerminal={isTerminalOrder}
                  />
                </div>
              )}

              {activeTab === "요청사항" && (
                <div className="p-6 space-y-5">
                  <h3 className="text-base font-bold text-slate-900">수정 요청 및 문제 해결 기록</h3>
                  <OrderRevisionsPanel
                    detail={detail}
                    orderId={oid}
                    actorRole={actorRole}
                    hasOrderPartyAccess={!accessDenied}
                    studentRevisionRequestDisabledReason={revBlock}
                    orderTerminal={isTerminalOrder}
                    revisionAccent="violet"
                  />
                  <OrderDisputesPanel
                    detail={detail}
                    orderId={oid}
                    actorRole={actorRole}
                    hasOrderPartyAccess={!accessDenied}
                    openDisputeApplicationDisabledReason={disputeFormBlock}
                    orderTerminal={isTerminalOrder}
                  />
                </div>
              )}

              {activeTab === "진행 관리" && (
                <div className="p-6 space-y-6">
                  <div className="space-y-2">
                    <h3 className="text-base font-bold text-slate-900">작업 제어 및 시스템 상태</h3>
                    <p className="text-sm text-slate-500">주문의 현재 단계를 변경하거나 중요 이벤트를 추적합니다.</p>
                  </div>
                  <OrderActionBar
                    view={view}
                    actorRole={actorRole}
                    orderId={oid}
                    orderTerminal={isTerminalOrder}
                    studentAcceptDisabledReason={null}
                    mentorStartDisabledReason={mentorStartDisabledReason(
                      actorRole,
                      view,
                      o as Row,
                      detail,
                      mentorStartDdlDisabledReason
                    )}
                    studentRevisionRequestDisabledReason={null}
                    openDisputeApplicationDisabledReason={disputeFormBlock}
                    hasActiveDispute={hasActiveDispute}
                    mentorRevisionJumpDisabledReason={activeDisputeActionBlock}
                  />
                  
                  {hasRightSettlementBlockContent(detail, o as Row, actorRole) && (
                    <div className="space-y-4 border-t border-slate-100 pt-5">
                      <h4 className="font-bold text-slate-800">정산 내역</h4>
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <OrderPaymentSettlementBlock
                          detail={detail}
                          orderRow={o as Row}
                          orderId={oid}
                          actorRole={actorRole}
                        />
                        <OrderSettlementLineCard detail={detail} />
                      </div>
                    </div>
                  )}

                  <div className="border-t border-slate-100 pt-5">
                    <h4 className="font-bold text-slate-800 mb-3">시스템 이벤트 로그</h4>
                    <OrderEventsLogPanel detail={detail} />
                  </div>
                </div>
              )}
            </div>
            
            <div className="mt-4 flex justify-center">
              <p className="text-[12px] font-medium text-slate-400">
                주문 식별 번호: {shortOrderIdForDisplay(idForDisplay)}
              </p>
            </div>
          </div>

          {/* RIGHT SIDEBAR: Info & Guidelines */}
          <aside className="w-full lg:w-[320px] shrink-0">
            <OrderRightSidebarMentor
              detail={detail}
              view={view}
              isTerminalOrder={isTerminalOrder}
              orderIdDisplay={idForDisplay}
            />
          </aside>
        </div>
      </div>
    </div>
  );
}
