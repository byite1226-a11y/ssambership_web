import type { SupabaseClient } from "@supabase/supabase-js";
import { pickExistingColumn } from "@/lib/qna/safeSelect";

const MIN_PAID_SUBSCRIPTION_COUNT = 2;

const PAYMENT_SUCCEEDED = new Set([
  "paid",
  "succeeded",
  "escrowed",
  "completed",
  "complete",
  "success",
  "captured",
  "paid_out",
]);

export type ReviewEligibilityResult =
  | { eligible: true; subscriptionCount: number }
  | { eligible: false; reason: string; subscriptionCount: number };

type SubscriptionRow = {
  id: string;
  created_at: string;
  payment_id: string | null;
  plan_tier: string | null;
  status: string | null;
  payments?:
    | { status: string | null; amount: number | null; created_at?: string | null }
    | { status: string | null; amount: number | null; created_at?: string | null }[]
    | null;
};

type PaymentLikeRow = {
  created_at?: string | null;
  status?: string | null;
  amount?: number | null;
  kind?: string | null;
  metadata?: Record<string, unknown> | null;
  data?: Record<string, unknown> | null;
};

async function subscriptionStudentColumn(supabase: SupabaseClient): Promise<string | null> {
  const { column } = await pickExistingColumn(supabase, "subscriptions", ["author_id", "student_id"]);
  return column;
}

function paymentSucceeded(status: string | null | undefined): boolean {
  if (!status) return false;
  return PAYMENT_SUCCEEDED.has(String(status).trim().toLowerCase());
}

function isFreeTrialSubscription(row: SubscriptionRow): boolean {
  const tier = String(row.plan_tier ?? "").trim().toLowerCase();
  if (tier.includes("trial") || tier === "free") {
    return true;
  }
  const pay = row.payments;
  const payment = Array.isArray(pay) ? pay[0] : pay;
  const amount = payment?.amount;
  if (typeof amount === "number" && amount <= 0) {
    return true;
  }
  return false;
}

function subscriptionHasPaidPayment(row: SubscriptionRow): boolean {
  if (isFreeTrialSubscription(row)) {
    return false;
  }
  const pay = row.payments;
  const payment = Array.isArray(pay) ? pay[0] : pay;
  if (payment && paymentSucceeded(payment.status)) {
    const amount = payment.amount;
    if (typeof amount === "number" && amount > 0) {
      return true;
    }
    if (amount == null) {
      return true;
    }
  }
  return false;
}

function monthSerial(value: string | null | undefined): number | null {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.getUTCFullYear() * 12 + d.getUTCMonth();
}

function uniqueMonthSerials(values: Array<number | null>): number[] {
  return [...new Set(values.filter((v): v is number => v != null))].sort((a, b) => a - b);
}

function hasTwoConsecutiveMonths(values: number[]): boolean {
  const months = uniqueMonthSerials(values);
  for (let i = 1; i < months.length; i += 1) {
    if (months[i] - months[i - 1] === 1) return true;
  }
  return false;
}

function subscriptionPaidMonth(row: SubscriptionRow): number | null {
  const pay = row.payments;
  const payment = Array.isArray(pay) ? pay[0] : pay;
  return monthSerial(payment?.created_at ?? row.created_at);
}

/** cash_ledger 구독 차감(sub_debit_*) 기록으로 결제 성공 대체 판정 */
async function loadPaidMonthsViaLedger(
  supabase: SupabaseClient,
  studentId: string,
  mentorId: string
): Promise<number[]> {
  const { data: subs, error: subErr } = await supabase
    .from("subscriptions")
    .select("id, created_at")
    .eq("student_id", studentId)
    .eq("mentor_id", mentorId)
    .order("created_at", { ascending: true });
  if (subErr || !subs?.length) {
    return [];
  }

  const months: number[] = [];
  for (const sub of subs) {
    const subId = String((sub as { id: string }).id);
    const { data, error } = await supabase
      .from("cash_ledger")
      .select("created_at")
      .eq("user_id", studentId)
      .eq("ref_type", "subscriptions")
      .eq("ref_id", subId)
      .lt("delta_cents", 0);
    if (!error) {
      for (const row of data ?? []) {
        const month = monthSerial((row as { created_at?: string | null }).created_at);
        if (month != null) months.push(month);
      }
    }
  }
  return uniqueMonthSerials(months);
}

