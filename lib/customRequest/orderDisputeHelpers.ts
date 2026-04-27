import type { SupabaseClient } from "@supabase/supabase-js";
import { firstReadableCustomTable } from "@/lib/customRequest/customRequestQueries";
import { pickExistingColumn } from "@/lib/qna/safeSelect";

type Row = Record<string, unknown>;

/**
 * 004 `disputes.status` CHECK: open | under_review | resolved | dismissed | escalated
 * — 진행 중(당사자 액션 잠글 때) open·under_review·escalated 만 본다.
 */
const ACTIVE_DISPUTE_STATUSES = new Set(["open", "under_review", "escalated"]);

function disputeStatusField(r: Row): string {
  for (const k of ["status", "state", "label"] as const) {
    const v = r[k];
    if (v !== null && v !== undefined && String(v).trim()) {
      return String(v).trim().toLowerCase();
    }
  }
  return "";
}

export function hasActiveDisputeForOrderRows(rows: Row[] | null | undefined): boolean {
  if (!rows?.length) {
    return false;
  }
  for (const r of rows) {
    const s = disputeStatusField(r);
    if (s && ACTIVE_DISPUTE_STATUSES.has(s)) {
      return true;
    }
  }
  return false;
}

/**
 * 주문방·서버 액션에서 동일한 방식으로 분쟁 목록을 가져온다(loadOrderBundle disputes와 병행).
 */
export async function getDisputeRowsForOrderId(
  supabase: SupabaseClient,
  orderId: string
): Promise<{ rows: Row[]; error: string | null }> {
  const dis = await firstReadableCustomTable(supabase, ["disputes", "order_disputes", "custom_disputes"]);
  if (!dis.table) {
    return { rows: [], error: dis.error || "disputes 테이블 없음" };
  }
  const { column: fk } = await pickExistingColumn(supabase, dis.table, [
    "custom_request_order_id",
    "order_id",
    "custom_order_id",
    "request_order_id",
  ]);
  if (!fk) {
    return { rows: [], error: "disputes: order FK 열 없음" };
  }
  const { data, error } = await supabase.from(dis.table).select("*").eq(fk, orderId);
  if (error) {
    return { rows: [], error: error.message };
  }
  return { rows: (data as Row[]) ?? [], error: null };
}

/**
 * 서버 액션에서 조회에 실패하면(테이블 없음 등) 잠그지 않는다. 열이 있을 때만 잠근다.
 */
export async function getActiveDisputeBlockMessage(
  supabase: SupabaseClient,
  orderId: string
): Promise<string | null> {
  const { rows, error } = await getDisputeRowsForOrderId(supabase, orderId);
  if (error) {
    return null;
  }
  if (hasActiveDisputeForOrderRows(rows)) {
    return "진행 중인 분쟁이 있어 이 작업을 할 수 없습니다.";
  }
  return null;
}
