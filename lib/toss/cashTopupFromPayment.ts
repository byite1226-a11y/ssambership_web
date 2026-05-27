import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { cashKrwForPayKrw, isAllowedChargePayKrw } from "@/lib/cash/chargePackages";

export function parseUserIdFromCashOrderId(orderId: string): string | null {
  const m = /^cash-(.+)-(\d+)$/.exec(orderId);
  return m?.[1] ?? null;
}

export function krwWonToCents(won: number): number {
  if (!Number.isFinite(won) || won <= 0 || won > 10_000_000) return 0;
  return Math.round(won) * 100;
}

export type RecordCashTopupResult =
  | { ok: true; duplicate: boolean; amount: number; payAmount: number; userId: string }
  | { ok: false; code: string; message: string };

export async function hasCashTopupForOrderId(
  admin: SupabaseClient,
  orderId: string
): Promise<boolean> {
  const { data, error } = await admin
    .from("cash_ledger")
    .select("id")
    .eq("idempotency_key", orderId)
    .maybeSingle();

  if (error) {
    console.error("[hasCashTopupForOrderId]", error.message, { orderId });
    return false;
  }

  return Boolean(data?.id);
}

/**
 * Toss 결제 완료 후 캐시 충전 원장 기록 (service_role + record_cash_topup).
 * confirm·webhook 공통.
 */
export async function recordCashTopupFromTossOrder(params: {
  admin: SupabaseClient;
  orderId: string;
  payAmountWon: number;
}): Promise<RecordCashTopupResult> {
  const { admin, orderId, payAmountWon } = params;

  if (!Number.isFinite(payAmountWon) || payAmountWon <= 0) {
    return { ok: false, code: "invalid_amount", message: "결제 금액이 올바르지 않습니다." };
  }

  if (!isAllowedChargePayKrw(payAmountWon)) {
    return { ok: false, code: "invalid_package", message: "허용되지 않은 충전 금액입니다." };
  }

  const cashKrw = cashKrwForPayKrw(payAmountWon);
  if (cashKrw == null) {
    return { ok: false, code: "invalid_package", message: "허용되지 않은 충전 금액입니다." };
  }

  const userId = parseUserIdFromCashOrderId(orderId);
  if (!userId) {
    return { ok: false, code: "invalid_order", message: "주문 번호 형식이 올바르지 않습니다." };
  }

  const already = await hasCashTopupForOrderId(admin, orderId);
  if (already) {
    return { ok: true, duplicate: true, amount: cashKrw, payAmount: payAmountWon, userId };
  }

  const amountCents = krwWonToCents(cashKrw);
  if (amountCents <= 0) {
    return { ok: false, code: "invalid_amount", message: "충전 금액이 올바르지 않습니다." };
  }

  const { error: rpcError } = await admin.rpc("record_cash_topup", {
    p_user_id: userId,
    p_amount_cents: amountCents,
    p_idempotency_key: orderId,
  });

  if (rpcError) {
    console.error("[recordCashTopupFromTossOrder] record_cash_topup", rpcError.message, { orderId, userId });
    return { ok: false, code: "ledger_failed", message: "충전 기록에 실패했습니다." };
  }

  return { ok: true, duplicate: false, amount: cashKrw, payAmount: payAmountWon, userId };
}

/** webhook 고아결제 복구 성공 시 admin_action_logs 기록 (service_role). */
export async function logWebhookCashTopupRecovery(
  admin: SupabaseClient,
  detail: Record<string, unknown>
): Promise<void> {
  const { error } = await admin.from("admin_action_logs").insert({
    admin_id: null,
    action_type: "webhook_recovery",
    target_type: "cash_topup",
    target_id: null,
    detail,
  });

  if (error) {
    console.error("[logWebhookCashTopupRecovery]", error.message, detail);
  }
}