async function loadPaidMonthsViaPayments(
  supabase: SupabaseClient,
  studentId: string,
  mentorId: string
): Promise<number[]> {
  const { data, error } = await supabase
    .from("payments")
    .select("created_at, status, amount, kind, metadata, data")
    .eq("mentor_id", mentorId)
    .or(`user_id.eq.${studentId},student_id.eq.${studentId},payer_id.eq.${studentId}`);
  if (error) return [];
  const months: number[] = [];
  for (const row of (data ?? []) as PaymentLikeRow[]) {
    if (!paymentSucceeded(row.status)) continue;
    if (typeof row.amount === "number" && row.amount <= 0) continue;
    const kind = String(row.kind ?? "").trim().toLowerCase();
    const metadataSource = typeof row.metadata?.source === "string" ? row.metadata.source : null;
    const dataSource = typeof row.data?.source === "string" ? row.data.source : null;
    if (kind !== "subscription" && metadataSource !== "subscribe_checkout" && dataSource !== "subscribe_checkout") {
      continue;
    }
    const month = monthSerial(row.created_at);
    if (month != null) months.push(month);
  }
  return uniqueMonthSerials(months);
}

/**
 * 동일 멘토에 대해 **직전 데이터상 결제 성공 구독이 2개월 연속** + 미작성 리뷰일 때만 작성 가능.
 * 기준: payments/subscriptions/cash_ledger에서 성공 결제 월을 모아 연속된 두 달이 있는지 확인한다.
 * 무료체험(0원·trial tier) 구독은 제외. payment_id 없으면 cash_ledger 차감으로 대체 판정.
 */
export async function checkReviewEligibility(
  supabase: SupabaseClient,
  authorId: string,
  mentorId: string
): Promise<ReviewEligibilityResult> {
  const subCol = await subscriptionStudentColumn(supabase);
  if (!subCol) {
    return {
      eligible: false,
      reason: "구독 이력을 확인하지 못했습니다. 잠시 후 다시 시도해 주세요.",
      subscriptionCount: 0,
    };
  }

  const { data, error } = await supabase
    .from("subscriptions")
    .select(
      `
      id,
      created_at,
      payment_id,
      plan_tier,
      status,
      payments (
        status,
        amount,
        created_at
      )
    `
    )
    .eq(subCol, authorId)
    .eq("mentor_id", mentorId)
    .order("created_at", { ascending: true });

  if (error) {
    const paidMonths = uniqueMonthSerials([
      ...(await loadPaidMonthsViaLedger(supabase, authorId, mentorId)),
      ...(await loadPaidMonthsViaPayments(supabase, authorId, mentorId)),
    ]);
    if (hasTwoConsecutiveMonths(paidMonths)) {
      return await finishReviewEligibilityCheck(supabase, authorId, mentorId, paidMonths.length);
    }
    return {
      eligible: false,
      reason: "구독 이력을 확인하지 못했습니다. 잠시 후 다시 시도해 주세요.",
      subscriptionCount: 0,
    };
  }

  const rows = ((data ?? []) as SubscriptionRow[]).filter((r) => subscriptionHasPaidPayment(r));
  const paidMonths = uniqueMonthSerials([
    ...rows.map((r) => subscriptionPaidMonth(r)),
    ...(await loadPaidMonthsViaLedger(supabase, authorId, mentorId)),
    ...(await loadPaidMonthsViaPayments(supabase, authorId, mentorId)),
  ]);

  if (!hasTwoConsecutiveMonths(paidMonths)) {
    const total = (data ?? []).length;
    return {
      eligible: false,
      reason:
        total === 0
          ? "2달 연속 구독한 학생만 후기를 남길 수 있어요. 무료체험만 이용한 경우 작성할 수 없습니다."
          : "2달 연속 구독한 학생만 후기를 남길 수 있어요.",
      subscriptionCount: paidMonths.length,
    };
  }

  return await finishReviewEligibilityCheck(supabase, authorId, mentorId, Math.max(paidMonths.length, MIN_PAID_SUBSCRIPTION_COUNT));
}

async function finishReviewEligibilityCheck(
  supabase: SupabaseClient,
  authorId: string,
  mentorId: string,
  paidCount: number
): Promise<ReviewEligibilityResult> {
  const { data: existing, error: reviewErr } = await supabase
    .from("reviews")
    .select("id")
    .eq("author_id", authorId)
    .eq("mentor_id", mentorId)
    .maybeSingle();

  if (reviewErr) {
    return {
      eligible: false,
      reason: "리뷰 작성 여부를 확인하지 못했습니다.",
      subscriptionCount: paidCount,
    };
  }

  if (existing?.id) {
    return {
      eligible: false,
      reason: "이미 이 멘토에 대한 리뷰를 작성했습니다. 작성 후에는 수정할 수 없습니다.",
      subscriptionCount: paidCount,
    };
  }

  return { eligible: true, subscriptionCount: paidCount };
}
