import type { SupabaseClient } from "@supabase/supabase-js";

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

type Row = Record<string, unknown>;

type PaymentLikeRow = {
  status?: string | null;
  amount?: number | null;
  kind?: string | null;
  metadata?: Record<string, unknown> | null;
  data?: Record<string, unknown> | null;
};

function paymentSucceeded(status: string | null | undefined): boolean {
  if (!status) return false;
  return PAYMENT_SUCCEEDED.has(String(status).trim().toLowerCase());
}

function isPaidTier(value: unknown): boolean {
  const tier = String(value ?? "").trim().toLowerCase();
  return tier !== "free" && tier !== "trial" && !tier.includes("trial");
}

function isMissingBillingEventsTable(error: unknown): boolean {
  const e = error as { code?: string; message?: string } | null | undefined;
  const code = String(e?.code ?? "");
  const message = String(e?.message ?? "").toLowerCase();
  return (
    code === "42P01" ||
    code === "42703" ||
    code === "PGRST204" ||
    code === "PGRST205" ||
    message.includes("subscription_billing_events") ||
    message.includes("schema cache") ||
    message.includes("does not exist")
  );
}

async function countSucceededBillingEvents(
  supabase: SupabaseClient,
  studentId: string,
  mentorId: string
): Promise<number | null> {
  const { data, error } = await supabase
    .from("subscription_billing_events")
    .select("id, amount_cents, plan_tier")
    .eq("student_id", studentId)
    .eq("mentor_id", mentorId)
    .eq("status", "succeeded")
    .in("event_type", ["initial", "renewal"]);

  if (error) {
    if (!isMissingBillingEventsTable(error)) {
      console.error("[countSucceededBillingEvents]", error.message);
    }
    return null;
  }

  return ((data ?? []) as Row[]).filter((row) => {
    const amount = row.amount_cents;
    return typeof amount === "number" && amount > 0 && isPaidTier(row.plan_tier);
  }).length;
}

async function subscriptionIdsForPair(
  supabase: SupabaseClient,
  studentId: string,
  mentorId: string
): Promise<string[]> {
  const { data, error } = await supabase
    .from("subscriptions")
    .select("id, plan_tier")
    .eq("student_id", studentId)
    .eq("mentor_id", mentorId);

  if (error) return [];
  return ((data ?? []) as Row[])
    .filter((row) => isPaidTier(row.plan_tier))
    .map((row) => String(row.id ?? "").trim())
    .filter(Boolean);
}

async function countPaidEventsViaLedger(
  supabase: SupabaseClient,
  studentId: string,
  mentorId: string
): Promise<number> {
  const subscriptionIds = await subscriptionIdsForPair(supabase, studentId, mentorId);
  if (subscriptionIds.length === 0) return 0;

  const { data, error } = await supabase
    .from("cash_ledger")
    .select("id")
    .eq("user_id", studentId)
    .eq("ref_type", "subscriptions")
    .in("ref_id", subscriptionIds)
    .lt("delta_cents", 0);

  if (error) return 0;
  return (data ?? []).length;
}

async function countPaidEventsViaPayments(
  supabase: SupabaseClient,
  studentId: string,
  mentorId: string
): Promise<number> {
  const { data, error } = await supabase
    .from("payments")
    .select("id, status, amount, kind, metadata, data")
    .eq("mentor_id", mentorId)
    .or(`user_id.eq.${studentId},student_id.eq.${studentId},payer_id.eq.${studentId}`);

  if (error) return 0;

  return ((data ?? []) as PaymentLikeRow[]).filter((row) => {
    if (!paymentSucceeded(row.status)) return false;
    if (typeof row.amount === "number" && row.amount <= 0) return false;
    const kind = String(row.kind ?? "").trim().toLowerCase();
    const metadataSource = typeof row.metadata?.source === "string" ? row.metadata.source : null;
    const dataSource = typeof row.data?.source === "string" ? row.data.source : null;
    return kind === "subscription" || metadataSource === "subscribe_checkout" || dataSource === "subscribe_checkout";
  }).length;
}

async function fallbackPaidEventCount(
  supabase: SupabaseClient,
  studentId: string,
  mentorId: string
): Promise<number> {
  const [ledgerCount, paymentCount] = await Promise.all([
    countPaidEventsViaLedger(supabase, studentId, mentorId),
    countPaidEventsViaPayments(supabase, studentId, mentorId),
  ]);
  return Math.max(ledgerCount, paymentCount);
}

/**
 * Review eligibility: the student must have at least two successful paid
 * subscription billing events for the same mentor. Free/trial use does not count.
 */
export async function checkReviewEligibility(
  supabase: SupabaseClient,
  authorId: string,
  mentorId: string
): Promise<ReviewEligibilityResult> {
  const billingEventCount = await countSucceededBillingEvents(supabase, authorId, mentorId);
  const fallbackCount =
    billingEventCount == null || billingEventCount < MIN_PAID_SUBSCRIPTION_COUNT
      ? await fallbackPaidEventCount(supabase, authorId, mentorId)
      : 0;
  const paidCount = Math.max(billingEventCount ?? 0, fallbackCount);

  if (paidCount < MIN_PAID_SUBSCRIPTION_COUNT) {
    return {
      eligible: false,
      reason: "같은 멘토에게 2회 이상 결제한 학생만 후기를 남길 수 있어요. 무료체험만 이용한 경우 작성할 수 없습니다.",
      subscriptionCount: paidCount,
    };
  }

  return await finishReviewEligibilityCheck(supabase, authorId, mentorId, paidCount);
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
