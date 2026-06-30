"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/routeGuard";
import { logAdminAction } from "@/lib/admin/adminActionLog";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import {
  applyAccountStatus,
  WARNING_AUTO_SUSPEND_THRESHOLD,
  WARNING_AUTO_SUSPEND_DAYS,
} from "@/lib/admin/accountStatusCore";

const PATH = "/admin/users";

const ALLOWED_STATUS = new Set(["active", "suspended", "banned"]);

function textFromForm(v: FormDataEntryValue | null): string {
  return typeof v === "string" ? v.trim() : "";
}

function errUrl(msg: string) {
  return `${PATH}?error=${encodeURIComponent(msg)}`;
}
function okUrl(kind: string) {
  return `${PATH}?ok=${encodeURIComponent(kind)}`;
}

function suspendedUntilIso(durationDays: number | null): string | null {
  if (!durationDays || durationDays <= 0) return null;
  const d = new Date();
  d.setDate(d.getDate() + durationDays);
  return d.toISOString();
}

/**
 * 관리자 계정 상태 변경 — active / suspended / banned.
 * suspended 는 durationDays 가 있으면 그만큼 후 자동 해제(suspended_until).
 */
export async function setUserStatusAction(formData: FormData) {
  const { user } = await requireRole("admin");
  const targetUserId = textFromForm(formData.get("userId"));
  const nextStatus = textFromForm(formData.get("nextStatus")).toLowerCase();
  const reason = textFromForm(formData.get("reason"));
  const durationRaw = textFromForm(formData.get("durationDays"));
  const durationDays = durationRaw ? Number.parseInt(durationRaw, 10) : null;

  if (!targetUserId) redirect(errUrl("대상 계정을 식별할 수 없습니다."));
  if (!ALLOWED_STATUS.has(nextStatus)) redirect(errUrl("허용되지 않은 상태값입니다."));
  if (targetUserId === user.id) redirect(errUrl("본인 계정 상태는 변경할 수 없습니다."));

  let admin: ReturnType<typeof createServiceRoleClient>;
  try {
    admin = createServiceRoleClient();
  } catch {
    redirect(errUrl("서버 설정 오류로 처리할 수 없습니다."));
  }

  // 관리자 계정은 보호(다른 관리자 정지 방지)
  const { data: targetRow } = await admin
    .from("users")
    .select("id, role, status")
    .eq("id", targetUserId)
    .maybeSingle();
  if (!targetRow) redirect(errUrl("대상 계정을 찾을 수 없습니다."));
  if ((targetRow as { role?: string }).role === "admin") {
    redirect(errUrl("관리자 계정은 상태를 변경할 수 없습니다."));
  }

  const nowIso = new Date().toISOString();
  const patch: Record<string, unknown> = {
    status: nextStatus,
    status_reason: reason || null,
    status_changed_at: nowIso,
    status_changed_by: user.id,
    suspended_until: nextStatus === "suspended" ? suspendedUntilIso(durationDays) : null,
  };

  const { data, error } = await admin
    .from("users")
    .update(patch)
    .eq("id", targetUserId)
    .select("id");
  if (error) redirect(errUrl(error.message));
  if (!data?.length) redirect(errUrl("상태를 변경하지 못했습니다."));

  await logAdminAction(admin, {
    adminId: user.id,
    actionType: "account_status_change",
    targetType: "user",
    targetId: targetUserId,
    detail: { status: nextStatus, reason, durationDays },
  });

  revalidatePath(PATH);
  revalidatePath("/admin/dashboard");
  redirect(okUrl(nextStatus));
}

/**
 * P1 ② — 사용자 경고 발급. 활성 경고가 임계치(3)에 도달하면 자동 일시정지(7일).
 */
export async function issueUserWarningAction(formData: FormData) {
  const { user } = await requireRole("admin");
  const targetUserId = textFromForm(formData.get("userId"));
  const reason = textFromForm(formData.get("warnReason"));
  const severity = textFromForm(formData.get("severity")) === "severe" ? "severe" : "normal";

  if (!targetUserId) redirect(errUrl("대상 계정을 식별할 수 없습니다."));
  if (reason.length < 2) redirect(errUrl("경고 사유를 입력해 주세요."));
  if (targetUserId === user.id) redirect(errUrl("본인에게는 경고를 발급할 수 없습니다."));

  let admin: ReturnType<typeof createServiceRoleClient>;
  try {
    admin = createServiceRoleClient();
  } catch {
    redirect(errUrl("서버 설정 오류로 처리할 수 없습니다."));
  }

  const { error: insErr } = await admin.from("user_warnings").insert({
    user_id: targetUserId,
    issued_by: user.id,
    reason,
    severity,
    source: "admin",
  });
  if (insErr) redirect(errUrl(`경고 발급 실패: ${insErr.message}`));

  // 활성 경고 누적 카운트
  const { count } = await admin
    .from("user_warnings")
    .select("id", { count: "exact", head: true })
    .eq("user_id", targetUserId)
    .eq("is_active", true);
  const warnings = count ?? 0;

  let autoSuspended = false;
  if (warnings >= WARNING_AUTO_SUSPEND_THRESHOLD) {
    const res = await applyAccountStatus(admin, {
      targetUserId,
      nextStatus: "suspended",
      durationDays: WARNING_AUTO_SUSPEND_DAYS,
      reason: `경고 ${warnings}회 누적 자동 정지`,
      adminId: user.id,
    });
    autoSuspended = res.ok;
  }

  await logAdminAction(admin, {
    adminId: user.id,
    actionType: "user_warning_issued",
    targetType: "user",
    targetId: targetUserId,
    detail: { reason, severity, warnings, autoSuspended },
  });

  revalidatePath(PATH);
  redirect(
    okUrl(
      autoSuspended
        ? `warned_suspended:${warnings}`
        : `warned:${warnings}`
    )
  );
}
