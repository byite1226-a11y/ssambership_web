import type { SupabaseClient } from "@supabase/supabase-js";

export type AdminActionLogInput = {
  adminId: string;
  actionType: string;
  targetType?: string | null;
  targetId?: string | null;
  detail?: Record<string, unknown> | null;
};

/** 관리자 작업 감사 로그 — 실패해도 본 작업은 유지(best-effort). */
export async function logAdminAction(supabase: SupabaseClient, input: AdminActionLogInput): Promise<void> {
  const payload: Record<string, unknown> = {
    admin_id: input.adminId,
    action_type: input.actionType,
    target_type: input.targetType ?? null,
    target_id: input.targetId ?? null,
    detail: input.detail ?? null,
  };
  const { error } = await supabase.from("admin_action_logs").insert(payload);
  if (error) {
    console.error("[logAdminAction]", error.message, payload);
  }
}
