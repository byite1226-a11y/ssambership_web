"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getServerUserWithProfile } from "@/lib/auth/getServerUserWithProfile";
import { canAccessOrder } from "@/lib/customRequest/orderAccess";
import { firstReadableCustomTable } from "@/lib/customRequest/customRequestQueries";
import { getDisputeRowsForOrderId, hasActiveDisputeForOrderRows } from "@/lib/customRequest/orderDisputeHelpers";
import {
  isOrderStatusAllowingStudentAccept,
  isOrderRowTerminalForActions,
  normalizedPrimaryOrderStatus,
} from "@/lib/customRequest/orderLifecycleConstants";
import { hasDeliverableRowsForOrder } from "@/lib/customRequest/orderStudentActions";
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

/** PostgREST / Postgres — partial unique index 등으로 중복 삽입 시 */
function isUniqueViolation(error: { code?: string; message?: string } | null): boolean {
  const c = error?.code ?? "";
  if (c === "23505") {
    return true;
  }
  const m = (error?.message ?? "").toLowerCase();
  return m.includes("duplicate key") || m.includes("unique constraint") || m.includes("disputes_order_active_unique");
}

function readDisputeFormFields(formData: FormData): { orderId: string; disputeBody: string } {
  // 신뢰 가능한 입력은 orderId·disputeBody 뿐이다. student_id·mentor_id·status·submitted_by 등은 FormData에서 읽지 않는다.
  return {
    orderId: String(formData.get("orderId") ?? "").trim(),
    disputeBody: String(formData.get("disputeBody") ?? "").trim(),
  };
}

/**
 * `disputes` — 004는 custom_request_order_id·student_id·mentor_id·body·status,
 * 002 draft 는 reason/description 등 혼재. insert 는 주문 행에서만 학생/멘토 id 를 채우고, 상태는 서버에서만 고정한다.
 */
async function insertDisputeForCustomOrder(
  supabase: SupabaseClient,
  orderId: string,
  studentId: string,
  mentorId: string,
  body: string,
  submittedBy: string
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
  const { column: submittedByCol } = await pickExistingColumn(supabase, t, ["submitted_by"]);

  const base: Record<string, unknown> = {
    [fk]: orderId,
    student_id: studentId,
    mentor_id: mentorId,
  };
  if (submittedByCol) {
    base[submittedByCol] = submittedBy;
  }

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
    if (isUniqueViolation(error)) {
      return {
        error: "이미 진행 중인 분쟁이 있어 새로 접수할 수 없습니다. 추가 안내가 필요하면 고객센터로 문의해 주세요.",
      };
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
 * - 이미 open/under_review/escalated 분쟁이 있으면 중복 신청 불가(DB partial unique index와 병행).
 * - order_events: dispute_opened (best-effort).
 */
export async function submitCustomOrderDisputeAction(formData: FormData): Promise<void> {
  const { orderId, disputeBody: body } = readDisputeFormFields(formData);

  const { user, profile, error: pe } = await getServerUserWithProfile();
  if (!user) {
    redirect("/login?next=" + encodeURIComponent(orderId ? orderPath(orderId) : "/custom-request"));
  }
  if (pe) {
    console.error("[submitCustomOrderDisputeAction] profile", pe);
  }
  const role = profile?.role as AppRole | undefined;
  if (role !== "student" && role !== "mentor") {
    redirect("/custom-request?error=" + encodeURIComponent("학생·멘토만 분쟁을 신청할 수 있습니다."));
  }

  const supabase = await createClient();
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
  if (isOrderRowTerminalForActions(row)) {
    // 정책: completed/cancelled/closed 등 종료 뒤 동일 URL 로는 신규 분쟁 티켓을 열지 않음(환불·클레임은 별도).
    redirectWithError(orderId, "완료된 주문에서는 이 화면에서 새 분쟁을 열 수 없습니다.");
  }

  if (role === "mentor") {
    // 멘토 분쟁은 납품 이후 단계에서만 허용한다. 납품 전 진행 이슈는 메시지/고객센터로 처리.
    const hasDel = await hasDeliverableRowsForOrder(supabase, orderId);
    const inStudentReview = isOrderStatusAllowingStudentAccept(norm);
    if (!hasDel && !inStudentReview) {
      redirectWithError(
        orderId,
        "멘토는 납품이 등록된 이후(또는 학생 검토·수락 단계)에만 분쟁을 신청할 수 있습니다. 납품 전 이슈는 주문 메시지·고객센터로 문의해 주세요."
      );
    }
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

  const ins = await insertDisputeForCustomOrder(supabase, orderId, studentId, mentorId, body, user.id);
  if (ins.error) {
    redirectWithError(orderId, ins.error);
  }

  await recordOrderEventBestEffort(supabase, orderId, "dispute_opened", user.id, { party: role });
  revalidatePath(orderPath(orderId));
  revalidatePath("/custom-request");
  redirect(`${orderPath(orderId)}?ok=${encodeURIComponent("분쟁이 접수되었습니다. 운영이 검토합니다.")}`);
}
