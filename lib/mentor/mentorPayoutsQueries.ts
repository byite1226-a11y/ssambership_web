import type { SupabaseClient } from "@supabase/supabase-js";
import {
  normalizedPrimaryOrderStatus,
  orderStatusLabelForUi,
  paymentStatusLabelForUi,
} from "@/lib/customRequest/orderLifecycleConstants";
import { pickExistingColumn } from "@/lib/qna/safeSelect";
import { createServiceRoleClient } from "@/lib/supabase/admin";

type Row = Record<string, unknown>;

const SETTLEMENT_ITEMS_TABLE = "custom_order_settlement_items" as const;
const ORDERS_TABLE = "custom_request_orders" as const;

/** 정산 예정(미지급) — DB CHECK와 맞춤 */
const SETTLEMENT_STATUS_EXPECTED = new Set(["pending", "on_hold", "payable"]);

function looksLikeRlsOrPermission(msg: string): boolean {
  return /permission|RLS|42501|policy|not authorized/i.test(msg);
}

function intAmount(v: unknown): number {
  if (typeof v === "number" && Number.isFinite(v)) return Math.trunc(v);
  if (typeof v === "string") {
    const n = Number(v);
    return Number.isFinite(n) ? Math.trunc(n) : 0;
  }
  return 0;
}

export function formatKrwWon(n: number): string {
  return `${n.toLocaleString("ko-KR")}원`;
}

