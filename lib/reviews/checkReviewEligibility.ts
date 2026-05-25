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
  payments?: { status: string | null; amount: number | null } | { status: string | null; amount: number | null }[] | null;
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

/** cash_ledger 구독 차감(sub_debit_*) 기록으로 결제 성공 대체 판정 */
async function countPaidSubscriptionsViaLedger(
  supabase: SupabaseClient,
  studentId: string,
  mentorId: string
): Promise<number> {
  const { data: subs, error: subErr } = await supabase
    .from("subscriptions")
    .select("id, created_at")
    .eq("student_id", studentId)
    .eq("mentor_id", mentorId)
    .order("created_at", { ascending: true });
  if (subErr || !subs?.length) {
    return 0;
  }

  let paid = 0;
  for (const sub of subs) {
    const subId = String((sub as { id: string }).id);
    const { count, error } = await supabase
      .from("cash_ledger")
      .select("id", { count: "exact", head: true })
      .eq("user_id", studentId)
      .eq("ref_type", "subscriptions")
      .eq("ref_id", subId)
      .lt("delta_cents", 0);
    if (!error && (count ?? 0) > 0) {
      paid += 1;
    }
  }
  return paid;
}

/**
 * 동일 멘토에 대해 **결제 성공(paid) 구독 2회 이상** + 미작성 리뷰일 때만 작성 가능.
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
        amount
      )
    `
    )
    .eq(subCol, authorId)
    .eq("mentor_id", mentorId)
    .order("created_at", { ascending: true });

  if (error) {
    const ledgerPaid = await countPaidSubscriptionsViaLedger(supabase, authorId, mentorId);
    if (ledgerPaid >= MIN_PAID_SUBSCRIPTION_COUNT) {
      return await finishReviewEligibilityCheck(supabase, authorId, mentorId, ledgerPaid);
    }
    return {
      eligible: false,
      reason: "구독 이력을 확인하지 못했습니다. 잠시 후 다시 시도해 주세요.",
      subscriptionCount: 0,
    };
  }

  const rows = ((data ?? []) as SubscriptionRow[]).filter((r) => subscriptionHasPaidPayment(r));

  if (rows.length < MIN_PAID_SUBSCRIPTION_COUNT) {
    const ledgerPaid = await countPaidSubscriptionsViaLedger(supabase, authorId, mentorId);
    if (ledgerPaid >= MIN_PAID_SUBSCRIPTION_COUNT) {
      return await finishReviewEligibilityCheck(supabase, authorId, mentorId, ledgerPaid);
    }
    const total = (data ?? []).length;
    return {
      eligible: false,
      reason:
        total === 0
          ? "동일 멘토에 2회 이상 구독(결제) 후 리뷰를 작성할 수 있습니다. 무료체험만 이용한 경우 작성할 수 없습니다."
          : "동일 멘토에 결제가 완료된 구독이 2회 이상 있어야 리뷰를 작성할 수 있습니다.",
      subscriptionCount: rows.length,
    };
  }

  return await finishReviewEligibilityCheck(supabase, authorId, mentorId, rows.length);
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
