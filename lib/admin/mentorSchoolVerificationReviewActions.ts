"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireRole } from "@/lib/auth/routeGuard";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { logAdminAction } from "@/lib/admin/adminActionLog";
import {
  SCHOOL_TIERS,
  VERIFIED_MAJOR_CATEGORIES,
  type SchoolTier,
  type VerifiedMajorCategory,
} from "@/lib/mentor/schoolVerificationConstants";
import { mapDataErrorMessage } from "@/lib/utils/mapDataError";

const PATH = "/admin/mentor-approval";
const TABLE = "mentor_school_verifications";
const REVIEWABLE_STATUSES = ["pending", "resubmit_required"] as const;

function textFromForm(v: FormDataEntryValue | null): string {
  return typeof v === "string" ? v.trim() : "";
}

function errUrl(message: string): string {
  const q = new URLSearchParams();
  q.set("error", message);
  return `${PATH}?${q.toString()}`;
}

function okUrl(kind: "school-approve" | "school-reject" | "school-resubmit"): string {
  return `${PATH}?ok=${encodeURIComponent(kind)}`;
}

async function writeClient(): Promise<SupabaseClient> {
  try {
    return createServiceRoleClient();
  } catch {
    return createClient();
  }
}

function asMajorCategory(value: string): VerifiedMajorCategory | null {
  return (VERIFIED_MAJOR_CATEGORIES as readonly string[]).includes(value) ? (value as VerifiedMajorCategory) : null;
}

function asSchoolTier(value: string): SchoolTier | null {
  return (SCHOOL_TIERS as readonly string[]).includes(value) ? (value as SchoolTier) : null;
}

function buildSimpleUniversityId(universityName: string): string {
  return universityName
    .normalize("NFKC")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w가-힣-]+/g, "")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function updateReviewableRow(
  admin: SupabaseClient,
  verificationId: string,
  patch: Record<string, unknown>
): Promise<{ row: { id: string; mentor_id: string } | null; error: string | null }> {
  const { data, error } = await admin
    .from(TABLE)
    .update(patch)
    .eq("id", verificationId)
    .in("status", [...REVIEWABLE_STATUSES])
    .select("id, mentor_id")
    .maybeSingle();

  if (error) {
    return { row: null, error: error.message };
  }
  return { row: (data as { id: string; mentor_id: string } | null) ?? null, error: null };
}

async function logSchoolVerificationAction(
  adminId: string,
  actionType: string,
  targetId: string,
  detail: Record<string, unknown>
): Promise<void> {
  const session = await createClient();
  await logAdminAction(session, {
    adminId,
    actionType,
    targetType: "mentor_school_verification",
    targetId,
    detail,
  });
}

export async function approveMentorSchoolVerificationAction(formData: FormData) {
  const { user } = await requireRole("admin");
  const verificationId = textFromForm(formData.get("verificationId"));
  const verifiedUniversityName = textFromForm(formData.get("verifiedUniversityName"));
  const verifiedUniversityIdInput = textFromForm(formData.get("verifiedUniversityId"));
  const verifiedDepartmentName = textFromForm(formData.get("verifiedDepartmentName"));
  const verifiedMajorCategory = asMajorCategory(textFromForm(formData.get("verifiedMajorCategory")));
  const schoolTier = asSchoolTier(textFromForm(formData.get("schoolTier")));

  if (!verificationId) {
    redirect(errUrl("학교·전공 인증 요청을 식별할 수 없습니다."));
  }
  if (!verifiedUniversityName || !verifiedDepartmentName || !verifiedMajorCategory || !schoolTier) {
    redirect(errUrl("승인하려면 학교명, 학과명, 전공 계열, 학교군을 모두 입력해야 합니다."));
  }

  const verifiedUniversityId = verifiedUniversityIdInput || buildSimpleUniversityId(verifiedUniversityName);
  if (!verifiedUniversityId) {
    redirect(errUrl("정규화 학교 키를 만들 수 없습니다. 학교명을 확인해 주세요."));
  }

  const admin = await writeClient();
  const reviewedAt = new Date().toISOString();
  const patch = {
    status: "approved",
    verified_university_name: verifiedUniversityName,
    verified_university_id: verifiedUniversityId,
    verified_department_name: verifiedDepartmentName,
    verified_major_category: verifiedMajorCategory,
    school_tier: schoolTier,
    reviewed_by: user.id,
    reviewed_at: reviewedAt,
    reject_reason: null,
  };

  const { row, error } = await updateReviewableRow(admin, verificationId, patch);
  if (error) {
    redirect(errUrl(mapDataErrorMessage(error)));
  }
  if (!row) {
    redirect(errUrl("이미 처리되었거나 심사 대기 상태가 아닌 요청입니다."));
  }

  await logSchoolVerificationAction(user.id, "mentor_school_verification_approve", row.id, {
    mentorId: row.mentor_id,
    verifiedUniversityName,
    verifiedUniversityId,
    verifiedDepartmentName,
    verifiedMajorCategory,
    schoolTier,
    reviewedAt,
  });

  revalidatePath(PATH);
  revalidatePath("/mentor/verification");
  redirect(okUrl("school-approve"));
}

export async function rejectMentorSchoolVerificationAction(formData: FormData) {
  const { user } = await requireRole("admin");
  const verificationId = textFromForm(formData.get("verificationId"));
  const rejectReason = textFromForm(formData.get("rejectReason"));

  if (!verificationId) {
    redirect(errUrl("학교·전공 인증 요청을 식별할 수 없습니다."));
  }
  if (!rejectReason) {
    redirect(errUrl("반려 사유를 입력해 주세요."));
  }

  const admin = await writeClient();
  const reviewedAt = new Date().toISOString();
  const { row, error } = await updateReviewableRow(admin, verificationId, {
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

  await logSchoolVerificationAction(user.id, "mentor_school_verification_reject", row.id, {
    mentorId: row.mentor_id,
    reason: rejectReason,
    reviewedAt,
  });

  revalidatePath(PATH);
  revalidatePath("/mentor/verification");
  redirect(okUrl("school-reject"));
}

export async function requestMentorSchoolVerificationResubmitAction(formData: FormData) {
  const { user } = await requireRole("admin");
  const verificationId = textFromForm(formData.get("verificationId"));
  const rejectReason = textFromForm(formData.get("rejectReason"));

  if (!verificationId) {
    redirect(errUrl("학교·전공 인증 요청을 식별할 수 없습니다."));
  }
  if (!rejectReason) {
    redirect(errUrl("재제출 요청 사유를 입력해 주세요."));
  }

  const admin = await writeClient();
  const reviewedAt = new Date().toISOString();
  const { row, error } = await updateReviewableRow(admin, verificationId, {
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

  await logSchoolVerificationAction(user.id, "mentor_school_verification_resubmit_required", row.id, {
    mentorId: row.mentor_id,
    reason: rejectReason,
    reviewedAt,
  });

  revalidatePath(PATH);
  revalidatePath("/mentor/verification");
  redirect(okUrl("school-resubmit"));
}
