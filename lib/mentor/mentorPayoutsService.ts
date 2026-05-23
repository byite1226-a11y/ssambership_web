import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { pickExistingColumn } from "@/lib/qna/safeSelect";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { loadMentorSettlementItemsForPayouts } from "@/lib/mentor/mentorPayoutsQueries";
import {
  DEFAULT_MASKED_BANK_DISPLAY,
  MENTOR_CUSTOM_REQUEST_SHARE,
  MENTOR_SUBSCRIPTION_PLATFORM_SHARE,
  MENTOR_SUBSCRIPTION_SHARE,
  minorUnitsToCash,
} from "@/lib/mentor/mentorPayoutsConstants";
import { buildPayoutScheduleInfo, detailLineToSettlementRow } from "@/lib/mentor/mentorPayoutsDisplay";
import type {
  MentorPayoutDetailLine,
  MentorPayoutDetailResult,
  MentorPayoutMonthlyCard,
  MentorPayoutPerformanceRow,
  MentorPayoutScheduleInfo,
  MentorPayoutSettlementTableRow,
  MentorPayoutSummary,
  MentorPayoutsPageData,
  PayoutLineType,
  PayoutUiStatus,
} from "@/lib/mentor/mentorPayoutsTypes";

export type {
  MentorPayoutDetailLine,
  MentorPayoutDetailResult,
  MentorPayoutMonthlyCard,
  MentorPayoutPerformanceRow,
  MentorPayoutScheduleInfo,
  MentorPayoutSettlementTableRow,
  MentorPayoutSummary,
  MentorPayoutsPageData,
  PayoutLineType,
  PayoutUiStatus,
};

export {
  buildPayoutScheduleInfo,
  detailLineToSettlementRow,
  formatChartMonthLabel,
  formatPayoutDateLabel,
  formatYearMonthLabel,
} from "@/lib/mentor/mentorPayoutsDisplay";

type Row = Record<string, unknown>;

function ymKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function monthStartEnd(ym: string): { start: string; end: string } {
  const [y, m] = ym.split("-").map(Number);
  const start = new Date(y, m - 1, 1);
  const end = new Date(y, m, 0, 23, 59, 59, 999);
  return { start: start.toISOString(), end: end.toISOString() };
}

function currentYm(): string {
  return ymKey(new Date());
}

function inYm(iso: string, ym: string): boolean {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return false;
  return ymKey(d) === ym;
}

function pickTs(row: Row): string {
  for (const k of ["created_at", "paid_at", "updated_at", "completed_at"]) {
    const v = row[k];
    if (typeof v === "string" && v) return v;
  }
  return new Date().toISOString();
}

function intWon(v: unknown): number {
  if (typeof v === "number" && Number.isFinite(v)) return Math.trunc(v);
  if (typeof v === "string") {
    const n = Number(v.replace(/,/g, ""));
    return Number.isFinite(n) ? Math.trunc(n) : 0;
  }
  return 0;
}

function orderGrossWon(order: Row | null): number {
  if (!order) return 0;
  for (const k of ["agreed_price", "final_price", "paid_amount", "amount", "price", "total_amount"]) {
    const n = intWon(order[k]);
    if (n > 0) return n;
  }
  return 0;
}

function maskBankDisplay(bank: string | null, account: string | null): string {
  if (!bank && !account) return DEFAULT_MASKED_BANK_DISPLAY;
  const b = (bank ?? "은행").trim();
  const a = (account ?? "").replace(/\D/g, "");
  if (a.length >= 4) {
    const head = a.slice(0, 4);
    const tail = a.slice(-3);
    return `${b} ${head}-**-****${tail}`;
  }
  return `${b} ****`;
}

async function readClient(supabase: SupabaseClient): Promise<SupabaseClient> {
  return supabase;
}

async function subscriptionIdsForMentor(client: SupabaseClient, mentorId: string): Promise<string[]> {
  const { data, error } = await client.from("subscriptions").select("id").eq("mentor_id", mentorId).limit(500);
  if (error || !data) return [];
  return (data as Row[]).map((r) => String(r.id ?? "")).filter(Boolean);
}

