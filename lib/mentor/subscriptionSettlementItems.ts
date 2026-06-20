import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { createServiceRoleClient } from "@/lib/supabase/admin";

export const SUBSCRIPTION_SETTLEMENT_ITEMS_TABLE = "subscription_settlement_items" as const;

export type SubscriptionSettlementItemStatus = "pending" | "paid" | "hold" | "canceled";
export type SubscriptionSettlementItemRow = Record<string, unknown>;

const SELECT_COLUMNS = [
  "id",
  "billing_event_id",
  "subscription_id",
  "mentor_id",
  "student_id",
  "payment_id",
  "ledger_id",
  "event_type",
  "billing_at",
  "period_start",
  "period_end",
  "gross_cents",
  "platform_fee_cents",
  "mentor_amount_cents",
  "fee_rate",
  "status",
  "hold_reason",
  "paid_at",
  "created_at",
  "updated_at",
].join(", ");

function isSchemaNotReadyError(error: unknown): boolean {
  const e = error as { code?: string; message?: string } | null | undefined;
  const code = String(e?.code ?? "");
  const message = String(e?.message ?? "").toLowerCase();
  return (
    code === "42P01" ||
    code === "42883" ||
    code === "42703" ||
    code === "PGRST204" ||
    code === "PGRST205" ||
    message.includes("schema cache") ||
    message.includes("does not exist") ||
    message.includes("could not find")
  );
}

export function minorCentsToCash(value: unknown): number {
  const n = typeof value === "number" ? value : Number(value ?? 0);
  return Number.isFinite(n) ? Math.floor(Math.abs(n) / 100) : 0;
}

export function subscriptionSettlementStatus(value: unknown): SubscriptionSettlementItemStatus {
  const status = String(value ?? "pending").trim().toLowerCase();
  if (status === "paid") return "paid";
  if (status === "hold" || status === "on_hold") return "hold";
  if (status === "canceled" || status === "cancelled") return "canceled";
  return "pending";
}

export function subscriptionSettlementStatusLabel(value: unknown): string {
  switch (subscriptionSettlementStatus(value)) {
    case "paid":
      return "\uC9C0\uAE09 \uC644\uB8CC";
    case "hold":
      return "\uBCF4\uB958";
    case "canceled":
      return "\uCDE8\uC18C";
    default:
      return "\uC9C0\uAE09 \uB300\uAE30";
  }
}

export function formatSubscriptionSettlementPeriod(row: SubscriptionSettlementItemRow): string | null {
  const start = typeof row.period_start === "string" && row.period_start ? row.period_start.slice(0, 10) : "";
  const end = typeof row.period_end === "string" && row.period_end ? row.period_end.slice(0, 10) : "";
  if (start && end) return `${start}~${end}`;
  return start || end || null;
}

export async function refreshSubscriptionSettlementItemsBestEffort(): Promise<{ ok: boolean; error: string | null }> {
  let admin: SupabaseClient;
  try {
    admin = createServiceRoleClient();
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }

  const { error } = await admin.rpc("refresh_subscription_settlement_items", {});
  if (error) {
    if (!isSchemaNotReadyError(error)) {
      console.error("[refreshSubscriptionSettlementItemsBestEffort]", error.message);
    }
    return { ok: false, error: error.message };
  }
  return { ok: true, error: null };
}

export async function loadSubscriptionSettlementRowsForMentor(
  supabase: SupabaseClient,
  mentorId: string,
  limit = 300
): Promise<SubscriptionSettlementItemRow[]> {
  const { data, error } = await supabase
    .from(SUBSCRIPTION_SETTLEMENT_ITEMS_TABLE)
    .select(SELECT_COLUMNS)
    .eq("mentor_id", mentorId)
    .order("billing_at", { ascending: false })
    .limit(limit);

  if (!error && data) return data as unknown as SubscriptionSettlementItemRow[];
  if (error && isSchemaNotReadyError(error)) return [];

  try {
    const admin = createServiceRoleClient();
    const fallback = await admin
      .from(SUBSCRIPTION_SETTLEMENT_ITEMS_TABLE)
      .select(SELECT_COLUMNS)
      .eq("mentor_id", mentorId)
      .order("billing_at", { ascending: false })
      .limit(limit);
    if (!fallback.error && fallback.data) return fallback.data as unknown as SubscriptionSettlementItemRow[];
    if (fallback.error && !isSchemaNotReadyError(fallback.error)) {
      console.error("[loadSubscriptionSettlementRowsForMentor] service_role", fallback.error.message, { mentorId });
    }
  } catch {
    // Keep mentor payout pages resilient before 086 is applied.
  }

  if (error) console.error("[loadSubscriptionSettlementRowsForMentor]", error.message, { mentorId });
  return [];
}

export async function loadSubscriptionSettlementRowsForAdmin(limit = 100): Promise<{
  rows: SubscriptionSettlementItemRow[];
  error: string | null;
}> {
  let admin: SupabaseClient;
  try {
    admin = createServiceRoleClient();
  } catch (error) {
    return { rows: [], error: error instanceof Error ? error.message : String(error) };
  }

  const { data, error } = await admin
    .from(SUBSCRIPTION_SETTLEMENT_ITEMS_TABLE)
    .select(SELECT_COLUMNS)
    .order("billing_at", { ascending: false })
    .limit(limit);

  if (!error && data) return { rows: data as unknown as SubscriptionSettlementItemRow[], error: null };
  if (error && isSchemaNotReadyError(error)) return { rows: [], error: null };
  return { rows: [], error: error?.message ?? null };
}