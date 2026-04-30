"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/routeGuard";
import { canAccessOrder } from "@/lib/customRequest/orderAccess";
import { firstReadableCustomTable } from "@/lib/customRequest/customRequestQueries";
import {
  isOrderStatusAllowingStudentAccept,
  isOrderRowTerminalForActions,
  normalizedPrimaryOrderStatus,
  orderStatusLabelForUi,
} from "@/lib/customRequest/orderLifecycleConstants";
import { getActiveDisputeBlockMessage } from "@/lib/customRequest/orderDisputeHelpers";
import { hasDeliverableRowsForOrder } from "@/lib/customRequest/orderStudentActions";
import { insertOrderRevisionRequest, recordOrderEventBestEffort } from "@/lib/customRequest/orderRoomMutations";
import { pickExistingColumn } from "@/lib/qna/safeSelect";
import { createClient } from "@/lib/supabase/server";

type Row = Record<string, unknown>;

function orderPath(orderId: string) {
  return `/custom-request/orders/${encodeURIComponent(orderId)}`;
}

function redirectWithError(orderId: string, msg: string): never {
  redirect(`${orderPath(orderId)}?error=${encodeURIComponent(msg)}`);
}

/**
 * 학생: 납품·검토 대기(수락 가능) 단계에서만 수정 요청. 완료·종료·납품 전 등은 서버에서 거절.
 */
export async function submitCustomOrderRevisionRequestAction(formData: FormData): Promise<void> {
  const { user } = await requireRole("student");
  const supabase = await createClient();
  const orderId = String(formData.get("orderId") ?? "").trim();
  const note = String(formData.get("requestNote") ?? "").trim();
  if (!orderId) {
    redirect("/custom-request?error=" + encodeURIComponent("orderId가 필요합니다."));
  }
  if (!note) {
    redirectWithError(orderId, "수정 요청 내용을 입력하세요.");
  }
  if (note.length > 8000) {
    redirectWithError(orderId, "수정 요청은 8,000자 이하로 입력하세요.");
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
    redirectWithError(orderId, "이 주문에 대한 접근 권한이 없습니다.");
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
    redirectWithError(orderId, "의뢰자(학생) 본인만 수정 요청을 보낼 수 있습니다.");
  }

  const disputeBlock = await getActiveDisputeBlockMessage(supabase, orderId);
  if (disputeBlock) {
    redirectWithError(orderId, disputeBlock);
  }

  const norm = normalizedPrimaryOrderStatus(row);
  if (!norm) {
    redirectWithError(orderId, "주문 상태를 확인할 수 없어 요청을 처리할 수 없습니다.");
  }
  if (isOrderRowTerminalForActions(row)) {
    redirectWithError(orderId, "완료된 주문에서는 수정 요청을 보낼 수 없습니다.");
  }
  if (!isOrderStatusAllowingStudentAccept(norm)) {
    redirectWithError(
      orderId,
      `납품 검토·수락 단계에서만 수정 요청할 수 있습니다(현재: ${orderStatusLabelForUi(norm)}).`
    );
  }
  const hasDel = await hasDeliverableRowsForOrder(supabase, orderId);
  if (!hasDel) {
    redirectWithError(orderId, "등록된 납품이 있어야 수정 요청을 할 수 있습니다.");
  }

  const ins = await insertOrderRevisionRequest(supabase, orderId, user.id, note);
  if (ins.error) {
    redirectWithError(orderId, "수정 요청 저장에 실패했습니다. " + ins.error);
  }
  await recordOrderEventBestEffort(supabase, orderId, "revision_requested", user.id, { noteLength: note.length });
  revalidatePath(orderPath(orderId));
  revalidatePath("/custom-request");
  redirect(`${orderPath(orderId)}?ok=${encodeURIComponent("수정 요청을 전달했습니다.")}`);
}
