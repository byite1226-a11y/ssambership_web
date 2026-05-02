"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/routeGuard";
import { createServiceRoleClient } from "@/lib/supabase/admin";

const PATH = "/admin/refunds";

/** 매핑되지 않은 RPC/Postgres/PostgREST 오류 시 URL·UI에 노출할 고정 문구 */
const REFUND_FLOW_GENERIC = "환불 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.";

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

/** RPC `approve_refund_request_admin` / `reject_refund_request_admin`이 반환하는 `message` (한국어 고정 문구만). */
const REFUND_RPC_PAYLOAD_MESSAGES_OK_FALSE = new Set([
  "환불 ID가 필요합니다.",
  "관리자 ID가 필요합니다.",
  "환불 요청을 찾을 수 없습니다.",
  "이미 정산 지급이 완료된 건은 자동 환불할 수 없습니다. 수동 조정이 필요합니다.",
  "환불 금액이 허용 한도를 초과합니다.",
]);

/**
 * PostgREST `error.message` 및 RPC JSON `payload.message`를 사용자/URL용으로만 변환.
 * 원문은 URL에 넣지 않으며, 매핑되지 않은 값은 REFUND_FLOW_GENERIC으로 떨어진다.
 */
function mapRefundUserFacingError(raw: string | undefined | null, whenTrimmedEmpty?: string): string {
  const t = String(raw ?? "").trim();
  if (!t) {
    return whenTrimmedEmpty ?? REFUND_FLOW_GENERIC;
  }

  if (/ADMIN_REQUIRED/i.test(t)) {
    return "관리자 권한이 확인되지 않았습니다.";
  }
  if (/환불 금액이 설정되지 않아 자동 승인할 수 없습니다/.test(t)) {
    return "환불 금액이 설정되지 않아 자동 승인할 수 없습니다.";
  }
  if (/이미 정산 지급이 완료된 건/.test(t)) {
    return "이미 정산 지급이 완료된 건은 자동 환불할 수 없습니다. 수동 조정이 필요합니다.";
  }
  if (/CASH_WALLET_UPDATE_FAILED|REFUND_LEDGER|LEDGER_AMOUNT_MISMATCH|LEDGER_IDEMPOTENT|REFUND_LEDGER_IDEMPOTENT_MISS|REFUND_LEDGER_AMOUNT_MISMATCH/i.test(t)) {
    return "캐시 원장·지갑 처리 중 오류가 발생했습니다. 잠시 후 다시 시도하거나 관리자에게 문의해 주세요.";
  }
  if (/violates.*check|check constraint|duplicate key|unique constraint|23505/i.test(t)) {
    return "데이터베이스 제약 조건과 맞지 않습니다. 스키마·결제 상태를 확인해 주세요.";
  }
  if (/relation|does not exist|schema cache|syntax error|42804|42703|42P01|42883|42501|permission denied|row-level security|not authorized|policy/i.test(t)) {
    return "데이터베이스 제약 조건과 맞지 않습니다. 스키마·결제 상태를 확인해 주세요.";
  }
  if (/REFUND_NOT_FOUND|환불 요청을 찾을 수 없습니다/i.test(t)) {
    return "환불 요청을 찾을 수 없습니다.";
  }
  if (/REFUND_NOT_PENDING|이미 처리되었거나 대기 상태가 아닙니다/i.test(t)) {
    return "이미 처리되었거나 대기 상태가 아닙니다.";
  }
  if (/WALLET_NOT_FOUND/i.test(t)) {
    return "캐시 지갑을 찾을 수 없습니다. 멤버십·결제 설정을 확인해 주세요.";
  }
  if (/INSUFFICIENT|CASH_INSUFFICIENT|잔액이 부족|잔액 부족/i.test(t)) {
    return "캐시 잔액이 부족해 환불을 완료할 수 없습니다. 원장·지갑 상태를 확인해 주세요.";
  }

  if (REFUND_RPC_PAYLOAD_MESSAGES_OK_FALSE.has(t)) {
    return t;
  }

  console.error("[refundActions] unmapped refund RPC/postgrest error (sanitized for user)", t);
  return REFUND_FLOW_GENERIC;
}

/** PostgREST RPC 호출 단계의 `error.message` 전용 (빈 문자열은 일반적이지 않음). */
function mapRpcExceptionMessage(raw: string): string {
  return mapRefundUserFacingError(raw);
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
    console.error("[refundActions] approveAdminRefundAction RPC error", error.message);
    redirect(qError(mapRpcExceptionMessage(error.message)));
  }

  if (data == null) {
    redirect(qError("서버 응답이 없습니다."));
  }
  const payload = asRpcPayload(data);
  if (payload.ok !== true) {
    const pm = typeof payload.message === "string" ? payload.message : "";
    console.error("[refundActions] approveAdminRefundAction RPC ok:false", { refundId, message: pm || null });
    redirect(qError(mapRefundUserFacingError(pm, "환불 승인에 실패했습니다.")));
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
    console.error("[refundActions] rejectAdminRefundAction RPC error", error.message);
    redirect(qError(mapRpcExceptionMessage(error.message)));
  }

  if (data == null) {
    redirect(qError("서버 응답이 없습니다."));
  }
  const payload = asRpcPayload(data);
  if (payload.ok !== true) {
    const pm = typeof payload.message === "string" ? payload.message : "";
    console.error("[refundActions] rejectAdminRefundAction RPC ok:false", { refundId, message: pm || null });
    redirect(qError(mapRefundUserFacingError(pm, "환불 거절에 실패했습니다.")));
  }

  const msg =
    payload.noop === true ? (payload.message ?? "이미 처리되었거나 대기 상태가 아닙니다.") : "환불 거절이 완료되었습니다.";
  revalidatePath(PATH);
  redirect(qOk(msg));
}
