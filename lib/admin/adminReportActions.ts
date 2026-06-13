"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/routeGuard";
import { toAdminDisplayError } from "@/lib/admin/adminDisplayError";
import { logAdminAction } from "@/lib/admin/adminActionLog";
import { createClient } from "@/lib/supabase/server";

const PATH = "/admin/moderation";
const TABLE = "content_reports";

const NEXT_ALLOWED = new Set(["reviewing", "resolved", "dismissed"]);

function textFromForm(v: FormDataEntryValue | null): string {
  return typeof v === "string" ? v.trim() : "";
}

function errUrl(msg: string) {
  const q = new URLSearchParams();
  q.set("error", msg);
  return `${PATH}?${q.toString()}`;
}

function okUrl(kind: string) {
  return `${PATH}?ok=${encodeURIComponent(kind)}`;
}

function safeMsg(raw: string | null | undefined): string {
  return toAdminDisplayError(raw, "reports") ?? "처리에 실패했습니다. 잠시 후 다시 시도해 주세요.";
}

export async function updateContentReportStatusAction(formData: FormData) {
  const { user } = await requireRole("admin");
  const reportId = textFromForm(formData.get("reportId"));
  const nextStatus = textFromForm(formData.get("nextStatus")).toLowerCase();
  const note = textFromForm(formData.get("note"));

  if (!reportId) {
    redirect(errUrl(safeMsg("신고를 식별할 수 없습니다.")));
  }
  if (!NEXT_ALLOWED.has(nextStatus)) {
    redirect(errUrl(safeMsg("허용되지 않은 처리 단계입니다.")));
  }

  const supabase = await createClient();

  const patch: Record<string, unknown> = {
    status: nextStatus,
  };
  if (note) {
    patch.admin_note = note;
  }
  if (nextStatus === "resolved" || nextStatus === "dismissed") {
    patch.resolved_at = new Date().toISOString();
    patch.resolved_by = user.id;
  }

  const { data, error } = await supabase
    .from(TABLE)
    .update(patch)
    .eq("id", reportId)
    .in("status", ["pending", "reviewing"])
    .select("id");

  if (error) {
    redirect(errUrl(safeMsg(error.message)));
  }
  if (!data?.length) {
    redirect(errUrl(safeMsg("이미 처리되었거나 변경할 수 없는 상태입니다.")));
  }

  await logAdminAction(supabase, {
    adminId: user.id,
    actionType: "content_report_status",
    targetType: "content_report",
    targetId: reportId,
    detail: { status: nextStatus, note },
  });

  revalidatePath(PATH);
  revalidatePath("/admin/dashboard");
  redirect(okUrl(nextStatus));
}

const MODERATION_INTENTS = new Set(["hidden", "deleted", "restored"]);

/** 숨김 / 삭제 / 정상 복구 */
export async function updateContentReportModerationAction(formData: FormData) {
  const { user } = await requireRole("admin");
  const reportId = textFromForm(formData.get("reportId"));
  const intent = textFromForm(formData.get("intent")).toLowerCase();
  const note = textFromForm(formData.get("note"));

  if (!reportId) redirect(errUrl(safeMsg("신고를 식별할 수 없습니다.")));
  if (!MODERATION_INTENTS.has(intent)) redirect(errUrl(safeMsg("허용되지 않은 조치입니다.")));

  const supabase = await createClient();
  const statusMap: Record<string, string> = {
    hidden: "hidden",
    deleted: "removed",
    restored: "resolved",
  };
  const patch: Record<string, unknown> = { status: statusMap[intent] ?? intent };
  if (note) patch.admin_note = note;
  patch.resolved_at = new Date().toISOString();
  patch.resolved_by = user.id;

  const { data, error } = await supabase.from(TABLE).update(patch).eq("id", reportId).select("id");
  if (error) redirect(errUrl(safeMsg(error.message)));
  if (!data?.length) redirect(errUrl(safeMsg("처리할 수 없습니다.")));

  await logAdminAction(supabase, {
    adminId: user.id,
    actionType: `content_report_${intent}`,
    targetType: "content_report",
    targetId: reportId,
    detail: { note },
  });

  revalidatePath(PATH);
  redirect(okUrl(intent));
}
