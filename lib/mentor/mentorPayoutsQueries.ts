import type { SupabaseClient } from "@supabase/supabase-js";
import { pickExistingColumn } from "@/lib/qna/safeSelect";

type Row = Record<string, unknown>;

function monthBounds(): { start: string; end: string } {
  const d = new Date();
  const start = new Date(d.getFullYear(), d.getMonth(), 1);
  const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
  return { start: start.toISOString(), end: end.toISOString() };
}

function num(v: unknown): number {
  if (typeof v === "number" && !Number.isNaN(v)) return v;
  if (typeof v === "string") {
    const n = Number(v);
    return Number.isNaN(n) ? 0 : n;
  }
  return 0;
}

function pickAmount(row: Row): number {
  for (const k of ["amount_cents", "payout_cents", "net_cents", "amount", "payout_amount", "value", "revenue_cents"] as const) {
    if (k in row) return num(row[k]);
  }
  return 0;
}

function inMonthRange(row: Row, start: string, end: string): boolean {
  for (const k of ["created_at", "payout_at", "period_start", "settlement_date", "updated_at"]) {
    if (k in row && typeof row[k] === "string") {
      const t = row[k] as string;
      if (t >= start.slice(0, 10) && t <= end) return true;
      if (t >= start && t <= end) return true;
    }
  }
  return true;
}

async function readRowsForMentor(
  supabase: SupabaseClient,
  table: string,
  mentorId: string,
  limit: number
): Promise<{ rows: Row[]; fk: string | null; error: string | null }> {
  const { column: fk, error: ce } = await pickExistingColumn(supabase, table, [
    "mentor_id",
    "mentor_user_id",
    "expert_id",
    "user_id",
    "payee_id",
  ]);
  if (!fk) {
    const { data, error } = await supabase.from(table).select("*").limit(Math.min(50, limit));
    return { rows: (data as Row[]) ?? [], fk: null, error: error?.message ?? ce ?? null };
  }
  const { data, error } = await supabase
    .from(table)
    .select("*")
    .eq(fk, mentorId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) {
    if (!/order|column/i.test(error.message)) {
      return { rows: [], fk, error: error.message };
    }
    const fb = await supabase.from(table).select("*").eq(fk, mentorId).limit(limit);
    return { rows: (fb.data as Row[]) ?? [], fk, error: fb.error?.message ?? null };
  }
  return { rows: (data as Row[]) ?? [], fk, error: null };
}

async function firstPayoutsTable(
  supabase: SupabaseClient
): Promise<{ table: string | null; err: string }> {
  for (const t of ["payouts", "mentor_payouts", "payout_lines", "payout_batch_items", "mentor_ledger_lines"] as const) {
    const { error } = await supabase.from(t).select("id").limit(1);
    if (!error) return { table: t, err: "" };
  }
  return { table: null, err: "정산 내역을 아직 찾을 수 없어요" };
}

export type MentorPayoutsBundle = {
  payoutTable: string | null;
  payoutError: string | null;
  /** 이번 달 예상(= payouts 행 합, 기간·컬럼은 추정) */
  monthExpectedCents: number;
  subSummary: { n: number; amountHint: string; error: string | null; table: string | null };
  customSummary: { n: number; amountHint: string; error: string | null; table: string | null };
  tableRows: Row[];
  tableHint: string;
  periodStart: string;
  periodEnd: string;
};

export async function loadMentorPayoutsPageData(supabase: SupabaseClient, mentorId: string): Promise<MentorPayoutsBundle> {
  const { start, end } = monthBounds();
  const pt = await firstPayoutsTable(supabase);
  let monthExpectedCents = 0;
  let tableRows: Row[] = [];
  let tableHint = "이번 달 정산(예상)에 반영된 지급 내역이에요";
  if (pt.table) {
    const { rows, fk, error: re } = await readRowsForMentor(supabase, pt.table, mentorId, 80);
    tableRows = rows;
    tableHint = fk
      ? "이번 달 정산(예상)에 반영된 지급 내역이에요"
      : "이번 달 정산(예상)에 일부 샘플을 반영했어요";
    for (const row of rows) {
      if (inMonthRange(row, start, end)) {
        monthExpectedCents += pickAmount(row);
      }
    }
    if (re) {
      tableHint = "정산 내역을 모두 불러오지 못했어요. 잠시 후 다시 시도해 주세요";
    }
  }

  let subN = 0;
  let subHint = "—";
  let subErr: string | null = null;
  let subTable: string | null = null;
  for (const t of ["subscription_revenue_ledger", "mentor_subscriptions", "subscriptions"] as const) {
    const { error: pe } = await supabase.from(t).select("id").limit(1);
    if (pe) continue;
    subTable = t;
    const { column: mc } = await pickExistingColumn(supabase, t, ["mentor_id", "mentor_user_id", "provider_id", "expert_id"]);
    if (mc) {
      const { data, count, error } = await supabase
        .from(t)
        .select("*", { count: "exact" })
        .eq(mc, mentorId)
        .limit(20);
      subN = count ?? (data as Row[] | null)?.length ?? 0;
      if (error) subErr = "구독·수익 항목을 집계하는 중 문제가 있어요";
    } else {
      const c = await supabase.from(t).select("*", { count: "exact", head: true });
      subN = c.count ?? 0;
      if (c.error) subErr = "구독·수익 항목을 집계하는 중 문제가 있어요";
      subHint = "구독·수익과 연결된 항목을 집계했어요";
    }
    subHint = `구독·수익 관련 항목 ${subN}건이에요`;
    break;
  }
  if (!subTable) subErr = "구독·수익 정보를 불러오지 못했어요";

  let cusN = 0;
  let cusHint = "—";
  let cusErr: string | null = null;
  let cusTable: string | null = null;
  for (const t of ["custom_request_orders", "custom_order_payments"] as const) {
    const { error: pe } = await supabase.from(t).select("id").limit(1);
    if (pe) continue;
    cusTable = t;
    const { column: mc } = await pickExistingColumn(supabase, t, ["mentor_id", "mentor_user_id", "expert_id", "assignee_id"] as const);
    if (mc) {
      const { data, count, error } = await supabase
        .from(t)
        .select("*", { count: "exact" })
        .eq(mc, mentorId)
        .limit(20);
      cusN = count ?? (data as Row[] | null)?.length ?? 0;
      if (error) cusErr = "맞춤의뢰 주문을 집계하는 중 문제가 있어요";
    }
    cusHint = `맞춤의뢰 주문 ${cusN}건이에요`;
    break;
  }
  if (!cusTable) cusErr = "맞춤의뢰 주문을 불러오지 못했어요";

  return {
    payoutTable: pt.table,
    payoutError: pt.table ? null : pt.err || "—",
    monthExpectedCents,
    subSummary: { n: subN, amountHint: subHint, error: subErr, table: subTable },
    customSummary: { n: cusN, amountHint: cusHint, error: cusErr, table: cusTable },
    tableRows,
    tableHint,
    periodStart: start,
    periodEnd: end,
  };
}
