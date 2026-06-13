import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { fetchWalletBalanceByUserId } from "@/lib/cash/cashQueries";
import { parseWalletBalanceBreakdown } from "@/lib/cash/parseWalletBalanceKrw";
import { finalizeSubscriptionCashWalletCheckout } from "@/lib/subscribe/subscribeCheckoutService";
import { getStudentSupabaseForSubscribe } from "@/lib/subscribe/subscribeCheckoutSession";
import { cashKrwForSubscribeTier } from "@/lib/subscribe/subscribePlanCatalog";
import { isSubscribePlanTier } from "@/lib/subscribe/subscribePageQueries";

function userMessageForCheckoutError(code: string | undefined, error: string): string {
  if (code === "dup") return error;
  if (/캐시|잔액|CASH_INSUFFICIENT/i.test(error)) return error;
  if (code === "not_found") return error;
  if (code === "forbidden") return error;
  if (/플랜|plan/i.test(error)) return error;
  return error.length > 0 && error.length < 200 ? error : "구독 처리에 실패했습니다. 잠시 후 다시 시도해 주세요.";
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch (e) {
    console.error("[subscribe/checkout] invalid JSON", e);
    return NextResponse.json(
      { ok: false, error: "bad_request", message: "요청 정보가 올바르지 않습니다." },
      { status: 400 }
    );
  }

  const { mentorId, planTier, amountCents, planId } = body as {
    mentorId?: string;
    planId?: string;
    planTier?: string;
    amountCents?: number;
  };

  const mentorIdTrim = String(mentorId ?? "").trim();
  if (!mentorIdTrim || !planTier || !isSubscribePlanTier(planTier)) {
    return NextResponse.json(
      { ok: false, error: "invalid_params", message: "요청 정보가 올바르지 않습니다." },
      { status: 400 }
    );
  }

  const expectedCashKrw = cashKrwForSubscribeTier(planTier);
  if (
    typeof amountCents === "number" &&
    Number.isFinite(amountCents) &&
    amountCents > 0 &&
    amountCents !== expectedCashKrw * 100
  ) {
    console.error("[subscribe/checkout] amount_mismatch", {
      mentorId: mentorIdTrim,
      planTier,
      amountCents,
      expectedCents: expectedCashKrw * 100,
    });
    return NextResponse.json(
      { ok: false, error: "amount_mismatch", message: "결제 금액이 플랜과 일치하지 않습니다." },
      { status: 400 }
    );
  }

  const session = await getStudentSupabaseForSubscribe();
  if (!session.ok) {
    return NextResponse.json(
      { ok: false, error: session.code, message: session.error },
      { status: session.status }
    );
  }

  const balance = await fetchWalletBalanceByUserId(session.supabase, session.studentId);
  const breakdown = parseWalletBalanceBreakdown(balance.row);
  const balanceCents = breakdown.totalCash * 100;
  const requiredCents = expectedCashKrw * 100;

  if (balanceCents < requiredCents) {
    return NextResponse.json(
      {
        ok: false,
        error: "insufficient_cash",
        message: "캐시가 부족합니다. 충전 후 다시 시도해 주세요.",
      },
      { status: 400 }
    );
  }

  const result = await finalizeSubscriptionCashWalletCheckout(session.supabase, {
    studentId: session.studentId,
    mentorId: mentorIdTrim,
    planTier,
  });

  if (!result.ok) {
    console.error("[subscribe/checkout] finalize failed", {
      code: result.code,
      error: result.error,
      mentorId: mentorIdTrim,
      planTier,
      planId: planId ?? null,
      studentId: session.studentId,
      balanceCents,
      requiredCents,
    });
    const status =
      result.code === "dup"
        ? 409
        : /캐시|잔액/i.test(result.error)
          ? 400
          : result.code === "not_found"
            ? 404
            : 500;
    return NextResponse.json(
      {
        ok: false,
        error: result.code,
        message: userMessageForCheckoutError(result.code, result.error),
      },
      { status }
    );
  }

  revalidatePath("/subscribe");
  revalidatePath("/subscriptions");
  revalidatePath("/question-room");
  revalidatePath("/wallet/charge");
  revalidatePath("/wallet/ledger");

  return NextResponse.json({
    ok: true,
    subscriptionId: result.subscriptionId,
    roomId: result.roomId,
    paymentId: result.paymentId,
    amountCents: requiredCents,
    cashKrw: expectedCashKrw,
  });
}
