import { loadOrderBundle } from "@/lib/customRequest/customRequestQueries";
import type { OrderDetailPageData } from "@/lib/customRequest/orderDetailQueries";
import { hasActiveDisputeForOrderRows } from "@/lib/customRequest/orderDisputeHelpers";
import { getMentorStartDisabledByMissingOrderDdl } from "@/lib/customRequest/orderSchemaGate";
import {
  ORDER_INSERT_STATUS_PENDING,
  ORDER_MENTOR_WORK_STARTED_PRIMARY_STATUS,
  ORDER_STATUSES_MENTOR_START_WORK_ALLOWED,
  isOrderStatusAllowingStudentAccept,
  isOrderRowTerminalForActions,
  isOrderStatusTerminal,
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
} from "@/components/customRequest/order/OrderSummaryHeader";
import { ORDER_ROOM_APP_SURFACE_CLASS, ORDER_ROOM_CONTENT_MAX } from "@/lib/customRequest/orderLifecycleConstants";

type Bundle = Awaited<ReturnType<typeof loadOrderBundle>>;
type Row = Record<string, unknown>;

/** 분쟁 open/under_review/escalated 시 납품·수락·수정요청·작업시작을 잠금(서버 액션과 동기). */
function disputeLifecycleBlockReason(detail: OrderDetailPageData): string | null {
  if (hasActiveDisputeForOrderRows(detail.bundle.disputes.rows ?? [])) {
    return "진행 중인 분쟁이 있어 이 작업을 할 수 없습니다.";
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
  if (isOrderStatusTerminal(norm)) {
    return "이미 종료된 주문입니다.";
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
  detail: OrderDetailPageData
): string | null {
  const byDispute = disputeLifecycleBlockReason(detail);
  if (byDispute) {
    return byDispute;
  }
  const byDdl = getMentorStartDisabledByMissingOrderDdl();
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
  if (isOrderStatusTerminal(norm)) {
    return "이미 종료된 주문입니다.";
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
  if (isOrderStatusTerminal(norm)) {
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
  if (isOrderStatusTerminal(norm)) {
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
}) {
  const { bundle, detail, orderId, view, actorRole, accessDenied } = props;
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
    if (view !== "mentor" || actorRole !== "mentor") {
      return "멘토만 납품을 등록할 수 있습니다.";
    }
    const d = disputeLifecycleBlockReason(detail);
    if (d) {
      return d;
    }
    if (isOrderStatusTerminal(orderNorm)) {
      return "종료된 주문입니다.";
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
  const oid = String((o as Row).id ?? "");
  const idForDisplay = String(oid || orderId).trim();

  return (
    <div className={`${ORDER_ROOM_APP_SURFACE_CLASS} w-full`} data-views="custom-order-room">
      <div className={`${ORDER_ROOM_CONTENT_MAX} px-3 pb-4 pt-2 sm:px-4 sm:pb-5 sm:pt-3 lg:px-6 lg:pb-6 lg:pt-4`}>
        <OrderRoomPageHeader detail={detail} view={view} />
        <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-12 lg:items-start">
          <aside className="order-2 min-w-0 space-y-4 lg:order-1 lg:col-span-3 lg:sticky lg:top-4 lg:self-start">
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
          <aside className="order-3 min-w-0 space-y-5 lg:order-3 lg:col-span-3">
            <OrderDeliverablesPanel
              detail={detail}
              orderId={oid}
              view={view}
              actorRole={actorRole}
              mentorDeliverableBlockReason={mentorDeliverableBlockReason}
              orderTerminal={isTerminalOrder}
            />
            {hasRightSettlementBlockContent(detail, o as Row) ? (
              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">정산</p>
                <div className="space-y-3">
                  <OrderPaymentSettlementBlock detail={detail} orderRow={o as Row} />
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
              mentorStartDisabledReason={mentorStartDisabledReason(actorRole, view, o as Row, detail)}
              studentRevisionRequestDisabledReason={revBlock}
              openDisputeApplicationDisabledReason={disputeFormBlock}
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
