import type { SupabaseClient } from "@supabase/supabase-js";

export type CustomOrderTransitionResult =
  | { ok: true; raw: Record<string, unknown> | null }
  | { ok: false; error: string };

function normalizeRpcResult(data: unknown, fallbackError: string): CustomOrderTransitionResult {
  const raw = data && typeof data === "object" && !Array.isArray(data) ? (data as Record<string, unknown>) : null;
  if (raw?.ok === true) {
    return { ok: true, raw };
  }
  const message = typeof raw?.message === "string" && raw.message.trim() ? raw.message.trim() : fallbackError;
  return { ok: false, error: message };
}

function rpcErrorMessage(error: { message?: string } | null | undefined, fallback: string): string {
  const message = error?.message?.trim();
  return message || fallback;
}

export async function startCustomOrderWorkRpc(
  supabase: SupabaseClient,
  orderId: string
): Promise<CustomOrderTransitionResult> {
  const { data, error } = await supabase.rpc("custom_order_mentor_start", { p_order_id: orderId });
  if (error) {
    return { ok: false, error: rpcErrorMessage(error, "Failed to start custom order work.") };
  }
  return normalizeRpcResult(data, "Failed to start custom order work.");
}

export async function markCustomOrderDeliveredRpc(
  supabase: SupabaseClient,
  orderId: string
): Promise<CustomOrderTransitionResult> {
  const { data, error } = await supabase.rpc("custom_order_mentor_deliver", { p_order_id: orderId });
  if (error) {
    return { ok: false, error: rpcErrorMessage(error, "Failed to mark custom order delivered.") };
  }
  return normalizeRpcResult(data, "Failed to mark custom order delivered.");
}

export async function requestCustomOrderRevisionRpc(
  supabase: SupabaseClient,
  orderId: string,
  note: string
): Promise<CustomOrderTransitionResult> {
  const { data, error } = await supabase.rpc("custom_order_student_request_revision", {
    p_order_id: orderId,
    p_note: note,
  });
  if (error) {
    return { ok: false, error: rpcErrorMessage(error, "Failed to request custom order revision.") };
  }
  return normalizeRpcResult(data, "Failed to request custom order revision.");
}