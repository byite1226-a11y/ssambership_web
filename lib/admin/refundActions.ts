"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/routeGuard";
import { createServiceRoleClient } from "@/lib/supabase/admin";

const PATH = "/admin/refunds";

function qError(msg: string) {
  const p = new URLSearchParams();
  p.set("error", msg);
  return `${PATH}?${p.toString()}`;
}

function qOk(msg: string) {
  const p = new URLSearchParams();
  p.set("ok", msg);
  return `${PATH}?${p.toString()}`;
}

function textFromForm(v: FormDataEntryValue | null): string {
  return typeof v === "string" ? v.trim() : "";
}

type RpcPayload = {
  ok?: boolean;
  noop?: boolean;
  message?: string;
  status?: string;
};

function asRpcPayload(data: unknown): RpcPayload {
  if (data && typeof data === "object" && !Array.isArray(data)) {
    return data as RpcPayload;
  }
  return {};
}

function mapRpcExceptionMessage(raw: string): string {
  const t = String(raw);
  if (/ADMIN_REQUIRED/i.test(t)) {
    return "관리자 권한이 확인되지 않았습니다.";
  }
  if (/환불 금액이 설정되지 않아 자동 승인할 수 없습니다/.test(t)) {
    return "환불 금액이 설정되지 않아 자동 승인할 수 없습니다.";
  }
  if (/이미 정산 지급이 완료된 건/.test(t)) {
    return "이미 정산 지급이 완료된 건은 자동 환불할 수 없습니다. 수동 조정이 필요합니다.";
  }
  if (/CASH_WALLET_UPDATE_FAILED|REFUND_LEDGER|LEDGER_AMOUNT_MISMATCH|LEDGER_IDEMPOTENT/i.test(t)) {
    return "캐시 원장·지갑 처리 중 오류가 발생했습니다. 잠시 후 다시 시도하거나 관리자에게 문의해 주세요.";
  }
  if (/violates.*check|check constraint/i.test(t)) {
    return "데이터베이스 제약 조건과 맞지 않습니다. 스키마·결제 상태를 확인해 주세요.";
  }
  if (t.length > 0 && t.length < 400) {
    return t;
  }
  return "처리 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.";
}

export async function approveAdminRefundAction(formData: FormData) {
  const { user } = await requireRole("admin");
  const refundId = textFromForm(formData.get("refundId"));
  const adminNote = textFromForm(formData.get("adminNote")) || null;

  if (!refundId) {
    redirect(qError("환불을 선택할 수 없습니다."));
  }

  let admin: ReturnType<typeof createServiceRoleClient>;
  try {
    admin = createServiceRoleClient();
  } catch {
    redirect(qError("서버 설정 오류로 처리할 수 없습니다. 관리자에게 문의해 주세요."));
  }

  const { data, error } = await admin.rpc("approve_refund_request_admin", {
    p_refund_id: refundId,
    p_admin_id: user.id,
    p_admin_note: adminNote,
  });

  if (error) {
    redirect(qError(mapRpcExceptionMessage(error.message)));
  }

  if (data == null) {
    redirect(qError("서버 응답이 없습니다."));
  }
  const payload = asRpcPayload(data);
  if (payload.ok !== true) {
    redirect(qError(payload.message ?? "환불 승인에 실패했습니다."));
  }

  const msg =
    payload.noop === true ? (payload.message ?? "이미 처리되었거나 대기 상태가 아닙니다.") : "환불 승인이 완료되었습니다.";
  revalidatePath(PATH);
  redirect(qOk(msg));
}

export async function rejectAdminRefundAction(formData: FormData) {
  const { user } = await requireRole("admin");
  const refundId = textFromForm(formData.get("refundId"));
  const adminNote = textFromForm(formData.get("adminNote")) || null;

  if (!refundId) {
    redirect(qError("환불을 선택할 수 없습니다."));
  }

  let admin: ReturnType<typeof createServiceRoleClient>;
  try {
    admin = createServiceRoleClient();
  } catch {
    redirect(qError("서버 설정 오류로 처리할 수 없습니다. 관리자에게 문의해 주세요."));
  }

  const { data, error } = await admin.rpc("reject_refund_request_admin", {
    p_refund_id: refundId,
    p_admin_id: user.id,
    p_admin_note: adminNote,
  });

  if (error) {
    redirect(qError(mapRpcExceptionMessage(error.message)));
  }

  if (data == null) {
    redirect(qError("서버 응답이 없습니다."));
  }
  const payload = asRpcPayload(data);
  if (payload.ok !== true) {
    redirect(qError(payload.message ?? "환불 거절에 실패했습니다."));
  }

  const msg =
    payload.noop === true ? (payload.message ?? "이미 처리되었거나 대기 상태가 아닙니다.") : "환불 거절이 완료되었습니다.";
  revalidatePath(PATH);
  redirect(qOk(msg));
}
