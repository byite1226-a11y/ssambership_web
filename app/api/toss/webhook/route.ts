import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import {
  logWebhookCashTopupRecovery,
  recordCashTopupFromTossOrder,
} from "@/lib/toss/cashTopupFromPayment";
import {
  readTossWebhookSignatureHeader,
  verifyTossWebhookSignature,
} from "@/lib/toss/verifyTossWebhookSignature";

type TossPaymentWebhookData = {
  orderId?: string;
  paymentKey?: string;
  status?: string;
  totalAmount?: number;
  method?: string;
  card?: { amount?: number };
};

type TossPaymentWebhookEvent = {
  eventType?: string;
  createdAt?: string;
  data?: TossPaymentWebhookData;
};

function okResponse(extra?: Record<string, unknown>) {
  return NextResponse.json({ ok: true, ...extra });
}

function pickPayAmountWon(data: TossPaymentWebhookData): number {
  const total = Number(data.totalAmount);
  if (Number.isFinite(total) && total > 0) return total;
  const cardAmount = Number(data.card?.amount);
  if (Number.isFinite(cardAmount) && cardAmount > 0) return cardAmount;
  return Number.NaN;
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = readTossWebhookSignatureHeader(req.headers);

  if (!verifyTossWebhookSignature(rawBody, signature)) {
    console.error("[toss/webhook] invalid signature");
    return NextResponse.json({ error: "invalid_signature" }, { status: 401 });
  }

  let event: TossPaymentWebhookEvent;
  try {
    event = JSON.parse(rawBody) as TossPaymentWebhookEvent;
  } catch (e) {
    console.error("[toss/webhook] invalid json", e);
    return okResponse({ skipped: "invalid_json" });
  }

  if (event.eventType !== "PAYMENT_STATUS_CHANGED") {
    return okResponse({ skipped: "event_type" });
  }

  const data = event.data;
  if (!data || data.status !== "DONE") {
    return okResponse({ skipped: "status" });
  }

  const orderId = String(data.orderId ?? "").trim();
  if (!orderId.startsWith("cash-")) {
    return okResponse({ skipped: "not_cash_order" });
  }

  const payAmountWon = pickPayAmountWon(data);
  if (!Number.isFinite(payAmountWon) || payAmountWon <= 0) {
    console.error("[toss/webhook] missing pay amount", { orderId, data });
    return okResponse({ skipped: "amount_missing" });
  }

  let admin: ReturnType<typeof createServiceRoleClient>;
  try {
    admin = createServiceRoleClient();
  } catch (e) {
    console.error("[toss/webhook] service role client", e);
    return okResponse({ error: "server_config" });
  }

  try {
    const result = await recordCashTopupFromTossOrder({
      admin,
      orderId,
      payAmountWon,
    });

    if (!result.ok) {
      console.error("[toss/webhook] topup failed", result.code, result.message, { orderId });
      await logWebhookCashTopupRecovery(admin, {
        outcome: "failed",
        orderId,
        payAmountWon,
        paymentKey: data.paymentKey ?? null,
        code: result.code,
        message: result.message,
        eventCreatedAt: event.createdAt ?? null,
      });
      return okResponse({ recovered: false, code: result.code });
    }

    if (result.duplicate) {
      return okResponse({ recovered: false, duplicate: true });
    }

    revalidatePath("/wallet");
    revalidatePath("/wallet/charge");
    revalidatePath("/wallet/ledger");

    await logWebhookCashTopupRecovery(admin, {
      outcome: "success",
      orderId,
      payAmountWon,
      cashKrw: result.amount,
      userId: result.userId,
      paymentKey: data.paymentKey ?? null,
      method: data.method ?? null,
      eventCreatedAt: event.createdAt ?? null,
    });

    return okResponse({ recovered: true, amount: result.amount, payAmount: result.payAmount });
  } catch (e) {
    console.error("[toss/webhook] unexpected", e, { orderId });
    try {
      await logWebhookCashTopupRecovery(admin, {
        outcome: "error",
        orderId,
        payAmountWon,
        paymentKey: data.paymentKey ?? null,
        message: e instanceof Error ? e.message : String(e),
        eventCreatedAt: event.createdAt ?? null,
      });
    } catch (logErr) {
      console.error("[toss/webhook] recovery log failed", logErr);
    }
    return okResponse({ recovered: false, error: "unexpected" });
  }
}
