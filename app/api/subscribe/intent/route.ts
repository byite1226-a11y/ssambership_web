import { NextResponse } from "next/server";
import { createSubscriptionPaymentIntent } from "@/lib/subscribe/subscribeCheckoutService";
import { getStudentSupabaseForSubscribe } from "@/lib/subscribe/subscribeCheckoutSession";
import { isSubscribePlanTier } from "@/lib/subscribe/subscribePageQueries";

export async function POST(request: Request) {
  const session = await getStudentSupabaseForSubscribe();
  if (!session.ok) {
    return NextResponse.json(
      { ok: false, error: session.error, code: session.code },
      { status: session.status }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "JSON 본문이 필요합니다.", code: "bad_request" as const },
      { status: 400 }
    );
  }
  const b = body as { mentorId?: unknown; planTier?: unknown };
  const mentorId = String(b.mentorId ?? "").trim();
  const planTier = b.planTier;
  if (!mentorId || !isSubscribePlanTier(planTier)) {
    return NextResponse.json(
      { ok: false, error: "mentorId와 planTier(limited|standard|premium)가 필요합니다.", code: "bad_request" },
      { status: 400 }
    );
  }

  const r = await createSubscriptionPaymentIntent(session.supabase, {
    studentId: session.studentId,
    mentorId,
    planTier,
  });
  if (!r.ok) {
    const status =
      r.code === "dup" ? 409 : r.code === "mentor" || r.code === "plan" ? 400 : 500;
    return NextResponse.json({ ok: false, error: r.error, code: r.code }, { status });
  }
  const allowImmediateComplete =
    process.env.SUBSCRIBE_CHECKOUT_ALLOW_PENDING === "true" ||
    process.env.SUBSCRIBE_CHECKOUT_ALLOW_PENDING === "1";

  return NextResponse.json({
    ok: true,
    paymentId: r.paymentId,
    intentKey: r.intentKey,
    paymentTable: r.paymentTable,
    planProbe: r.planProbe,
    message: r.message,
    allowImmediateComplete,
  });
}