async function loadSubscriptionLines(client: SupabaseClient, mentorId: string): Promise<MentorPayoutDetailLine[]> {
  const subIds = await subscriptionIdsForMentor(client, mentorId);
  if (!subIds.length) return [];

  let ledger: Row[] = [];
  const q = await client
    .from("cash_ledger")
    .select("*")
    .eq("reason", "subscription_payment")
    .eq("ref_type", "subscriptions")
    .in("ref_id", subIds.slice(0, 200))
    .order("created_at", { ascending: false })
    .limit(300);

  if (!q.error && q.data) {
    ledger = q.data as Row[];
  } else {
    try {
      const admin = createServiceRoleClient();
      const a = await admin
        .from("cash_ledger")
        .select("*")
        .eq("reason", "subscription_payment")
        .eq("ref_type", "subscriptions")
        .in("ref_id", subIds.slice(0, 200))
        .order("created_at", { ascending: false })
        .limit(300);
      if (!a.error && a.data) ledger = a.data as Row[];
    } catch {
      /* ignore */
    }
  }

  return ledger.map((r) => {
    const payment = minorUnitsToCash(intWon(r.delta_cents));
    const fee = Math.floor(payment * MENTOR_SUBSCRIPTION_PLATFORM_SHARE);
    const net = Math.floor(payment * MENTOR_SUBSCRIPTION_SHARE);
    const subId = String(r.ref_id ?? "");
    return {
      id: `sub-${String(r.id ?? subId)}`,
      type: "subscription" as const,
      date: pickTs(r),
      description: `구독 결제${subId ? ` · ${subId.slice(0, 8)}` : ""}`,
      paymentAmount: payment,
      feeAmount: fee,
      netAmount: net,
      status: "정산예정",
    };
  });
}

async function loadCustomRequestLines(client: SupabaseClient, mentorId: string): Promise<MentorPayoutDetailLine[]> {
  const settlement = await loadMentorSettlementItemsForPayouts(client, mentorId);
  const fromSettlement: MentorPayoutDetailLine[] = settlement.lines.map(({ settlement: s, order }) => {
    const gross = intWon(s.gross_amount) || orderGrossWon(order);
    const payment = gross > 0 ? gross : intWon(s.mentor_amount) + intWon(s.platform_fee_amount);
    const net = intWon(s.mentor_amount) || Math.floor(payment * MENTOR_CUSTOM_REQUEST_SHARE);
    const fee = intWon(s.platform_fee_amount) || payment - net;
    const st = String(s.status ?? "").toLowerCase();
    const status =
      st === "paid" ? "지급완료" : st === "on_hold" ? "보류" : st === "payable" ? "지급가능" : "정산예정";
    const oid = String(s.custom_request_order_id ?? "");
    return {
      id: `cr-${String(s.id ?? oid)}`,
      type: "custom_request" as const,
      date: pickTs(s),
      description: oid ? `맞춤의뢰 주문 · ${oid.slice(0, 8)}` : "맞춤의뢰 주문",
      paymentAmount: payment,
      feeAmount: fee,
      netAmount: net,
      status,
    };
  });

  const seenOrder = new Set(
    settlement.lines
      .map(({ settlement: s }) => String(s.custom_request_order_id ?? ""))
      .filter(Boolean)
  );

  const { data: orders, error } = await client
    .from("custom_request_orders")
    .select("*")
    .eq("mentor_id", mentorId)
    .in("status", ["completed", "complete", "done", "accepted"])
    .order("created_at", { ascending: false })
    .limit(200);

  if (error || !orders) return fromSettlement;

  const extra: MentorPayoutDetailLine[] = [];
  for (const o of orders as Row[]) {
    const oid = String(o.id ?? "");
    if (!oid || seenOrder.has(oid)) continue;
    const payment = orderGrossWon(o);
    if (payment <= 0) continue;
    const net = Math.floor(payment * MENTOR_CUSTOM_REQUEST_SHARE);
    const fee = payment - net;
    extra.push({
      id: `cro-${oid}`,
      type: "custom_request",
      date: pickTs(o),
      description: `맞춤의뢰 완료 · ${oid.slice(0, 8)}`,
      paymentAmount: payment,
      feeAmount: fee,
      netAmount: net,
      status: "정산예정",
    });
  }

  return [...fromSettlement, ...extra];
}

function sumNet(lines: MentorPayoutDetailLine[], ym?: string): number {
  return lines
    .filter((l) => (ym ? inYm(l.date, ym) : true))
    .reduce((a, l) => a + l.netAmount, 0);
}

