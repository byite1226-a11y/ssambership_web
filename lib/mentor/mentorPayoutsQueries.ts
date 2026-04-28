import type { SupabaseClient } from "@supabase/supabase-js";
import { pickExistingColumn } from "@/lib/qna/safeSelect";

type Row = Record<string, unknown>;

function monthBounds(): { start: string; end: string } {
  const d = new Date();
  const start = new Date(d.getFullYear(), d.getMonth(), 1);
  const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
  return { start: start.toISOString(), end: end.toISOString() };
}

function orderPaymentLooksConfirmed(ps: string | null | undefined): boolean {
  if (ps == null || !String(ps).trim()) return false;
  const s = String(ps).trim().toLowerCase();
  return ["paid", "succeeded", "escrowed", "completed", "complete", "success", "captured", "paid_out"].includes(s);
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
  return { table: null, err: "payouts 계열 테이블 읽기 실패" };
}

export type CustomOrderSettlementListItem = {
  id: string;
  custom_request_order_id: string;
  gross_amount: number;
  platform_fee_amount: number;
  mentor_amount: number;
  status: string;
  created_at: string;
  paid_at: string | null;
  /** 주문의 결제 메타(정산 행에 없을 수 있음) */
  orderPaymentStatus: string | null;
  /** 비결제·대기·미기재 등 실제 지급 확정 전 */
  showUnpaidOrderWarning: boolean;
};

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
  /** 맞춤의뢰 정산 예정(1차) */
  customOrderSettlements: { rows: CustomOrderSettlementListItem[]; error: string | null };
};

export async function loadMentorPayoutsPageData(supabase: SupabaseClient, mentorId: string): Promise<MentorPayoutsBundle> {
  const { start, end } = monthBounds();
  const pt = await firstPayoutsTable(supabase);
  let monthExpectedCents = 0;
  let tableRows: Row[] = [];
  let tableHint = "—";
  if (pt.table) {
    const { rows, fk, error: re } = await readRowsForMentor(supabase, pt.table, mentorId, 80);
    tableRows = rows;
    tableHint = fk ? `${pt.table} · ${fk} = user` : `${pt.table} · FK 없음(샘플)`;
    for (const row of rows) {
      if (inMonthRange(row, start, end)) {
        monthExpectedCents += pickAmount(row);
      }
    }
    if (re) {
      tableHint += ` · ${re}`;
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
      if (error) subErr = error.message;
    } else {
      const c = await supabase.from(t).select("*", { count: "exact", head: true });
      subN = c.count ?? 0;
      if (c.error) subErr = c.error.message;
      subHint = "mentor 필터 컬럼 없음(전체 카운트)";
    }
    subHint = `구독 관련: ${t}, 행 ${subN}개`;
    break;
  }
  if (!subTable) subErr = "subscriptions 계열을 읽지 못함";

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
      if (error) cusErr = error.message;
    }
    cusHint = `맞춤의뢰: ${t}, 행 ${cusN}개(수익 컬럼·상태는 후속)`;
    break;
  }
  if (!cusTable) cusErr = "custom_request_orders(후보)를 읽지 못함";

  let customSettlements: CustomOrderSettlementListItem[] = [];
  let customSettlementsErr: string | null = null;
  const { data: cosiData, error: cosiErr } = await supabase
    .from("custom_order_settlement_items")
    .select("id, custom_request_order_id, gross_amount, platform_fee_amount, mentor_amount, status, created_at, paid_at")
    .eq("mentor_id", mentorId)
    .order("created_at", { ascending: false })
    .limit(50);
  if (cosiErr) {
    if (!/relation|does not exist|schema cache/i.test(cosiErr.message)) {
      customSettlementsErr = cosiErr.message;
    }
  } else {
    const list = (cosiData as Row[] | null) ?? [];
    const orderIds = [...new Set(list.map((r) => String(r.custom_request_order_id ?? "")).filter(Boolean))];
    const paymentByOrder = new Map<string, string | null>();
    if (orderIds.length) {
      const { data: ordData, error: ordErr } = await supabase
        .from("custom_request_orders")
        .select("id, payment_status")
        .in("id", orderIds);
      if (!ordErr) {
        for (const o of (ordData as Row[] | null) ?? []) {
          const oid = String(o.id ?? "");
          const raw = o.payment_status;
          const ps =
            raw != null && String(raw).trim()
              ? String(raw).trim()
              : null;
          paymentByOrder.set(oid, ps);
        }
      }
    }
    customSettlements = list.map((r) => {
      const oid = String(r.custom_request_order_id ?? "");
      const orderPaymentStatus = paymentByOrder.get(oid) ?? null;
      const showUnpaidOrderWarning = !orderPaymentLooksConfirmed(orderPaymentStatus);
      return {
        id: String(r.id ?? ""),
        custom_request_order_id: oid,
        gross_amount: num(r.gross_amount),
        platform_fee_amount: num(r.platform_fee_amount),
        mentor_amount: num(r.mentor_amount),
        status: typeof r.status === "string" ? r.status : "—",
        created_at: typeof r.created_at === "string" ? r.created_at : "",
        paid_at: r.paid_at != null && typeof r.paid_at === "string" ? r.paid_at : null,
        orderPaymentStatus,
        showUnpaidOrderWarning,
      };
    });
  }

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
    customOrderSettlements: { rows: customSettlements, error: customSettlementsErr },
  };
}
