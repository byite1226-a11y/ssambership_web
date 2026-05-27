import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { isAllowedChargePayKrw } from "@/lib/cash/chargePackages";
import { recordCashTopupFromTossOrder } from "@/lib/toss/cashTopupFromPayment";

export async function POST(req: NextRequest) {
  const { paymentKey, orderId, amount } = await req.json();

  if (!paymentKey || !orderId || !amount || typeof amount !== "number") {
    return NextResponse.json({ error: "invalid_params" }, { status: 400 });
  }

  const secret = process.env.TOSS_SECRET_KEY;
  if (!secret) {
    console.error("[toss/confirm] TOSS_SECRET_KEY missing");
    return NextResponse.json(
      { error: "server_config", message: "결제 설정이 준비되지 않았습니다." },
      { status: 500 }
    );
  }

  const encoded = Buffer.from(`${secret}:`).toString("base64");

  const tossRes = await fetch("https://api.tosspayments.com/v1/payments/confirm", {
    method: "POST",
    headers: {
      Authorization: `Basic ${encoded}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ paymentKey, orderId, amount }),
  });

  if (!tossRes.ok) {
    const err = await tossRes.json().catch(() => ({}));
    console.error("[toss/confirm] failed", err);
    return NextResponse.json(
      { error: "payment_failed", message: "결제 승인에 실패했습니다." },
      { status: 400 }
    );
  }

  const tossData = (await tossRes.json()) as { method?: string; totalAmount?: number };
  const confirmedWon = Number(tossData.totalAmount ?? amount);
  if (!Number.isFinite(confirmedWon) || confirmedWon !== amount) {
    return NextResponse.json({ error: "amount_mismatch", message: "결제 금액이 일치하지 않습니다." }, { status: 400 });
  }

  if (!isAllowedChargePayKrw(confirmedWon)) {
    return NextResponse.json({ error: "invalid_package", message: "허용되지 않은 충전 금액입니다." }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const userIdFromOrder = orderId.match(/^cash-(.+)-(\d+)$/)?.[1];
  if (!user || !userIdFromOrder || user.id !== userIdFromOrder) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let admin: ReturnType<typeof createServiceRoleClient>;
  try {
    admin = createServiceRoleClient();
  } catch (e) {
    console.error("[toss/confirm] service role client", e);
    return NextResponse.json(
      { error: "server_config", message: "충전 기록에 실패했습니다." },
      { status: 500 }
    );
  }

  const topup = await recordCashTopupFromTossOrder({
    admin,
    orderId,
    payAmountWon: confirmedWon,
  });

  if (!topup.ok) {
    const status = topup.code === "invalid_order" || topup.code === "invalid_package" ? 400 : 500;
    return NextResponse.json({ error: topup.code, message: topup.message }, { status });
  }

  if (topup.duplicate) {
    return NextResponse.json({ ok: true, duplicate: true, amount: topup.amount, payAmount: topup.payAmount });
  }

  revalidatePath("/wallet");
  revalidatePath("/wallet/charge");
  revalidatePath("/wallet/ledger");

  return NextResponse.json({
    ok: true,
    amount: topup.amount,
    payAmount: topup.payAmount,
    method: tossData.method ?? "카드",
  });
}