function sumNetByType(lines: MentorPayoutDetailLine[], type: PayoutLineType, ym?: string): number {
  return lines
    .filter((l) => l.type === type && (ym ? inYm(l.date, ym) : true))
    .reduce((a, l) => a + l.netAmount, 0);
}

export async function loadMentorPayoutBankAccount(
  supabase: SupabaseClient,
  mentorId: string
): Promise<{ display: string; editable: boolean; bankName: string | null; accountRaw: string | null }> {
  const bankCol = await pickExistingColumn(supabase, "mentor_profiles", [
    "payout_bank_name",
    "bank_name",
  ]);
  const acctCol = await pickExistingColumn(supabase, "mentor_profiles", [
    "payout_account_number",
    "bank_account_number",
    "account_number",
  ]);

  if (!bankCol.column && !acctCol.column) {
    return { display: DEFAULT_MASKED_BANK_DISPLAY, editable: false, bankName: null, accountRaw: null };
  }

  const cols = [bankCol.column, acctCol.column].filter(Boolean).join(", ");
  const { data } = await supabase.from("mentor_profiles").select(cols).eq("user_id", mentorId).maybeSingle();
  const row = (data as Row | null) ?? {};
  const bankName = bankCol.column ? String(row[bankCol.column] ?? "").trim() || null : null;
  const accountRaw = acctCol.column ? String(row[acctCol.column] ?? "").trim() || null : null;
  return {
    display: maskBankDisplay(bankName, accountRaw),
    editable: Boolean(bankCol.column && acctCol.column),
    bankName,
    accountRaw,
  };
}

export async function loadMentorPayoutSummary(supabase: SupabaseClient, mentorId: string): Promise<MentorPayoutSummary> {
  const client = await readClient(supabase);
  const ym = currentYm();
  const [subLines, crLines, bank, settlement] = await Promise.all([
    loadSubscriptionLines(client, mentorId),
    loadCustomRequestLines(client, mentorId),
    loadMentorPayoutBankAccount(client, mentorId),
    loadMentorSettlementItemsForPayouts(client, mentorId),
  ]);

  const all = [...subLines, ...crLines];
  const thisMonthSubscription = sumNetByType(all, "subscription", ym);
  const thisMonthCustomRequest = sumNetByType(all, "custom_request", ym);
  const thisMonthRevenue = thisMonthSubscription + thisMonthCustomRequest;

  const paidThisMonth = settlement.lines
    .filter(({ settlement: s }) => String(s.status ?? "").toLowerCase() === "paid" && inYm(pickTs(s), ym))
    .reduce((a, { settlement: s }) => a + intWon(s.mentor_amount), 0);

  const expectedThisMonth = settlement.lines
    .filter(({ settlement: s }) => {
      const st = String(s.status ?? "").toLowerCase();
      return ["pending", "on_hold", "payable"].includes(st) && inYm(pickTs(s), ym);
    })
    .reduce((a, { settlement: s }) => a + intWon(s.mentor_amount), 0);

  const thisMonthScheduledPayout =
    expectedThisMonth > 0 ? expectedThisMonth : Math.max(0, thisMonthRevenue - paidThisMonth);

  return {
    thisMonthRevenue,
    thisMonthScheduledPayout,
    thisMonthSubscription,
    thisMonthCustomRequest,
    lifetimeSubscription: sumNetByType(all, "subscription"),
    lifetimeCustomRequest: sumNetByType(all, "custom_request"),
    bankDisplay: bank.display,
    bankEditable: bank.editable,
  };
}

export async function loadMentorPayoutMonthlyCards(
  supabase: SupabaseClient,
  mentorId: string,
  months = 6
): Promise<MentorPayoutMonthlyCard[]> {
  const client = await readClient(supabase);
  const [subLines, crLines, settlement] = await Promise.all([
    loadSubscriptionLines(client, mentorId),
    loadCustomRequestLines(client, mentorId),
    loadMentorSettlementItemsForPayouts(client, mentorId),
  ]);
  const all = [...subLines, ...crLines];

  const cards: MentorPayoutMonthlyCard[] = [];
  const now = new Date();
  for (let i = 0; i < months; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const ym = ymKey(d);
    const revenue = sumNet(all, ym);
    const paidInMonth = settlement.lines
      .filter(({ settlement: s }) => String(s.status ?? "").toLowerCase() === "paid" && inYm(pickTs(s), ym))
      .reduce((a, { settlement: s }) => a + intWon(s.mentor_amount), 0);
    const pendingInMonth = settlement.lines
      .filter(({ settlement: s }) => {
        const st = String(s.status ?? "").toLowerCase();
        return ["pending", "on_hold", "payable"].includes(st) && inYm(pickTs(s), ym);
      })
      .reduce((a, { settlement: s }) => a + intWon(s.mentor_amount), 0);

    const scheduledPayout = pendingInMonth > 0 ? pendingInMonth : Math.max(0, revenue - paidInMonth);
    const status: MentorPayoutMonthlyCard["status"] =
      paidInMonth > 0 && scheduledPayout === 0 ? "paid" : revenue > 0 || scheduledPayout > 0 ? "scheduled" : "scheduled";

    cards.push({
      yearMonth: ym,
      label: `${d.getFullYear()}년 ${d.getMonth() + 1}월`,
      revenue,
      scheduledPayout,
      status: paidInMonth > 0 && scheduledPayout <= 0 ? "paid" : "scheduled",
    });
  }
  return cards;
}

