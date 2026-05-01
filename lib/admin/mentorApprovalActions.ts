"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireRole } from "@/lib/auth/routeGuard";
import { toAdminDisplayError } from "@/lib/admin/adminDisplayError";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { MENTOR_PENDING_STATUS_VALUES_FOR_IN } from "@/lib/admin/mentorApprovalConstants";
import { pickExistingColumn } from "@/lib/qna/safeSelect";

const PATH = "/admin/mentor-approvals";
const TABLE = "mentor_profiles";

function textFromForm(v: FormDataEntryValue | null): string {
  return typeof v === "string" ? v.trim() : "";
}

function errUrl(safeMessage: string) {
  const q = new URLSearchParams();
  q.set("error", safeMessage);
  return `${PATH}?${q.toString()}`;
}

function okUrl(kind: string) {
  return `${PATH}?ok=${encodeURIComponent(kind)}`;
}

function safeActionMsg(raw: string | null | undefined): string {
  return toAdminDisplayError(raw, "mentorApprovals") ?? "처리에 실패했습니다. 잠시 후 다시 시도해 주세요.";
}

async function statusColumn(admin: SupabaseClient): Promise<string | null> {
  const r = await pickExistingColumn(admin, TABLE, ["verification_status", "status", "approval_status", "review_state"]);
  return r.column;
}

async function buildApprovePatch(admin: SupabaseClient, adminUserId: string, note: string): Promise<Record<string, unknown> | null> {
  const st = await statusColumn(admin);
  if (!st) return null;
  const patch: Record<string, unknown> = { [st]: "approved" };
  const reviewedAt = await pickExistingColumn(admin, TABLE, ["reviewed_at", "approved_at", "verified_at"]);
  if (reviewedAt.column) patch[reviewedAt.column] = new Date().toISOString();
  const reviewedBy = await pickExistingColumn(admin, TABLE, ["reviewed_by", "approved_by", "verified_by"]);
  if (reviewedBy.column) patch[reviewedBy.column] = adminUserId;
  if (note) {
    const noteCol = await pickExistingColumn(admin, TABLE, ["admin_note", "review_note", "note"]);
    if (noteCol.column) patch[noteCol.column] = note;
  }
  return patch;
}

async function buildRejectPatch(admin: SupabaseClient, adminUserId: string, reason: string): Promise<Record<string, unknown> | null> {
  const st = await statusColumn(admin);
  if (!st) return null;
  const patch: Record<string, unknown> = { [st]: "rejected" };
  const ra = await pickExistingColumn(admin, TABLE, ["rejected_at", "reviewed_at"]);
  if (ra.column) patch[ra.column] = new Date().toISOString();
  const rb = await pickExistingColumn(admin, TABLE, ["rejected_by", "reviewed_by"]);
  if (rb.column) patch[rb.column] = adminUserId;
  if (reason) {
    const rc = await pickExistingColumn(admin, TABLE, ["rejection_reason", "admin_note", "review_note", "note"]);
    if (rc.column) patch[rc.column] = reason;
  }
  return patch;
}

async function runMentorProfileUpdate(
  mentorUserId: string,
  statusCol: string,
  patch: Record<string, unknown>
): Promise<{ touched: boolean; errorMsg: string | null }> {
  const pendingList = [...MENTOR_PENDING_STATUS_VALUES_FOR_IN];
  const exec = async (client: SupabaseClient) =>
    client.from(TABLE).update(patch).eq("user_id", mentorUserId).in(statusCol, pendingList).select("user_id");

  const session = await createClient();
  const first = await exec(session);
  if (first.error && !/permission|row-level|rls|denied|policy/i.test(first.error.message)) {
    return { touched: false, errorMsg: first.error.message };
  }
  if (!first.error && first.data && first.data.length > 0) {
    return { touched: true, errorMsg: null };
  }

  try {
    const sr = createServiceRoleClient();
    const second = await exec(sr);
    if (second.error) return { touched: false, errorMsg: second.error.message };
    if (second.data && second.data.length > 0) return { touched: true, errorMsg: null };
    return { touched: false, errorMsg: null };
  } catch {
    if (first.error) return { touched: false, errorMsg: first.error.message };
    return { touched: false, errorMsg: null };
  }
}

export async function approveMentorApplicationAction(formData: FormData) {
  const { user } = await requireRole("admin");
  const mentorUserId = textFromForm(formData.get("mentorUserId"));
  const adminNote = textFromForm(formData.get("note"));

  if (!mentorUserId) {
    redirect(errUrl(safeActionMsg("신청을 식별할 수 없습니다.")));
  }

  let admin: SupabaseClient;
  try {
    admin = createServiceRoleClient();
  } catch {
    admin = await createClient();
  }

  const st = await statusColumn(admin);
  if (!st) {
    redirect(errUrl("승인 상태를 변경할 수 있는 컬럼을 찾지 못했습니다."));
  }

  const patch = await buildApprovePatch(admin, user.id, adminNote);
  if (!patch) {
    redirect(errUrl("승인 상태를 변경할 수 있는 컬럼을 찾지 못했습니다."));
  }

  const { touched, errorMsg } = await runMentorProfileUpdate(mentorUserId, st, patch);
  if (errorMsg) {
    redirect(errUrl(safeActionMsg(errorMsg)));
  }
  if (!touched) {
    redirect(errUrl(safeActionMsg("이미 처리되었거나 승인 대기 상태가 아닙니다.")));
  }

  revalidatePath(PATH);
  revalidatePath("/admin");
  redirect(okUrl("approve"));
}

export async function rejectMentorApplicationAction(formData: FormData) {
  const { user } = await requireRole("admin");
  const mentorUserId = textFromForm(formData.get("mentorUserId"));
  const reason = textFromForm(formData.get("note"));

  if (!mentorUserId) {
    redirect(errUrl(safeActionMsg("신청을 식별할 수 없습니다.")));
  }

  let admin: SupabaseClient;
  try {
    admin = createServiceRoleClient();
  } catch {
    admin = await createClient();
  }

  const st = await statusColumn(admin);
  if (!st) {
    redirect(errUrl("승인 상태를 변경할 수 있는 컬럼을 찾지 못했습니다."));
  }

  const patch = await buildRejectPatch(admin, user.id, reason);
  if (!patch) {
    redirect(errUrl("승인 상태를 변경할 수 있는 컬럼을 찾지 못했습니다."));
  }

  const { touched, errorMsg } = await runMentorProfileUpdate(mentorUserId, st, patch);
  if (errorMsg) {
    redirect(errUrl(safeActionMsg(errorMsg)));
  }
  if (!touched) {
    redirect(errUrl(safeActionMsg("이미 처리되었거나 승인 대기 상태가 아닙니다.")));
  }

  revalidatePath(PATH);
  revalidatePath("/admin");
  redirect(okUrl("reject"));
}