function pickOrderMentorIdFromRow(o: Row): string | null {
  for (const k of ["mentor_id", "selected_mentor_id", "assigned_mentor_id", "expert_id", "mentor_user_id"] as const) {
    const v = o[k];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return null;
}

function pickPaymentRawForOrder(o: Row): string {
  for (const k of ["payment_status", "payment_state", "pay_status"] as const) {
    const v = o[k];
    if (v == null) continue;
    const s = String(v).trim();
    if (s) return s;
  }
  return "";
}

export type MentorPayoutsSettlementLine = {
  settlement: Row;
  order: Row | null;
  workroomHref: string;
  orderStatusLabel: string;
  orderPaymentLabel: string;
};

export type MentorSettlementPayoutsBlock = {
  lines: MentorPayoutsSettlementLine[];
  error: string | null;
  probe: string;
  /** 세션 조회 실패 후 RLS로 판단될 때만 service_role 재시도(mentor_id 동일) */
  loadedVia: "session" | "service_role" | "none";
  totals: {
    /** pending / on_hold / payable 멘토 정산액 합 */
    expectedMentorAmount: number;
    /** status === paid 멘토 정산액 합 */
    paidMentorAmount: number;
    count: number;
  };
};

/**
 * 멘토 본인 `mentor_id` 행만. RLS 실패 시에만 service_role로 동일 조건 재조회.
 */
export async function loadMentorSettlementItemsForPayouts(
  supabase: SupabaseClient,
  mentorId: string
): Promise<MentorSettlementPayoutsBlock> {
  const { error: pe } = await supabase.from(SETTLEMENT_ITEMS_TABLE).select("id").limit(1);
  if (pe && /relation|does not exist|schema cache/i.test(pe.message)) {
    return {
      lines: [],
      error: null,
      probe: "정산 안내를 준비 중입니다.",
      loadedVia: "none",
      totals: { expectedMentorAmount: 0, paidMentorAmount: 0, count: 0 },
    };
  }

  const runSelect = async (client: SupabaseClient) =>
    client
      .from(SETTLEMENT_ITEMS_TABLE)
      .select("*")
      .eq("mentor_id", mentorId)
      .order("created_at", { ascending: false })
      .limit(200);

  let raw: Row[] = [];
  let err: string | null = null;
  let via: MentorSettlementPayoutsBlock["loadedVia"] = "session";

  const u1 = await runSelect(supabase);
  if (!u1.error) {
    raw = (u1.data as Row[]) ?? [];
  } else {
    err = u1.error.message;
    if (looksLikeRlsOrPermission(err)) {
      try {
        const admin = createServiceRoleClient();
        const a1 = await runSelect(admin);
        if (!a1.error) {
          raw = (a1.data as Row[]) ?? [];
          err = null;
          via = "service_role";
        } else {
          err = a1.error.message;
        }
      } catch (e) {
        const m = e instanceof Error ? e.message : String(e);
        if (/SUPABASE_SERVICE_ROLE_KEY|createServiceRoleClient/i.test(m)) {
          err = u1.error.message;
        }
      }
    }
  }

  if (err) {
    return {
      lines: [],
      error: err,
      probe: "",
      loadedVia: "none",
      totals: { expectedMentorAmount: 0, paidMentorAmount: 0, count: 0 },
    };
  }

  let expectedMentorAmount = 0;
  let paidMentorAmount = 0;
  for (const r of raw) {
    const ma = intAmount(r.mentor_amount);
    const st = String(r.status ?? "").trim().toLowerCase();
    if (st === "paid") {
      paidMentorAmount += ma;
    } else if (SETTLEMENT_STATUS_EXPECTED.has(st)) {
      expectedMentorAmount += ma;
    }
  }

  const orderIds = [
    ...new Set(
      raw
        .map((r) => (typeof r.custom_request_order_id === "string" ? r.custom_request_order_id.trim() : ""))
        .filter(Boolean)
    ),
  ];

  const orderById = new Map<string, Row>();
  if (orderIds.length > 0) {
    const { error: oe } = await supabase.from(ORDERS_TABLE).select("id").limit(1);
    if (!oe) {
      const oq = await supabase.from(ORDERS_TABLE).select("*").in("id", orderIds);
      if (!oq.error && oq.data) {
        for (const o of oq.data as Row[]) {
          const id = typeof o.id === "string" ? o.id : null;
          if (!id) continue;
          if (pickOrderMentorIdFromRow(o) !== mentorId) {
            continue;
          }
          orderById.set(id, o);
        }
      }
    }
  }

  const lines: MentorPayoutsSettlementLine[] = raw.map((settlement) => {
    const oid =
      typeof settlement.custom_request_order_id === "string" ? settlement.custom_request_order_id.trim() : "";
    const order = oid ? orderById.get(oid) ?? null : null;
    const norm = order ? normalizedPrimaryOrderStatus(order) : "";
    const orderStatusLabel = norm ? orderStatusLabelForUi(norm) : "—";
    const payRaw = order ? pickPaymentRawForOrder(order) : "";
    const orderPaymentLabel = payRaw ? paymentStatusLabelForUi(payRaw) : "—";
    const workroomHref = oid ? `/custom-request/orders/${encodeURIComponent(oid)}` : "/custom-request/orders";
    return { settlement, order, workroomHref, orderStatusLabel, orderPaymentLabel };
  });

  const probe =
    lines.length > 0
      ? "완료된 맞춤의뢰 주문의 정산 예정 금액입니다. 완료된 주문은 정산 예정 금액에 반영됩니다."
      : "정산 데이터가 아직 없습니다.";

  return {
    lines,
    error: null,
    probe,
    loadedVia: via,
    totals: {
      expectedMentorAmount,
      paidMentorAmount,
      count: raw.length,
    },
  };
}

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

/** 맞춤의뢰 쪽에서 읽어 온 정산·주문 후보 행(읽기 전용, 기존 custom 주문 조회와 동일 소스) */
export type CustomOrderSettlementsBlock = {
  rows: Row[];
  error: string | null;
  table: string | null;
};

export type MentorPayoutsBundle = {
  payoutTable: string | null;
  payoutError: string | null;
  /** 이번 달 예상(= payouts 행 합, 기간·컬럼은 추정) */
  monthExpectedCents: number;
  subSummary: { n: number; amountHint: string; error: string | null; table: string | null };
  customSummary: { n: number; amountHint: string; error: string | null; table: string | null };
  customOrderSettlements: CustomOrderSettlementsBlock;
  /** 맞춤의뢰 정산 예정·지급 완료 행 */
  settlementPayouts: MentorSettlementPayoutsBlock;
  tableRows: Row[];
  tableHint: string;
  periodStart: string;
  periodEnd: string;
};

export async function loadMentorPayoutsPageData(supabase: SupabaseClient, mentorId: string): Promise<MentorPayoutsBundle> {
  const { start, end } = monthBounds();
  const settlementPayouts = await loadMentorSettlementItemsForPayouts(supabase, mentorId);
  const pt = await firstPayoutsTable(supabase);
  let monthExpectedCents = 0;
  let tableRows: Row[] = [];
  let tableHint = "이번 달 기준으로 예상되는 지급·정산 금액이에요.";
  if (pt.table) {
    const { rows, fk, error: re } = await readRowsForMentor(supabase, pt.table, mentorId, 80);
    tableRows = rows;
    tableHint = fk
      ? "이번 달 기준으로 예상되는 지급·정산 금액이에요."
      : "이번 달 예상 금액은 일부 항목만 반영됐을 수 있어요.";
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
  let customOrderSettlementRows: Row[] = [];
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
      customOrderSettlementRows = (data as Row[] | null) ?? [];
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
    customOrderSettlements: { rows: customOrderSettlementRows, error: cusErr, table: cusTable },
    settlementPayouts,
    tableRows,
    tableHint,
    periodStart: start,
    periodEnd: end,
  };
}