function pctChange(current: number, previous: number): number | null {
  if (previous === 0) return current > 0 ? 100 : current === 0 ? 0 : null;
  return Math.round(((current - previous) / previous) * 1000) / 10;
}

function prevYm(ym: string): string {
  const [y, m] = ym.split("-").map(Number);
  const d = new Date(y, m - 2, 1);
  return ymKey(d);
}

async function loadLifetimePaidPayouts(client: SupabaseClient, mentorId: string): Promise<number> {
  for (const table of ["payouts", "mentor_payouts"] as const) {
    const { error: pe } = await client.from(table).select("id").limit(1);
    if (pe) continue;
    const mentorCol = await pickExistingColumn(client, table, [
      "mentor_id",
      "mentor_user_id",
      "user_id",
    ]);
    if (!mentorCol.column) continue;
    const { data, error } = await client
      .from(table)
      .select("*")
      .eq(mentorCol.column, mentorId)
      .in("status", ["paid", "completed", "done"])
      .limit(500);
    if (error || !data) continue;
    return (data as Row[]).reduce((sum, r) => {
      for (const k of ["amount", "amount_cents", "net_amount", "payout_amount", "mentor_amount"]) {
        const n = intWon(r[k]);
        if (n > 0) return sum + (k.includes("cent") ? minorUnitsToCash(n) : n);
      }
      return sum;
    }, 0);
  }
  const settlement = await loadMentorSettlementItemsForPayouts(client, mentorId);
  return settlement.totals.paidMentorAmount;
}

