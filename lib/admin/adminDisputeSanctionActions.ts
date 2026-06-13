"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/routeGuard";
import { logAdminAction } from "@/lib/admin/adminActionLog";
import { createClient } from "@/lib/supabase/server";

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

  await logAdminAction(supabase, {
    adminId: user.id,
    actionType: `dispute_${sanction}`,
    targetType: "dispute",
    targetId: disputeId,
    detail: { note },
  });

  revalidatePath(PATH);
  revalidatePath(`/admin/disputes/${disputeId}`);
  redirect(`${PATH}?ok=sanction`);
}
