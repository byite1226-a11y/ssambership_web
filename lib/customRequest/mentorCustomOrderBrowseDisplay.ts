/**
 * 멘토 맞춤의뢰 주문 목록·카드용 표시 헬퍼 (클라이언트 번들 안전).
 * — Supabase / server-only 모듈을 import하지 않습니다.
 */
import {
  isOrderRowPaymentConfirmedForMentorWork,
  normalizedPrimaryOrderStatus,
  orderStatusLabelForUi,
  paymentStatusBadgeLabelForRaw,
  paymentStatusLabelForUi,
} from "@/lib/customRequest/orderLifecycleConstants";
import type { MentorOrderBrowseTabId } from "@/lib/customRequest/mentorOrderBrowseTabClassify";

type Row = Record<string, unknown>;

/** 목록·카드: open/under_review 분쟁을 최우선, 다음 결제 미확인 시 결제 대기. */
export function mentorCustomOrderStatusHeadline(row: Row, activeDisputeOrderIds?: ReadonlySet<string> | null): string {
  const id = typeof row.id === "string" && row.id.trim() ? row.id.trim() : "";
  if (activeDisputeOrderIds && id && activeDisputeOrderIds.has(id)) {
    return "해결 요청 검토 중";
  }
  if (!isOrderRowPaymentConfirmedForMentorWork(row)) {
    return "결제 대기 · 진행 대기";
  }
  const norm = normalizedPrimaryOrderStatus(row);
  if (!norm) {
    return "진행 중";
  }
  return orderStatusLabelForUi(norm);
}

export function mentorCustomOrderWorkroomHref(orderId: string): string {
  return `/custom-request/orders/${encodeURIComponent(orderId)}`;
}

/** 수락된 의뢰 카드·작업방 CTA 라벨 (상태별) */
export function mentorCustomOrderWorkroomCtaLabel(
  tab: MentorOrderBrowseTabId,
  row?: Row
): string {
  if (tab === "done") return "완료 내역 보기";
  if (tab === "billing") return "작업방 입장";
  if (tab === "work" || tab === "revision") return "이어서 작업하기";
  if (tab === "delivery") {
    const norm = row ? normalizedPrimaryOrderStatus(row) : "";
    if (
      norm === "waiting_review" ||
      norm === "pending_review" ||
      norm === "in_review" ||
      norm === "delivery_submitted"
    ) {
      return "확인 상태 보기";
    }
    return "납품 관리";
  }
  if (tab === "dispute") return "작업방 보기";
  return "작업방 입장";
}

export function mentorCustomOrderPaymentLine(row: Row): string {
  for (const k of ["payment_status", "payment_state", "pay_status"] as const) {
    const v = row[k];
    if (v == null) continue;
    const s = String(v).trim();
    if (!s) continue;
    return paymentStatusLabelForUi(s);
  }
  return "결제 정보 없음";
}

export function mentorCustomOrderPaymentBadge(row: Row): string {
  for (const k of ["payment_status", "payment_state", "pay_status"] as const) {
    const v = row[k];
    if (v == null) continue;
    const s = String(v).trim();
    if (!s) continue;
    return paymentStatusBadgeLabelForRaw(s);
  }
  return "—";
}
