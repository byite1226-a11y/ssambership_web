import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

/** 경고 누적 자동 정지 임계치 */
export const WARNING_AUTO_SUSPEND_THRESHOLD = 3;
/** 자동 정지 기간(일) */
export const WARNING_AUTO_SUSPEND_DAYS = 7;

export type ApplyAccountStatusInput = {
  targetUserId: string;
  nextStatus: "active" | "suspended" | "banned";
  durationDays?: number | null;
  reason?: string | null;
  adminId: string;
};

function suspendedUntilIso(durationDays: number | null | undefined): string | null {
  if (!durationDays || durationDays <= 0) return null;
  const d = new Date();
  d.setDate(d.getDate() + durationDays);
  return d.toISOString();
}

/**
 * 관리자 계정 상태 적용(공용) — 직접 토글 + 분쟁 제재 직결에서 재사용.
 * admin 은 service_role 클라이언트여야 다른 사용자 행을 갱신할 수 있다.
 * 관리자 계정은 보호.
 */
export async function applyAccountStatus(
  admin: SupabaseClient,
  input: ApplyAccountStatusInput
): Promise<{ ok: boolean; error?: string }> {
  const { data: targetRow } = await admin
    .from("users")
    .select("id, role")
    .eq("id", input.targetUserId)
    .maybeSingle();
  if (!targetRow) return { ok: false, error: "대상 계정을 찾을 수 없습니다." };
  if ((targetRow as { role?: string }).role === "admin") {
    return { ok: false, error: "관리자 계정은 상태를 변경할 수 없습니다." };
  }

  const patch: Record<string, unknown> = {
    status: input.nextStatus,
    status_reason: input.reason ?? null,
    status_changed_at: new Date().toISOString(),
    status_changed_by: input.adminId,
    suspended_until: input.nextStatus === "suspended" ? suspendedUntilIso(input.durationDays) : null,
  };

  const { data, error } = await admin
    .from("users")
    .update(patch)
    .eq("id", input.targetUserId)
    .select("id");
  if (error) return { ok: false, error: error.message };
  if (!data?.length) return { ok: false, error: "상태를 변경하지 못했습니다." };
  return { ok: true };
}

/** 분쟁 제재 코드 → 계정 상태 매핑. */
export function sanctionToAccountStatus(
  sanction: string
): { nextStatus: "active" | "suspended" | "banned"; durationDays: number | null } | null {
  switch (sanction) {
    case "7d":
      return { nextStatus: "suspended", durationDays: 7 };
    case "30d":
      return { nextStatus: "suspended", durationDays: 30 };
    case "permanent":
      return { nextStatus: "banned", durationDays: null };
    default:
      return null; // hold/complete 등은 계정 상태 변경 없음
  }
}
