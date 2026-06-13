"use client";

import "@/app/(public)/custom-request/landing.css";

import { useState } from "react";
import type { loadOrderBundle } from "@/lib/customRequest/customRequestQueries";
import type { OrderDetailPageData } from "@/lib/customRequest/orderDetailQueries";
import { hasActiveDisputeForOrderRows } from "@/lib/customRequest/orderDisputeHelpers";

import {
  ORDER_INSERT_STATUS_PENDING,
  ORDER_MENTOR_WORK_STARTED_PRIMARY_STATUS,
  ORDER_STATUSES_MENTOR_START_WORK_ALLOWED,
  isOrderPaymentEscrowedForStudentCancel,
  isOrderStatusAllowingStudentAccept,
  isOrderStatusBeforeMentorWorkStarted,
  isOrderRowTerminalForActions,
  isOrderRowPaymentConfirmedForMentorWork,
  normalizedPrimaryOrderStatus,
  orderWorkspaceCurrentStepIndex,
  orderStatusLabelForUi,
  ORDER_ROOM_TIMELINE_STEPS,
} from "@/lib/customRequest/orderLifecycleConstants";
import { mapDataErrorMessage } from "@/lib/utils/mapDataError";
import { OrderActionBar } from "@/components/customRequest/order/OrderActionBar";
import type { AppRole } from "@/lib/types/user";
import { OrderDeliverablesPanel } from "@/components/customRequest/order/OrderDeliverablesPanel";
import { OrderDisputesPanel } from "@/components/customRequest/order/OrderDisputesPanel";
import { OrderEventsLogPanel } from "@/components/customRequest/order/OrderEventsLogPanel";
import { OrderProgressSection } from "@/components/customRequest/order/OrderProgressSection";
import { OrderRevisionsPanel } from "@/components/customRequest/order/OrderRevisionsPanel";
import { StudentOrderCompleteView } from "@/components/customRequest/order/StudentOrderCompleteView";
import {
  hasRightSettlementBlockContent,
  OrderPaymentSettlementBlock,
  OrderRoomPageHeader,
  OrderSettlementLineCard,
  OrderRightSidebarMentor,
} from "@/components/customRequest/order/OrderSummaryHeader";
import { MentorOrderRoomGuidanceCollapsible } from "@/components/customRequest/MentorOrderRoomGuidanceCollapsible";
import { CustomRequestPolicyNotice } from "@/components/customRequest/CustomRequestPolicyNotice";
import { ContactMaskingNotice } from "@/components/customRequest/ContactMaskingNotice";
import {
  CustomRequestCoreStrip,
  CustomRequestDetailDivider,
  CustomRequestSectionPane,
} from "@/components/customRequest/customRequestDetailLayout";

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

