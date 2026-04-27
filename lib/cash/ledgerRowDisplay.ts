import { getStringField } from "@/lib/qna/safeSelect";

type Row = Record<string, unknown>;

function numish(v: unknown): string {
  if (v === null || v === undefined) return "—";
  if (typeof v === "number" && Number.isFinite(v)) return String(v);
  if (typeof v === "string" && v.trim()) return v;
  return "—";
}

export function ledgerAt(row: Row): string {
  return getStringField(row, ["created_at", "inserted_at", "occurred_at", "updated_at", "at"]) ?? "—";
}

export function ledgerTypeLabel(row: Row): string {
  return getStringField(row, ["type", "entry_type", "kind", "category", "direction", "action"]) ?? "—";
}

export function ledgerAmountLabel(row: Row): string {
  for (const k of ["amount_cents", "amount", "value", "delta_cents", "change_amount"]) {
    if (k in row) return numish(row[k]);
  }
  return "—";
}

export function ledgerReasonLabel(row: Row): string {
  return getStringField(row, ["reason", "description", "note", "memo", "summary", "label", "title"]) ?? "—";
}

/** 주문/결제 연결(있다면) */
export function ledgerOrderOrPaymentRef(row: Row): string {
  const a = getStringField(row, [
    "payment_id",
    "order_id",
    "ref_id",
    "reference_id",
    "external_id",
    "pg_transaction_id",
    "transaction_id",
  ]);
  if (a) return a;
  for (const k of ["metadata", "payload", "data"]) {
    const v = row[k];
    if (typeof v === "string" && v.length < 200) return v;
  }
  return "—";
}
