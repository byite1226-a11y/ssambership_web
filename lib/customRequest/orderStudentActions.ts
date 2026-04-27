"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/routeGuard";
import { canAccessOrder } from "@/lib/customRequest/orderAccess";
import {
  isOrderStatusAllowingStudentAccept,
  isOrderStatusTerminal,
  normalizedPrimaryOrderStatus,
  primaryOrderStatusColumnKey,
} from "@/lib/customRequest/orderLifecycleConstants";
import { getActiveDisputeBlockMessage } from "@/lib/customRequest/orderDisputeHelpers";
import { firstReadableCustomTable, ORDER_TO_DELIVERABLE_FK_CANDIDATES } from "@/lib/customRequest/customRequestQueries";
import { pickExistingColumn } from "@/lib/qna/safeSelect";
import { createClient } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";

type Row = Record<string, unknown>;

function orderPath(orderId: string) {
  return `/custom-request/orders/${encodeURIComponent(orderId)}`;
}

function redirectWithError(orderId: string, msg: string): never {
  redirect(`${orderPath(orderId)}?error=${encodeURIComponent(msg)}`);
}

export async function hasDeliverableRowsForOrder(supabase: SupabaseClient, orderId: string): Promise<boolean> {
  const dT = await firstReadableCustomTable(supabase, [
    "custom_order_deliverables",
    "order_deliverables",
    "request_deliverables",
  ]);
  if (!dT.table) {
    return false;
  }
  const { column: fk } = await pickExistingColumn(supabase, dT.table, [...ORDER_TO_DELIVERABLE_FK_CANDIDATES]);
  if (!fk) {
    return false;
  }
  const { count, error } = await supabase
    .from(dT.table)
    .select("id", { count: "exact", head: true })
    .eq(fk, orderId);
  return !error && (count ?? 0) > 0;
}

/**
 * 학생: 납품 검토 단계 주문을 완료(`completed`)로 전이. 본인 주문 + 허용 상태 + 납품 행 존재 필요.
 */
export async function acceptCustomOrderDeliverableAction(formData: FormData): Promise<void> {
  const { user } = await requireRole("student");
  const supabase = await createClient();
  const orderId = String(formData.get("orderId") ?? "").trim();
  if (!orderId) {
    redirect("/custom-request?error=" + encodeURIComponent("orderId가 필요합니다."));
  }

  const oT = await firstReadableCustomTable(supabase, ["custom_request_orders", "custom_orders", "request_orders"]);
  if (!oT.table) {
    redirectWithError(orderId, oT.error || "주문 테이블을 찾을 수 없습니다.");
  }
  const table = oT.table;

  const { data: rowData, error: oe } = await supabase.from(table).select("*").eq("id", orderId).maybeSingle();
  if (oe || !rowData) {
    redirectWithError(orderId, oe?.message ?? "주문을 찾을 수 없습니다.");
  }
  const row = rowData as Row;

  const access = canAccessOrder(row, user.id, "student");
  if (!access.ok) {
    redirectWithError(orderId, "이 주문을 수락할 권한이 없습니다.");
  }

  const { column: stuCol } = await pickExistingColumn(supabase, table, [
    "student_id",
    "buyer_id",
    "user_id",
    "client_id",
    "author_id",
    "requester_id",
  ]);
  if (!stuCol || String(row[stuCol]) !== user.id) {
    redirectWithError(orderId, "의뢰자(학생) 본인만 납품을 수락할 수 있습니다.");
  }

  const disputeBlock = await getActiveDisputeBlockMessage(supabase, orderId);
  if (disputeBlock) {
    redirectWithError(orderId, disputeBlock);
  }

  const norm = normalizedPrimaryOrderStatus(row);
  if (!norm) {
    redirectWithError(orderId, "주문 상태를 확인할 수 없어 수락할 수 없습니다.");
  }
  if (isOrderStatusTerminal(norm)) {
    redirectWithError(orderId, "이미 종료된 주문입니다.");
  }
  if (!isOrderStatusAllowingStudentAccept(norm)) {
    redirectWithError(orderId, `현재 상태(${norm})에서는 납품 수락을 할 수 없습니다.`);
  }

  const hasDel = await hasDeliverableRowsForOrder(supabase, orderId);
  if (!hasDel) {
    redirectWithError(orderId, "등록된 납품이 없어 수락할 수 없습니다.");
  }

  const stCol = primaryOrderStatusColumnKey(row);
  if (!stCol) {
    redirectWithError(orderId, "주문 상태 컬럼을 찾을 수 없습니다.");
  }

  const patch: Record<string, unknown> = { [stCol]: "completed" };

  const { column: atCol } = await pickExistingColumn(supabase, table, [
    "completed_at",
    "accepted_at",
    "closed_at",
    "finished_at",
  ]);
  if (atCol) {
    patch[atCol] = new Date().toISOString();
  }

  const { error: ue } = await supabase.from(table).update(patch).eq("id", orderId).eq(stuCol, user.id);
  if (ue) {
    redirectWithError(orderId, ue.message || "상태 갱신에 실패했습니다.");
  }

  revalidatePath(orderPath(orderId));
  revalidatePath("/custom-request");
  redirect(`${orderPath(orderId)}?ok=${encodeURIComponent("납품을 수락해 주문을 완료했습니다.")}`);
}
