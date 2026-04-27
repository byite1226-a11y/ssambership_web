"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getServerUserWithProfile } from "@/lib/auth/getServerUserWithProfile";
import { canAccessOrder } from "@/lib/customRequest/orderAccess";
import { firstReadableCustomTable } from "@/lib/customRequest/customRequestQueries";
import { getDisputeRowsForOrderId, hasActiveDisputeForOrderRows } from "@/lib/customRequest/orderDisputeHelpers";
import { isOrderStatusTerminal, normalizedPrimaryOrderStatus } from "@/lib/customRequest/orderLifecycleConstants";
import { pickOrderMentorIdFromRow, pickOrderStudentId, recordOrderEventBestEffort } from "@/lib/customRequest/orderRoomMutations";
import { pickExistingColumn } from "@/lib/qna/safeSelect";
import { createClient } from "@/lib/supabase/server";
import type { AppRole } from "@/lib/types/user";
import type { SupabaseClient } from "@supabase/supabase-js";

type Row = Record<string, unknown>;

function orderPath(orderId: string) {
  return `/custom-request/orders/${encodeURIComponent(orderId)}`;
}

function redirectWithError(orderId: string, msg: string): never {
  redirect(`${orderPath(orderId)}?error=${encodeURIComponent(msg)}`);
}

function isMissingCol(msg: string): boolean {
  return /column|does not exist|schema cache/i.test(msg);
}

/**
 * `disputes` — 004는 custom_request_order_id·student_id·mentor_id·body·status,
 * 002 draft 는 reason/description 등 혼재. insert 는 앱이 주문의 학생/멘토 id 를 그대로 싣는다.
 */
async function insertDisputeForCustomOrder(
  supabase: SupabaseClient,
  orderId: string,
  studentId: string,
  mentorId: string,
  body: string
): Promise<{ error: string | null }> {
  const tR = await firstReadableCustomTable(supabase, ["disputes", "order_disputes", "custom_disputes"]);
  if (!tR.table) {
    return { error: tR.error || "disputes 테이블 없음" };
  }
  const t = tR.table;
  const { column: fk } = await pickExistingColumn(supabase, t, [
    "custom_request_order_id",
    "order_id",
    "custom_order_id",
    "request_order_id",
  ]);
  if (!fk) {
    return { error: "disputes: 주문 FK 열 없음" };
  }
  const base: Record<string, unknown> = {
    [fk]: orderId,
    student_id: studentId,
    mentor_id: mentorId,
  };
  const trials: Record<string, unknown>[] = [
    { ...base, body, status: "open" },
    { ...base, body, state: "open" },
    { ...base, reason: body, status: "open" },
    { ...base, description: body, status: "open" },
    { ...base, body },
  ];
  for (const payload of trials) {
    const { error } = await supabase.from(t).insert(payload).select("id").limit(1);
    if (!error) {
      return { error: null };
    }
    if (!isMissingCol(error.message)) {
      return { error: error.message };
    }
  }
  return { error: "분쟁 기록을 저장하지 못했습니다(스키마 불일치)." };
}

/**
 * 맞춤의뢰 주문 분쟁 신청.
 * - 학생·멘토만(서버에서 프로필 역할·주문 매칭 검증).
 * - 종료(terminal) 주문: 이 화면에서 **새 분쟁 열지 않음** — 완료 후 이의는 운영·별도 절차로 본다.
 * - 이미 open/under_review/escalated 분쟁이 있으면 중복 신청 불가.
 * - order_events: dispute_opened (best-effort).
 */
export async function submitCustomOrderDisputeAction(formData: FormData): Promise<void> {
  const { user, profile, error: pe } = await getServerUserWithProfile();
  if (!user) {
    const oid = String(formData.get("orderId") ?? "").trim();
    redirect("/login?next=" + encodeURIComponent(oid ? orderPath(oid) : "/custom-request"));
  }
  if (pe) {
    console.error("[submitCustomOrderDisputeAction] profile", pe);
  }
  const role = profile?.role as AppRole | undefined;
  if (role !== "student" && role !== "mentor") {
    redirect("/custom-request?error=" + encodeURIComponent("학생·멘토만 분쟁을 신청할 수 있습니다."));
  }

  const supabase = await createClient();
  const orderId = String(formData.get("orderId") ?? "").trim();
  const body = String(formData.get("disputeBody") ?? "").trim();
  if (!orderId) {
    redirect("/custom-request?error=" + encodeURIComponent("orderId가 필요합니다."));
  }
  if (!body) {
    redirectWithError(orderId, "분쟁 내용을 입력하세요.");
  }
  if (body.length > 8000) {
    redirectWithError(orderId, "분쟁 내용은 8,000자 이하로 입력하세요.");
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

  const access = canAccessOrder(row, user.id, role);
  if (!access.ok) {
    redirectWithError(orderId, "이 주문에 분쟁을 제기할 권한이 없습니다.");
  }

  if (role === "student") {
    const { column: stuCol } = await pickExistingColumn(supabase, table, [
      "student_id",
      "buyer_id",
      "user_id",
      "client_id",
      "author_id",
      "requester_id",
    ]);
    if (!stuCol || String(row[stuCol]) !== user.id) {
      redirectWithError(orderId, "의뢰자(학생) 본인만 이 주문에서 분쟁을 신청할 수 있습니다.");
    }
  } else {
    const { column: menCol } = await pickExistingColumn(supabase, table, [
      "mentor_id",
      "mentor_user_id",
      "assignee_id",
      "assigned_mentor_id",
      "selected_mentor_id",
      "expert_id",
    ]);
    if (!menCol || String(row[menCol]) !== user.id) {
      redirectWithError(orderId, "배정 멘토 본인만 이 주문에서 분쟁을 신청할 수 있습니다.");
    }
  }

  const norm = normalizedPrimaryOrderStatus(row);
  if (!norm) {
    redirectWithError(orderId, "주문 상태를 확인할 수 없어 분쟁을 신청할 수 없습니다.");
  }
  if (isOrderStatusTerminal(norm)) {
    // 정책: completed/cancelled/closed 등 종료 뒤 동일 URL 로는 신규 분쟁 티켓을 열지 않음(환불·클레임은 별도).
    redirectWithError(orderId, "종료·완료된 주문에는 이 화면에서 새 분쟁을 열 수 없습니다.");
  }

  const { rows: existing } = await getDisputeRowsForOrderId(supabase, orderId);
  if (hasActiveDisputeForOrderRows(existing)) {
    redirectWithError(orderId, "이미 진행 중인 분쟁이 있습니다. 추가 절차는 운영에 문의하세요.");
  }

  const studentId = pickOrderStudentId(row);
  const mentorId = pickOrderMentorIdFromRow(row);
  if (!studentId) {
    redirectWithError(orderId, "의뢰자 정보를 찾을 수 없어 분쟁을 기록할 수 없습니다.");
  }
  if (!mentorId) {
    redirectWithError(orderId, "배정 멘토 정보를 찾을 수 없어 분쟁을 기록할 수 없습니다.");
  }

  const ins = await insertDisputeForCustomOrder(supabase, orderId, studentId, mentorId, body);
  if (ins.error) {
    redirectWithError(orderId, ins.error);
  }

  await recordOrderEventBestEffort(supabase, orderId, "dispute_opened", user.id, { party: role });
  revalidatePath(orderPath(orderId));
  revalidatePath("/custom-request");
  redirect(`${orderPath(orderId)}?ok=${encodeURIComponent("분쟁이 접수되었습니다. 운영이 검토합니다.")}`);
}
