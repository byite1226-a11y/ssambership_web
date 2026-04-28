import "server-only";

type Row = Record<string, unknown>;

/**
 * 비결제(unpaid) 주문의 납품 수락·정산 row 생성을 허용할지 — **이 플래그만** 사용합니다.
 * - `CUSTOM_ORDER_ALLOW_UNPAID_ACCEPT=true` 인 경우에만 허용.
 * - 로컬/스테이징 E2E도 위 env를 켜야 하며, `NODE_ENV`로는 자동 허용하지 않습니다.
 * - production에서 env가 없거나 `false`이면 PG 미연동 시 비결제 수락이 막힙니다.
 */
export function allowsUnpaidCustomOrderAccept(): boolean {
  return process.env.CUSTOM_ORDER_ALLOW_UNPAID_ACCEPT === "true";
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
 * 비결제 수락/정산 row 생성이 막혀야 하면 true.
 * - `allowsUnpaidCustomOrderAccept()`가 false이고 결제가 확인되지 않은 주문.
 */
export function mustBlockUnpaidAcceptForProduction(orderRow: Row): boolean {
  if (allowsUnpaidCustomOrderAccept()) {
    return false;
  }
  return !isCustomOrderPaymentConfirmed(orderRow);
}
