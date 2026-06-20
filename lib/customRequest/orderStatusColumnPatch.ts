import type { SupabaseClient } from "@supabase/supabase-js";
import { markCustomOrderDeliveredRpc } from "@/lib/customRequest/orderTransitionRpc";

type OwnerFilter = { column: string; userId: string };

/**
 * Compatibility wrapper for old order_status patches.
 * M-1 step 1 moves custom_request_orders state changes to RPCs before RLS lockdown.
 */
export async function patchCustomOrderOrderStatus(
  supabase: SupabaseClient,
  table: string,
  orderId: string,
  owner: OwnerFilter,
  nextOrderStatus: string,
  options?: { requireOrderStatus?: string }
): Promise<{ ok: true } | { ok: false; error: string }> {
  void owner;
  if (table !== "custom_request_orders") {
    return { ok: false, error: "맞춤의뢰 주문 상태 전이는 custom_request_orders RPC로만 처리할 수 있습니다." };
  }

  if (nextOrderStatus === "delivered") {
    const result = await markCustomOrderDeliveredRpc(supabase, orderId);
    return result.ok ? { ok: true } : { ok: false, error: result.error };
  }

  if (nextOrderStatus === "revision_requested" && options?.requireOrderStatus === "delivered") {
    return { ok: false, error: "수정 요청 상태 전이는 custom_order_student_request_revision RPC를 사용해야 합니다." };
  }

  return { ok: false, error: `지원하지 않는 맞춤의뢰 주문 상태 전이입니다: ${nextOrderStatus}` };
}
