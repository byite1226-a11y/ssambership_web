import { NextResponse } from "next/server";
import { finalizeSubscriptionCheckout } from "@/lib/subscribe/subscribeCheckoutService";
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
      { ok: false, error: "JSON 본문이 필요합니다.", code: "bad_request" },
      { status: 400 }
    );
  }
  const b = body as { paymentId?: unknown; mentorId?: unknown; planTier?: unknown };
  const paymentId = String(b.paymentId ?? "").trim();
  const mentorId = String(b.mentorId ?? "").trim();
  const planTier = b.planTier;
  if (!paymentId || !mentorId || !isSubscribePlanTier(planTier)) {
    return NextResponse.json(
      {
        ok: false,
        error: "paymentId, mentorId, planTier(limited|standard|premium)가 필요합니다.",
        code: "bad_request",
      },
      { status: 400 }
    );
  }

  const r = await finalizeSubscriptionCheckout(session.supabase, {
    studentId: session.studentId,
    paymentId,
    mentorId,
    planTier,
  });
  if (!r.ok) {
    const status =
      r.code === "not_found" ? 404
      : r.code === "forbidden" ? 403
      : r.code === "dup" ? 409
      : 500;
    return NextResponse.json({ ok: false, error: r.error, code: r.code }, { status });
  }
  return NextResponse.json({
    ok: true,
    paymentId: r.paymentId,
    subscriptionId: r.subscriptionId,
    roomId: r.roomId,
    message: r.message,
  });
}