function orderTitle(o: Row): string {
  for (const k of ["title", "subject", "post_title", "request_title"]) {
    const v = o[k];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return "맞춤의뢰 주문";
}

function orderStudentName(o: Row): string {
  for (const k of ["student_name", "student_nickname", "buyer_name"]) {
    const v = o[k];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return "학생";
}

function orderPerfStatus(o: Row): MentorPayoutPerformanceRow["uiStatus"] {
  const st = String(o.status ?? "").toLowerCase();
  if (["cancelled", "canceled", "refunded", "dispute"].some((x) => st.includes(x))) return "cancelled";
  if (["completed", "complete", "done", "accepted", "delivered"].some((x) => st.includes(x))) return "done";
  return "in_progress";
}

async function loadPerformanceLines(
  client: SupabaseClient,
  mentorId: string
): Promise<MentorPayoutPerformanceRow[]> {
  const rows: MentorPayoutPerformanceRow[] = [];

  const { data: orders, error } = await client
    .from("custom_request_orders")
    .select("*")
    .eq("mentor_id", mentorId)
    .order("created_at", { ascending: false })
    .limit(80);

  if (!error && orders) {
    for (const o of orders as Row[]) {
      const gross = orderGrossWon(o);
      rows.push({
        id: `perf-cr-${String(o.id ?? "")}`,
        date: pickTs(o),
        type: "custom_request",
        title: orderTitle(o),
        studentName: orderStudentName(o),
        amount: gross > 0 ? Math.floor(gross * MENTOR_CUSTOM_REQUEST_SHARE) : 0,
        uiStatus: orderPerfStatus(o),
      });
    }
  }

  const subIds = await subscriptionIdsForMentor(client, mentorId);
  if (subIds.length) {
    const q = await client
      .from("cash_ledger")
      .select("*")
      .eq("reason", "subscription_payment")
      .in("ref_id", subIds.slice(0, 100))
      .order("created_at", { ascending: false })
      .limit(40);
    if (!q.error && q.data) {
      for (const r of q.data as Row[]) {
        const payment = minorUnitsToCash(intWon(r.delta_cents));
        rows.push({
          id: `perf-sub-${String(r.id ?? "")}`,
          date: pickTs(r),
          type: "subscription",
          title: "구독 결제",
          studentName: "구독 학생",
          amount: Math.floor(payment * MENTOR_SUBSCRIPTION_SHARE),
          uiStatus: "done",
        });
      }
    }
  }

  rows.sort((a, b) => (a.date < b.date ? 1 : -1));
  return rows;
}

export async function loadMentorPayoutsPageData(
  supabase: SupabaseClient,
  mentorId: string
): Promise<MentorPayoutsPageData> {
  const client = await readClient(supabase);
  const ym = currentYm();
  const prev = prevYm(ym);

  const [summary, months, subLines, crLines, settlement, lifetimePaid, performanceLines] =
    await Promise.all([
      loadMentorPayoutSummary(supabase, mentorId),
      loadMentorPayoutMonthlyCards(supabase, mentorId, 6),
      loadSubscriptionLines(client, mentorId),
      loadCustomRequestLines(client, mentorId),
      loadMentorSettlementItemsForPayouts(client, mentorId),
      loadLifetimePaidPayouts(client, mentorId),
      loadPerformanceLines(client, mentorId),
    ]);

  const all = [...subLines, ...crLines];
  const settlementLines = all.map(detailLineToSettlementRow).sort((a, b) => (a.date < b.date ? 1 : -1));

  const thisSub = sumNetByType(all, "subscription", ym);
  const thisCr = sumNetByType(all, "custom_request", ym);
  const prevSub = sumNetByType(all, "subscription", prev);
  const prevCr = sumNetByType(all, "custom_request", prev);
  const thisTotal = thisSub + thisCr;
  const prevTotal = prevSub + prevCr;

  const shareTotal = thisTotal > 0 ? thisTotal : 1;
  const revenueShare = {
    subscription: thisSub,
    customRequest: thisCr,
    total: thisTotal,
    subscriptionPct: Math.round((thisSub / shareTotal) * 100),
    customRequestPct: Math.round((thisCr / shareTotal) * 100),
  };

  const paidThisMonth = settlement.lines
    .filter(({ settlement: s }) => String(s.status ?? "").toLowerCase() === "paid" && inYm(pickTs(s), ym))
    .reduce((a, { settlement: s }) => a + intWon(s.mentor_amount), 0);

  const schedule = buildPayoutScheduleInfo(
    summary.thisMonthScheduledPayout,
    paidThisMonth > 0 ? paidThisMonth : settlement.totals.paidMentorAmount
  );

  return {
    summary,
    months,
    schedule,
    revenueShare,
    kpis: {
      subscription: { amount: thisSub, momPct: pctChange(thisSub, prevSub) },
      customRequest: { amount: thisCr, momPct: pctChange(thisCr, prevCr) },
      total: { amount: thisTotal, momPct: pctChange(thisTotal, prevTotal) },
      lifetimePaid,
    },
    settlementLines,
    performanceLines,
    defaultMonth: ym,
  };
}

export async function loadMentorPayoutDetail(
  supabase: SupabaseClient,
  mentorId: string,
  opts: { month?: string | null; type?: PayoutLineType | "all" | null }
): Promise<MentorPayoutDetailResult> {
  const client = await readClient(supabase);
  const [subLines, crLines] = await Promise.all([
    loadSubscriptionLines(client, mentorId),
    loadCustomRequestLines(client, mentorId),
  ]);

  let lines = [...subLines, ...crLines];
  if (opts.type && opts.type !== "all") {
    lines = lines.filter((l) => l.type === opts.type);
  }
  if (opts.month) {
    const { start, end } = monthStartEnd(opts.month);
    lines = lines.filter((l) => l.date >= start.slice(0, 10) && l.date <= end);
  }
  lines.sort((a, b) => (a.date < b.date ? 1 : -1));

  const totals = lines.reduce(
    (acc, l) => ({
      paymentAmount: acc.paymentAmount + l.paymentAmount,
      feeAmount: acc.feeAmount + l.feeAmount,
      netAmount: acc.netAmount + l.netAmount,
    }),
    { paymentAmount: 0, feeAmount: 0, netAmount: 0 }
  );

  return { lines, totals };
}
