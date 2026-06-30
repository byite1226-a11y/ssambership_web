"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/routeGuard";
import { logAdminAction } from "@/lib/admin/adminActionLog";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { tryInsertAdminDisputeNote } from "@/lib/admin/adminCaseNotes";
import { applyAccountStatus, sanctionToAccountStatus } from "@/lib/admin/accountStatusCore";

const PATH = "/admin/disputes";

function errUrl(msg: string) {
  return `${PATH}?error=${encodeURIComponent(msg)}`;
}

/** 분쟁/신고 제재 — 운영 메모와 함께 기록 */
export async function applyDisputeSanctionAction(formData: FormData) {
  const { user } = await requireRole("admin");
  const disputeId = String(formData.get("disputeId") ?? "").trim();
  const sanction = String(formData.get("sanction") ?? "").trim();
  const note = String(formData.get("note") ?? "").trim();
  const target = String(formData.get("target") ?? "mentor").trim().toLowerCase();

  if (!disputeId) redirect(errUrl("대상을 식별할 수 없습니다."));
  if (!["7d", "30d", "permanent", "hold", "complete"].includes(sanction)) {
    redirect(errUrl("허용되지 않은 조치입니다."));
  }

  const supabase = await createClient();
  const statusMap: Record<string, string> = {
    complete: "resolved",
    hold: "on_hold",
    "7d": "sanction_7d",
    "30d": "sanction_30d",
    permanent: "sanction_permanent",
  };
  const patch: Record<string, unknown> = { status: statusMap[sanction] ?? sanction };
  if (note) patch.admin_note = note;

  const { error } = await supabase.from("disputes").update(patch).eq("id", disputeId);
  if (error) redirect(errUrl("처리에 실패했습니다."));

  await tryInsertAdminDisputeNote(supabase, { disputeId, note, adminId: user.id });

  // P1 ④ — 제재 직결: 실제 계정 상태에 반영(7d/30d 정지, permanent 차단).
  let accountApplied: { target: string; status: string; userId: string | null } | null = null;
  const mapping = sanctionToAccountStatus(sanction);
  if (mapping) {
    try {
      const admin = createServiceRoleClient();
      const { data: dispute } = await admin
        .from("disputes")
        .select("student_id, mentor_id")
        .eq("id", disputeId)
        .maybeSingle();
      const d = (dispute as { student_id?: string | null; mentor_id?: string | null } | null) ?? null;
      const targetUserId = target === "student" ? d?.student_id ?? null : d?.mentor_id ?? null;
      if (targetUserId) {
        const res = await applyAccountStatus(admin, {
          targetUserId,
          nextStatus: mapping.nextStatus,
          durationDays: mapping.durationDays,
          reason: `분쟁 제재(${sanction})${note ? `: ${note}` : ""}`,
          adminId: user.id,
        });
        accountApplied = { target, status: res.ok ? mapping.nextStatus : `실패:${res.error}`, userId: targetUserId };
      }
    } catch (e) {
      console.error("[applyDisputeSanctionAction] account status", e);
    }
  }

  await logAdminAction(supabase, {
    adminId: user.id,
    actionType: `dispute_${sanction}`,
    targetType: "dispute",
    targetId: disputeId,
    detail: { note, target, accountApplied },
  });

  revalidatePath(PATH);
  revalidatePath(`/admin/disputes/${disputeId}`);
  redirect(`${PATH}?ok=sanction`);
}
