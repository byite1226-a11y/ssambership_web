import "server-only";

type Row = Record<string, unknown>;

/**
 * 스테이징/개발 E2E: 비결제 주문 수락 허용.
 * - `NODE_ENV !== "production"` 이면 기본 허용
 * - 프로덕션 프리뷰 등 `NODE_ENV`가 production이면 `CUSTOM_ORDER_ALLOW_UNPAID_ACCEPT=true`로 명시
 */
export function allowsUnpaidCustomOrderAccept(): boolean {
  if (process.env.CUSTOM_ORDER_ALLOW_UNPAID_ACCEPT === "true") {
    return true;
  }
  return process.env.NODE_ENV !== "production";
}

const PAYMENT_CONFIRMED = new Set([
  "paid",
  "succeeded",
  "escrowed",
  "completed",
  "complete",
  "success",
  "captured",
  "paid_out",
]);

/**
 * PG 미연동·스키마 가정: `custom_request_orders` 등에 있는 결제 메타로 “확인됨” 여부.
 */
export function isCustomOrderPaymentConfirmed(orderRow: Row | null | undefined): boolean {
  if (!orderRow) return false;
  for (const k of ["payment_status", "payment_state", "pg_payment_status"] as const) {
    const v = orderRow[k];
    if (v == null) continue;
    const s = String(v).trim().toLowerCase();
    if (s && PAYMENT_CONFIRMED.has(s)) {
      return true;
    }
  }
  return false;
}

/**
 * 운영에서 비결제 수락/정산 row 생성을 막을지(스테이징은 `allowsUnpaidCustomOrderAccept`로 열 수 있음).
 */
export function mustBlockUnpaidAcceptForProduction(orderRow: Row): boolean {
  if (allowsUnpaidCustomOrderAccept()) {
    return false;
  }
  return !isCustomOrderPaymentConfirmed(orderRow);
}
