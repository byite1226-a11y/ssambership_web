import type { SupabaseClient } from "@supabase/supabase-js";
import { pickExistingColumn } from "@/lib/qna/safeSelect";

type OwnerFilter = { column: string; userId: string };

/**
 * `custom_request_orders.order_status` 전이 (상태 머신).
 * 스키마에 `order_status` 열이 없으면 실패를 반환한다.
 */
export async function patchCustomOrderOrderStatus(
  supabase: SupabaseClient,
  table: string,
  orderId: string,
  owner: OwnerFilter,
  nextOrderStatus: string,
  options?: { requireOrderStatus?: string }
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { column: orderStatusCol } = await pickExistingColumn(supabase, table, ["order_status"]);
  if (!orderStatusCol) {
    return { ok: false, error: "주문에 order_status 컬럼이 없습니다." };
  }

  const patch: Record<string, unknown> = { [orderStatusCol]: nextOrderStatus };
  const { column: uCol } = await pickExistingColumn(supabase, table, ["updated_at"]);
  if (uCol) {
    patch[uCol] = new Date().toISOString();
  }

  let q = supabase.from(table).update(patch).eq("id", orderId).eq(owner.column, owner.userId);
  if (options?.requireOrderStatus) {
    q = q.eq(orderStatusCol, options.requireOrderStatus);
  }
  const { data, error } = await q.select("id").maybeSingle();
  if (error) {
    return { ok: false, error: error.message };
  }
  if (!data) {
    return {
      ok: false,
      error: options?.requireOrderStatus
        ? `주문 상태가 '${options.requireOrderStatus}'가 아니어서 갱신할 수 없습니다.`
        : "주문 상태를 갱신하지 못했습니다.",
    };
  }
  return { ok: true };
}
