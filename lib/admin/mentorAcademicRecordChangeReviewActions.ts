"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireRole } from "@/lib/auth/routeGuard";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { logAdminAction } from "@/lib/admin/adminActionLog";
import { mapDataErrorMessage } from "@/lib/utils/mapDataError";
import { MENTOR_ACADEMIC_RECORD_CHANGE_TABLE } from "@/lib/mentor/mentorAcademicRecordChange";

const PATH = "/admin/academic-record-changes";
const TABLE = MENTOR_ACADEMIC_RECORD_CHANGE_TABLE;
const REVIEWABLE_STATUSES = ["pending", "resubmit_required"] as const;

function textFromForm(v: FormDataEntryValue | null): string {
  return typeof v === "string" ? v.trim() : "";
}

function errUrl(message: string): string {
  const q = new URLSearchParams();
  q.set("error", message);
  return `${PATH}?${q.toString()}`;
}

function okUrl(kind: "approve" | "reject" | "resubmit"): string {
  return `${PATH}?ok=${encodeURIComponent(kind)}`;
}

async function writeClient(): Promise<SupabaseClient> {
  try {
    return createServiceRoleClient();
  } catch {
    return createClient();
  }
}

async function updateReviewableRow(
  admin: SupabaseClient,
  requestId: string,
  patch: Record<string, unknown>
): Promise<{ row: { id: string; mentor_id: string } | null; error: string | null }> {
  const { data, error } = await admin
    .from(TABLE)
    .update(patch)
    .eq("id", requestId)
    .in("status", [...REVIEWABLE_STATUSES])
    .select("id, mentor_id")
    .maybeSingle();

  if (error) {
    return { row: null, error: error.message };
  }
  return { row: (data as { id: string; mentor_id: string } | null) ?? null, error: null };
}

async function logAction(
  adminId: string,
  actionType: string,
  targetId: string,
  detail: Record<string, unknown>
): Promise<void> {
  const session = await createClient();
  await logAdminAction(session, {
    adminId,
    actionType,
    targetType: "mentor_academic_record_change",
    targetId,
    detail,
  });
}

export async function approveMentorAcademicRecordChangeAction(formData: FormData) {
  const { user } = await requireRole("admin");
  const requestId = textFromForm(formData.get("requestId"));
  const approvedUniversityName = textFromForm(formData.get("approvedUniversityName"));

  if (!requestId) {
    redirect(errUrl("학적변경요청을 식별할 수 없습니다."));
  }
  if (!approvedUniversityName) {
    redirect(errUrl("승인하려면 확정 학교명을 입력해야 합니다."));
  }

  const admin = await writeClient();
  const reviewedAt = new Date().toISOString();
  const { row, error } = await updateReviewableRow(admin, requestId, {
    status: "approved",
    approved_university_name: approvedUniversityName,
    reviewed_by: user.id,
    reviewed_at: reviewedAt,
    reject_reason: null,
  });

  if (error) {
    redirect(errUrl(mapDataErrorMessage(error)));
  }
  if (!row) {
    redirect(errUrl("이미 처리되었거나 심사 대기 상태가 아닌 요청입니다."));
  }

  // 승인 시에만 멘토 프로필의 학교명을 확정값으로 반영한다(잠금 해제 경로).
  const { error: profileError } = await admin
    .from("mentor_profiles")
    .update({ university_name: approvedUniversityName, updated_at: reviewedAt })
    .eq("user_id", row.mentor_id);

  if (profileError) {
    // 요청은 이미 승인 처리됨 — 프로필 반영 실패는 별도 경고로 안내(요청 상태는 유지).
    await logAction(user.id, "mentor_academic_record_change_profile_apply_failed", row.id, {
      mentorId: row.mentor_id,
      approvedUniversityName,
      error: profileError.message,
    });
    redirect(errUrl(`요청은 승인됐지만 프로필 학교 반영에 실패했습니다: ${mapDataErrorMessage(profileError.message)}`));
  }

  await logAction(user.id, "mentor_academic_record_change_approve", row.id, {
    mentorId: row.mentor_id,
    approvedUniversityName,
    reviewedAt,
  });

  revalidatePath(PATH);
  revalidatePath("/mentor/academic-record-change");
  revalidatePath("/mentor/profile/edit");
  revalidatePath("/mentors");
  redirect(okUrl("approve"));
}

export async function rejectMentorAcademicRecordChangeAction(formData: FormData) {
  const { user } = await requireRole("admin");
  const requestId = textFromForm(formData.get("requestId"));
  const rejectReason = textFromForm(formData.get("rejectReason"));

  if (!requestId) {
    redirect(errUrl("학적변경요청을 식별할 수 없습니다."));
  }
  if (!rejectReason) {
    redirect(errUrl("반려 사유를 입력해 주세요."));
  }

  const admin = await writeClient();
  const reviewedAt = new Date().toISOString();
  const { row, error } = await updateReviewableRow(admin, requestId, {
    status: "rejected",
    reviewed_by: user.id,
    reviewed_at: reviewedAt,
    reject_reason: rejectReason,
  });

  if (error) {
    redirect(errUrl(mapDataErrorMessage(error)));
  }
  if (!row) {
    redirect(errUrl("이미 처리되었거나 심사 대기 상태가 아닌 요청입니다."));
  }

  await logAction(user.id, "mentor_academic_record_change_reject", row.id, {
    mentorId: row.mentor_id,
    reason: rejectReason,
    reviewedAt,
  });

  revalidatePath(PATH);
  revalidatePath("/mentor/academic-record-change");
  redirect(okUrl("reject"));
}

export async function requestMentorAcademicRecordChangeResubmitAction(formData: FormData) {
  const { user } = await requireRole("admin");
  const requestId = textFromForm(formData.get("requestId"));
  const rejectReason = textFromForm(formData.get("rejectReason"));

  if (!requestId) {
    redirect(errUrl("학적변경요청을 식별할 수 없습니다."));
  }
  if (!rejectReason) {
    redirect(errUrl("재제출 요청 사유를 입력해 주세요."));
  }

  const admin = await writeClient();
  const reviewedAt = new Date().toISOString();
  const { row, error } = await updateReviewableRow(admin, requestId, {
    status: "resubmit_required",
    reviewed_by: user.id,
    reviewed_at: reviewedAt,
    reject_reason: rejectReason,
  });

  if (error) {
    redirect(errUrl(mapDataErrorMessage(error)));
  }
  if (!row) {
    redirect(errUrl("이미 처리되었거나 심사 대기 상태가 아닌 요청입니다."));
  }

  await logAction(user.id, "mentor_academic_record_change_resubmit_required", row.id, {
    mentorId: row.mentor_id,
    reason: rejectReason,
    reviewedAt,
  });

  revalidatePath(PATH);
  revalidatePath("/mentor/academic-record-change");
  redirect(okUrl("resubmit"));
}