function studentCancelDisabledReason(
  actorRole: AppRole,
  view: "student" | "mentor",
  order: Row,
  detail: OrderDetailPageData
): string | null {
  if (view !== "student" || actorRole !== "student") {
    return "학생 본인 의뢰에서만 주문을 취소할 수 있습니다.";
  }
  const byDispute = disputeLifecycleBlockReason(detail);
  if (byDispute) {
    return byDispute;
  }
  if (isOrderRowTerminalForActions(order)) {
    return "이미 종료된 주문입니다.";
  }
  const norm = normalizedPrimaryOrderStatus(order);
  if (!norm) {
    return "주문 상태를 확인할 수 없습니다.";
  }
  if (!isOrderPaymentEscrowedForStudentCancel(order)) {
    return "예치(결제)가 완료된 주문만 직접 취소할 수 있습니다.";
  }
  if (!isOrderStatusBeforeMentorWorkStarted(norm)) {
    if (norm === ORDER_MENTOR_WORK_STARTED_PRIMARY_STATUS || norm === "in_progress") {
      return "작업이 시작되어 직접 취소할 수 없습니다. 문의·분쟁을 이용하세요.";
    }
    return `현재 단계(${orderStatusLabelForUi(norm)})에서는 직접 취소할 수 없습니다.`;
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

function OngoingOrderStepper({ currentIndex }: { currentIndex: number }) {
  return (
    <div className="cr-stepper-shell mt-3 !mb-0">
      <div className="form-stepper-lifecycle">
        <ol aria-label="주문 진행 단계">
          {ORDER_ROOM_TIMELINE_STEPS.map((step, index) => {
            const isDone = index < currentIndex;
            const isCurrent = index === currentIndex;
            return (
              <li
                key={step.id}
                className={`step-item ${isDone ? "is-done" : ""} ${isCurrent ? "is-current" : ""}`.trim()}
              >
                <span className="step-dot">{isDone ? "✓" : index + 1}</span>
                <span className="step-label">{step.title}</span>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}

function OngoingPolicySection() {
  return (
    <CustomRequestSectionPane title="안내 및 정책">
      <div className="mt-3 grid gap-3">
        <CustomRequestPolicyNotice />
        <ContactMaskingNotice />
        <div className="rounded-xl border border-slate-200 bg-slate-50/90 px-4 py-3 text-xs leading-relaxed text-slate-700">
          <p className="font-extrabold text-slate-900">환불·취소 안내</p>
          <p className="mt-2">
            지원 없음·자동 취소·결제 실패·납품 지연 등 예외는 주문 상태와 이벤트 로그를 함께 확인해 주세요.{" "}
            <a href="/legal/refund" className="font-bold text-blue-700 underline">
              환불·취소 안내
            </a>
          </p>
        </div>
      </div>
    </CustomRequestSectionPane>
  );
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
  /** 멘토 뷰 채팅 — 학생 발신자 표시명(RPC 조회, 서버에서 주입) */
  mentorStudentDisplayName?: string;
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
  const oid = String((o as Row).id ?? "");
  const idForDisplay = String(oid || orderId).trim();
  const shouldRenderStudentCompleteView =
    view === "student" && actorRole === "student" && (isTerminalOrder || orderNorm === "completed");

  if (shouldRenderStudentCompleteView) {
    return <StudentOrderCompleteView detail={detail} orderId={idForDisplay} />;
  }

  const hasDeliverable = (detail.bundle.deliverables.rows?.length ?? 0) > 0;
  const currentStepIndex = orderWorkspaceCurrentStepIndex(orderNorm, isTerminalOrder, hasDeliverable);
  const statusLabel = orderNorm ? orderStatusLabelForUi(orderNorm) : "진행 중";
  const categoryLabel = detail.header.category && detail.header.category !== "—" ? detail.header.category : "맞춤의뢰";
  const mentorLabel =
    detail.header.mentorName && detail.header.mentorName !== "—" ? `${detail.header.mentorName} 멘토` : "배정 멘토";
  const amountLabel = detail.header.priceLine && detail.header.priceLine !== "—" ? detail.header.priceLine : "협의 중";
  const dueLabel = detail.header.dueLine && detail.header.dueLine !== "—" ? detail.header.dueLine : "—";

  return (
    <div className="cr-landing cr-detail-v5 cr-detail-shell py-3" data-views="custom-order-room">
      <article className="cr-detail-card">
        <header className="cr-detail-header">
          <span className="eyebrow">맞춤의뢰</span>
          <div className="cr-detail-header-row">
            <h1 className="cr-detail-title">주문방</h1>
            <div className="flex flex-wrap items-center gap-2">
              <span className="cr-category-badge">{categoryLabel}</span>
              <span className="cr-category-badge">{statusLabel}</span>
            </div>
          </div>
          <p className="cr-detail-subtitle">
            선택한 멘토와 대화하며 작업을 진행하고, 납품 파일과 수정 요청, 문제 해결 내역을 한곳에서 확인할 수 있어요.
          </p>
          <span className="mt-4 inline-flex items-center gap-2 rounded-full border border-[#bfdbfe] bg-[var(--c-blue-weak,#e9f0ff)] px-3 py-1.5 text-xs font-extrabold text-[var(--c-blue,#2563eb)]">
            <span aria-hidden>✓</span>
            결제 확인이 완료된 주문이에요
          </span>
        </header>

        <CustomRequestCoreStrip
          items={[
            { label: "선택된 멘토", value: mentorLabel },
            { label: "결제 금액", value: amountLabel },
            { label: "마감일(납기)", value: dueLabel },
          ]}
        />

        <CustomRequestDetailDivider />

        <CustomRequestSectionPane title="진행 단계" hint="현재 주문 상태에 맞춰 자동으로 표시돼요">
          <OngoingOrderStepper currentIndex={currentStepIndex} />
        </CustomRequestSectionPane>

        <CustomRequestDetailDivider />

        <CustomRequestSectionPane title="주문방 채팅" hint="대화 내용은 안전한 거래를 위해 저장됩니다">
          <div className="mt-3">
            <OrderProgressSection
              detail={detail}
              orderId={idForDisplay}
              view={view}
              actorRole={actorRole}
              hasOrderPartyAccess={!accessDenied}
              orderTerminal={isTerminalOrder}
              embedded
            />
          </div>
        </CustomRequestSectionPane>

        <CustomRequestDetailDivider />

        <CustomRequestSectionPane title="납품물" hint="납품 파일과 제출 내역을 확인할 수 있어요">
          <div className="mt-3">
            <OrderDeliverablesPanel
              detail={detail}
              orderId={oid}
              view={view}
              actorRole={actorRole}
              mentorDeliverableBlockReason={mentorDeliverableBlockReason}
              orderTerminal={isTerminalOrder}
              embedded
            />
          </div>
        </CustomRequestSectionPane>

        <CustomRequestDetailDivider />

        <CustomRequestSectionPane title="작업" hint="현재 단계에서 가능한 작업만 활성화돼요">
          <div className="mt-3">
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
              studentCancelDisabledReason={studentCancelDisabledReason(actorRole, view, o as Row, detail)}
              openDisputeApplicationDisabledReason={disputeFormBlock}
              hasActiveDispute={hasActiveDispute}
              mentorRevisionJumpDisabledReason={null}
              embedded
            />
          </div>
        </CustomRequestSectionPane>

        <CustomRequestDetailDivider />

        <CustomRequestSectionPane title="수정 요청" hint="납품 검토 단계에서 필요한 수정 사항을 남길 수 있어요">
          <div className="mt-3">
            <OrderRevisionsPanel
              detail={detail}
              orderId={oid}
              actorRole={actorRole}
              hasOrderPartyAccess={!accessDenied}
              studentRevisionRequestDisabledReason={revBlock}
              orderTerminal={isTerminalOrder}
              revisionAccent={"default"}
              embedded
            />
          </div>
        </CustomRequestSectionPane>

        <CustomRequestDetailDivider />

        <CustomRequestSectionPane title="문제 해결" hint="결제·납품·수정 요청 관련 문제가 있으면 접수해 주세요">
          <div className="mt-3">
            <OrderDisputesPanel
              detail={detail}
              orderId={oid}
              actorRole={actorRole}
              hasOrderPartyAccess={!accessDenied}
              openDisputeApplicationDisabledReason={disputeFormBlock}
              orderTerminal={isTerminalOrder}
              embedded
            />
          </div>
        </CustomRequestSectionPane>

        <CustomRequestDetailDivider />

        <CustomRequestSectionPane title="진행 로그" hint="펼치면 단계별 기록을 확인할 수 있어요">
          <div className="mt-3">
            <OrderEventsLogPanel detail={detail} embedded />
          </div>
        </CustomRequestSectionPane>

        <CustomRequestDetailDivider />

        <OngoingPolicySection />

        <footer className="cr-detail-footer">
          <a href="/custom-request" className="btn btn-ghost">
            ← 맞춤의뢰 목록으로 돌아가기
          </a>
        </footer>
      </article>
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
  mentorStudentDisplayName?: string;
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
    mentorStudentDisplayName,
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
    <div className="min-h-screen w-full bg-white py-8">
      <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8">
        {/* TOP: Shared Mentor Header (Restructured) */}
        <OrderRoomPageHeader
          detail={detail}
          view={view}
          backHref={mentorOrderHubHref ?? "/mentor/custom-request/orders"}
        />

        {/* MAIN: 2-Column Workspace Layout */}
        <div className="mt-8 flex flex-col gap-8 lg:flex-row lg:items-start lg:gap-10">
          {/* LEFT CONTENT: Tabs + Content area */}
          <div className="flex min-w-0 flex-1 flex-col">
            {/* The Flat White Tab Bar */}
            <div className="flex items-center border-b border-ds-border-subtle bg-white px-2">
              {tabs.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`relative px-5 py-4 text-[15px] transition-colors ${
                    activeTab === tab
                      ? "font-semibold text-slate-900"
                      : "font-medium text-slate-500 hover:text-slate-700"
                  }`}
                >
                  {tab}
                  {activeTab === tab && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" aria-hidden />
                  )}
                </button>
              ))}
            </div>

            {/* ACTIVE TAB CONTENT AREA — 바깥 액자 없음, 여백으로만 구분 */}
            <div className="pt-8">
              {activeTab === "채팅" && (
                <OrderProgressSection
                  detail={detail}
                  orderId={idForDisplay}
                  view={view}
                  actorRole={actorRole}
                  hasOrderPartyAccess={!accessDenied}
                  orderTerminal={isTerminalOrder}
                  mentorStudentDisplayName={mentorStudentDisplayName}
                />
              )}

              {activeTab === "작업 파일" && (
                <OrderDeliverablesPanel
                  detail={detail}
                  orderId={oid}
                  view={view}
                  actorRole={actorRole}
                  mentorDeliverableBlockReason={mentorDeliverableBlockReason}
                  orderTerminal={isTerminalOrder}
                />
              )}

              {activeTab === "요청사항" && (
                <div className="space-y-8">
                  <OrderRevisionsPanel
                    detail={detail}
                    orderId={oid}
                    actorRole={actorRole}
                    hasOrderPartyAccess={!accessDenied}
                    studentRevisionRequestDisabledReason={revBlock}
                    orderTerminal={isTerminalOrder}
                    revisionAccent="violet"
                    view={view}
                  />
                  <OrderDisputesPanel
                    detail={detail}
                    orderId={oid}
                    actorRole={actorRole}
                    hasOrderPartyAccess={!accessDenied}
                    openDisputeApplicationDisabledReason={disputeFormBlock}
                    orderTerminal={isTerminalOrder}
                    view={view}
                  />
                </div>
              )}

              {activeTab === "진행 관리" && (
                <div className="space-y-8">
                  <div className="space-y-2">
                    <h3 className="text-base font-bold text-slate-900">작업 제어 및 시스템 상태</h3>
                    <p className="text-sm leading-relaxed text-slate-600">주문의 현재 단계를 변경하거나 중요 이벤트를 추적합니다.</p>
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
                    studentCancelDisabledReason="학생 본인 의뢰에서만 주문을 취소할 수 있습니다."
                    openDisputeApplicationDisabledReason={disputeFormBlock}
                    hasActiveDispute={hasActiveDispute}
                    mentorRevisionJumpDisabledReason={activeDisputeActionBlock}
                  />
                  
                  {hasRightSettlementBlockContent(detail, o as Row, actorRole) && (
                    <div className="space-y-5 border-t border-ds-border-subtle pt-8">
                      <h4 className="text-base font-bold text-slate-900">정산 내역</h4>
                      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                        <OrderPaymentSettlementBlock
                          detail={detail}
                          orderRow={o as Row}
                          orderId={oid}
                          actorRole={actorRole}
                          view={view}
                        />
                        <OrderSettlementLineCard detail={detail} view={view} />
                      </div>
                    </div>
                  )}

                  <OrderEventsLogPanel detail={detail} view={view} />
                </div>
              )}
            </div>
          </div>

          {/* RIGHT SIDEBAR: 진행 단계 + 의뢰 정보 + 접이식 안내 */}
          <aside className="w-full shrink-0 space-y-6 lg:w-[252px]">
            <OrderRightSidebarMentor
              detail={detail}
              view={view}
              isTerminalOrder={isTerminalOrder}
              orderIdDisplay={idForDisplay}
            />
            <MentorOrderRoomGuidanceCollapsible
              order={o as Row}
              disputeRows={detail.bundle.disputes.rows ?? []}
            />
          </aside>
        </div>
      </div>
    </div>
  );
}
