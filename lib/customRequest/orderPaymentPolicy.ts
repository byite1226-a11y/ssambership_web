import "server-only";

type Row = Record<string, unknown>;

/**
 * Staging·로컬 E2E용: 비(`paid` 아님) 수락/정산 예정 insert 허용. **이 env만** 우회에 사용한다.
 * - `CUSTOM_ORDER_ALLOW_UNPAID_ACCEPT === "true"` 일 때만 `true` (대소문자 구분, 공백 불가).
 * - `NODE_ENV` / `VERCEL` 등으로 자동 `true` 하지 않는다.
 * - `NODE_ENV=production` 인데 `true`이면(실수로 public 운영에 켤 수 있으므로) 강한 `console.warn` 1회.
 */
export function allowsUnpaidCustomOrderAccept(): boolean {
  const on = process.env.CUSTOM_ORDER_ALLOW_UNPAID_ACCEPT === "true";
  if (on && process.env.NODE_ENV === "production") {
    console.warn(
      "[orderPaymentPolicy] 경고: CUSTOM_ORDER_ALLOW_UNPAID_ACCEPT=true 입니다. production에서 비결제 수락/정산이 열려 있을 수 있으니 배포·환경을 반드시 확인하세요."
    );
  }
  return on;
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
 * PG/정산 메타(배너·event 등) — `insertCustomOrderSettlementIfRequiredBeforeComplete` 등에서 “확인됨” 플래그에 사용.
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
 * `payment_status` / `payment_state` / `pay_status` 중 첫 비어 있지 않은 값(소문자·trim).
 */
function primaryPaymentStatusTokenLower(row: Row | null | undefined): string {
  if (!row) {
    return "";
  }
  for (const k of ["payment_status", "payment_state", "pay_status"] as const) {
    const v = row[k];
    if (v == null) {
      continue;
    }
    const s = String(v).trim().toLowerCase();
    if (s) {
      return s;
    }
  }
  return "";
}

/**
 * 납품 수락 게이트: `payment_status`(및 별칭)가 **`paid` 한 가지**일 때만 “결제 완료”로 본다.
 * `allowsUnpaidCustomOrderAccept()`가 true이면(스테이징 우회) 이 판정을 생략한다.
 */
export function isCustomOrderPaymentStatusStrictlyPaid(row: Row | null | undefined): boolean {
  return primaryPaymentStatusTokenLower(row) === "paid";
}

/**
 * 비(`paid` 아님) 수락·정산 row 생성이 막혀야 하면 `true`.
 * - 우회: `allowsUnpaidCustomOrderAccept()` 만 참고(위 env 1곳); NODE_ENV는 우회에 사용하지 않는다.
 */
export function mustBlockUnpaidAcceptForProduction(orderRow: Row): boolean {
  if (allowsUnpaidCustomOrderAccept()) {
    return false;
  }
  return !isCustomOrderPaymentStatusStrictlyPaid(orderRow);
}
