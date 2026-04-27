"use server";

import { createSubscriptionPaymentIntent, finalizeSubscriptionCheckout } from "@/lib/subscribe/subscribeCheckoutService";
import { getStudentSupabaseForSubscribe } from "@/lib/subscribe/subscribeCheckoutSession";
import { isSubscribePlanTier, type SubscribePlanTier } from "@/lib/subscribe/subscribePageQueries";

type ActionGuardFail = { ok: false; error: string; code: "auth" | "bad_request" };

/**
 * Form / 서버 컴포넌트에서 호출용 — API route와 동일 서비스 계층
 */
export async function subscribeCreatePaymentIntentAction(input: {
  mentorId: string;
  planTier: SubscribePlanTier;
}): Promise<ReturnType<typeof createSubscriptionPaymentIntent> | ActionGuardFail> {
  const s = await getStudentSupabaseForSubscribe();
  if (!s.ok) {
    return { ok: false, error: s.error, code: "auth" };
  }
  const mentorId = String(input.mentorId ?? "").trim();
  if (!mentorId || !isSubscribePlanTier(input.planTier)) {
    return { ok: false, error: "mentorId·planTier가 올바르지 않습니다.", code: "bad_request" };
  }
  return createSubscriptionPaymentIntent(s.supabase, {
    studentId: s.studentId,
    mentorId,
    planTier: input.planTier,
  });
}

export async function subscribeFinalizeCheckoutAction(input: {
  paymentId: string;
  mentorId: string;
  planTier: SubscribePlanTier;
}): Promise<ReturnType<typeof finalizeSubscriptionCheckout> | ActionGuardFail> {
  const s = await getStudentSupabaseForSubscribe();
  if (!s.ok) {
    return { ok: false, error: s.error, code: "auth" };
  }
  const paymentId = String(input.paymentId ?? "").trim();
  const mentorId = String(input.mentorId ?? "").trim();
  if (!paymentId || !mentorId || !isSubscribePlanTier(input.planTier)) {
    return { ok: false, error: "paymentId·mentorId·planTier가 올바르지 않습니다.", code: "bad_request" };
  }
  return finalizeSubscriptionCheckout(s.supabase, {
    studentId: s.studentId,
    paymentId,
    mentorId,
    planTier: input.planTier,
  });
}
