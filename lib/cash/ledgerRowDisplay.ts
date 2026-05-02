import { getStringField } from "@/lib/qna/safeSelect";

type Row = Record<string, unknown>;

const LEDGER_TYPE_KO: Record<string, string> = {
  refund_approved: "환불 승인",
  subscription_payment: "구독 결제",
  staging_manual_cash_topup_for_subscription_repair_test: "운영 조정(수동 충전)",
  cash_topup: "캐시 충전",
  topup: "충전",
  debit: "차감",
  credit: "적립",
  adjustment: "조정",
  payout: "지급",
  refund: "환불",
};

function looksLikeUuid(s: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(s.trim());
}

function formatKoDateTime(raw: string): string {
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return raw;
  return new Intl.DateTimeFormat("ko-KR", { dateStyle: "medium", timeStyle: "short" }).format(d);
}

export function ledgerAt(row: Row): string {
  const raw = getStringField(row, ["created_at", "inserted_at", "occurred_at", "updated_at", "at"]) ?? "—";
  if (raw === "—") return "—";
  return formatKoDateTime(raw);
}

export function ledgerTypeLabel(row: Row): string {
  const raw = getStringField(row, ["type", "entry_type", "kind", "category", "direction", "action"]) ?? "—";
  if (raw === "—") return "—";
  const key = raw.trim().toLowerCase();
  if (LEDGER_TYPE_KO[key]) return LEDGER_TYPE_KO[key];
  if (key.includes("_")) return key.replace(/_/g, " ");
  return raw;
}

export function ledgerAmountLabel(row: Row): string {
  for (const k of ["delta_cents", "amount_cents", "change_amount", "amount", "value"] as const) {
    if (!(k in row)) continue;
    const v = row[k];
    if (typeof v === "number" && Number.isFinite(v)) {
      if (k === "delta_cents" || k === "amount_cents" || k === "change_amount") {
        const n = v / 100;
        const body = Math.abs(n).toLocaleString("ko-KR", { maximumFractionDigits: 0 });
        return `${n < 0 ? "-" : ""}${body}캐시`;
      }
      return `${v.toLocaleString("ko-KR", { maximumFractionDigits: 0 })}캐시`;
    }
  }
  return "—";
}

export function ledgerReasonLabel(row: Row): string {
  return getStringField(row, ["reason", "description", "note", "memo", "summary", "label", "title"]) ?? "—";
}

/** 주문/결제 연결(있다면) — UUID는 축약 표기 */
export function ledgerOrderOrPaymentRef(row: Row): string {
  const a = getStringField(row, [
    "payment_id",
    "order_id",
    "ref_id",
    "reference_id",
    "external_id",
    "pg_transaction_id",
    "transaction_id",
    "custom_request_order_id",
  ]);
  if (a) {
    if (looksLikeUuid(a)) return `관련 번호 ···${a.slice(-6)}`;
    if (a.length > 24) return `${a.slice(0, 10)}…`;
    return a;
  }
  for (const k of ["metadata", "payload", "data"]) {
    const v = row[k];
    if (typeof v === "string" && v.length < 200) return v.length > 24 ? `${v.slice(0, 12)}…` : v;
  }
  return "—";
}
