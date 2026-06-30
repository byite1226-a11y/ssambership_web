"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/routeGuard";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { logAdminAction } from "@/lib/admin/adminActionLog";

function idsFromForm(formData: FormData): string[] {
  return formData
    .getAll("ids")
    .map((v) => (typeof v === "string" ? v.trim() : ""))
    .filter((v) => v.length > 0);
}
function text(formData: FormData, key: string): string {
  const v = formData.get(key);
  return typeof v === "string" ? v.trim() : "";
}
function backUrl(path: string, key: "ok" | "error", msg: string): string {
  return `${path}?${key}=${encodeURIComponent(msg)}`;
}

/** P1 ③ — 신고(content_reports) 일괄 상태 변경(reviewing/resolved/dismissed). */
export async function bulkUpdateContentReportsAction(formData: FormData) {
  const { user } = await requireRole("admin");
  const path = "/admin/moderation";
  const ids = idsFromForm(formData);
  const nextStatus = text(formData, "bulkStatus").toLowerCase();
  if (!ids.length) redirect(backUrl(path, "error", "선택된 항목이 없습니다."));
  if (!["reviewing", "resolved", "dismissed"].includes(nextStatus)) {
    redirect(backUrl(path, "error", "허용되지 않은 일괄 처리입니다."));
  }

  const admin = createServiceRoleClient();
  const patch: Record<string, unknown> = { status: nextStatus };
  if (nextStatus === "resolved" || nextStatus === "dismissed") {
    patch.resolved_at = new Date().toISOString();
    patch.resolved_by = user.id;
  }
  const { data, error } = await admin
    .from("content_reports")
    .update(patch)
    .in("id", ids)
    .in("status", ["pending", "reviewing"])
    .select("id");
  if (error) redirect(backUrl(path, "error", error.message));

  const n = (data as unknown[] | null)?.length ?? 0;
  await logAdminAction(admin, {
    adminId: user.id,
    actionType: "content_report_bulk_status",
    targetType: "content_report",
    detail: { nextStatus, requested: ids.length, applied: n },
  });
  revalidatePath(path);
  redirect(backUrl(path, "ok", `${n}건을 일괄 처리했습니다(${nextStatus}).`));
}

/** P1 ③ — 분쟁(disputes) 일괄 상태 변경(under_review/resolved). */
export async function bulkUpdateDisputesAction(formData: FormData) {
  const { user } = await requireRole("admin");
  const path = "/admin/disputes";
  const ids = idsFromForm(formData);
  const nextStatus = text(formData, "bulkStatus").toLowerCase();
  if (!ids.length) redirect(backUrl(path, "error", "선택된 항목이 없습니다."));
  if (!["under_review", "resolved", "dismissed"].includes(nextStatus)) {
    redirect(backUrl(path, "error", "허용되지 않은 일괄 처리입니다."));
  }

  const admin = createServiceRoleClient();
  const patch: Record<string, unknown> = { status: nextStatus };
  if (nextStatus === "resolved" || nextStatus === "dismissed") {
    patch.resolved_at = new Date().toISOString();
    patch.resolved_by = user.id;
  }
  const { data, error } = await admin.from("disputes").update(patch).in("id", ids).select("id");
  if (error) redirect(backUrl(path, "error", error.message));

  const n = (data as unknown[] | null)?.length ?? 0;
  await logAdminAction(admin, {
    adminId: user.id,
    actionType: "dispute_bulk_status",
    targetType: "dispute",
    detail: { nextStatus, requested: ids.length, applied: n },
  });
  revalidatePath(path);
  redirect(backUrl(path, "ok", `${n}건을 일괄 처리했습니다(${nextStatus}).`));
}

/** P1 ③ — 환불(refunds) 일괄 승인/거절(검증된 RPC 반복 호출). */
export async function bulkProcessRefundsAction(formData: FormData) {
  const { user } = await requireRole("admin");
  const path = "/admin/refunds";
  const ids = idsFromForm(formData);
  const decision = text(formData, "bulkDecision").toLowerCase();
  if (!ids.length) redirect(backUrl(path, "error", "선택된 항목이 없습니다."));
  if (decision !== "approve" && decision !== "reject") {
    redirect(backUrl(path, "error", "허용되지 않은 일괄 처리입니다."));
  }

  const admin = createServiceRoleClient();
  const rpc = decision === "approve" ? "approve_refund_request_admin" : "reject_refund_request_admin";
  let success = 0;
  let failed = 0;
  for (const refundId of ids) {
    const { data, error } = await admin.rpc(rpc, {
      p_refund_id: refundId,
      p_admin_id: user.id,
      p_admin_note: `일괄 ${decision === "approve" ? "승인" : "거절"}`,
    });
    const payload = (data ?? null) as { ok?: boolean } | null;
    if (error || !payload?.ok) failed += 1;
    else success += 1;
  }

  await logAdminAction(admin, {
    adminId: user.id,
    actionType: `refund_bulk_${decision}`,
    targetType: "refund",
    detail: { requested: ids.length, success, failed },
  });
  revalidatePath(path);
  revalidatePath("/admin/dashboard");
  redirect(
    backUrl(
      path,
      failed > 0 ? "error" : "ok",
      `일괄 ${decision === "approve" ? "승인" : "거절"}: 성공 ${success}건${failed ? `, 실패 ${failed}건` : ""}.`
    )
  );
}
