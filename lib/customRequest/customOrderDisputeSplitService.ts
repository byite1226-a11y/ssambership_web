import "server-only";

import { createServiceRoleClient } from "@/lib/supabase/admin";

export type CustomOrderDisputeSplitErrorCode =
  | "DISPUTE_SPLIT_RPC"
  | "ADMIN_REQUIRED"
  | "DISPUTE_SPLIT_MISMATCH"
  | "ALREADY_PAID_OUT"
  | "ALREADY_REFUNDED"
  | "NOT_ESCROWED"
  | "HOLD_MISSING"
  | "ORDER_NOT_FOUND"
  | "INVALID_AMOUNTS";

export type RecordCustomOrderDisputeSplitResult =
  | { ok: true; data: Record<string, unknown> | null }
  | { ok: false; error: string; code: CustomOrderDisputeSplitErrorCode };

const MSG_SPLIT_FAIL = "분쟁 예치 분배에 실패했습니다. 잠시 후 다시 시도해 주세요.";
const MSG_MISMATCH =
  "멘토 배정 gross(원)와 학생 환불(원)의 합이 예치 금액과 일치하지 않습니다.";
const MSG_ALREADY_PAID_OUT =
  "이미 멘토 지급이 완료된 주문은 분배할 수 없습니다.";
const MSG_ALREADY_REFUNDED =
  "이미 전액 환불된 주문은 분배할 수 없습니다.";
const MSG_NOT_ESCROWED = "예치(에스크로) 상태가 아니어서 분배할 수 없습니다.";
const MSG_HOLD_MISSING = "예치 내역이 없어 분배할 수 없습니다.";
const MSG_ADMIN = "관리자 권한이 확인되지 않았습니다.";
const MSG_ORDER_NOT_FOUND = "주문을 찾을 수 없습니다.";
const MSG_INVALID_AMOUNTS = "분배 금액(원)이 올바르지 않습니다.";

function mapDisputeSplitRpcError(message: string): { error: string; code: CustomOrderDisputeSplitErrorCode } {
  const m = message.trim();
  if (/ADMIN_REQUIRED/i.test(m)) {
    return { error: MSG_ADMIN, code: "ADMIN_REQUIRED" };
  }
  if (/DISPUTE_SPLIT_MISMATCH/i.test(m)) {
    return { error: MSG_MISMATCH, code: "DISPUTE_SPLIT_MISMATCH" };
  }
  if (/ALREADY_PAID_OUT/i.test(m)) {
    return { error: MSG_ALREADY_PAID_OUT, code: "ALREADY_PAID_OUT" };
  }
  if (/ALREADY_REFUNDED/i.test(m)) {
    return { error: MSG_ALREADY_REFUNDED, code: "ALREADY_REFUNDED" };
  }
  if (/PAYMENT_NOT_ESCROWED/i.test(m)) {
    return { error: MSG_NOT_ESCROWED, code: "NOT_ESCROWED" };
  }
  if (/ESCROW_HOLD_MISSING/i.test(m)) {
    return { error: MSG_HOLD_MISSING, code: "HOLD_MISSING" };
  }
  if (/ORDER_NOT_FOUND/i.test(m)) {
    return { error: MSG_ORDER_NOT_FOUND, code: "ORDER_NOT_FOUND" };
  }
  if (/DISPUTE_SPLIT_AMOUNTS/i.test(m)) {
    return { error: MSG_INVALID_AMOUNTS, code: "INVALID_AMOUNTS" };
  }
  return { error: MSG_SPLIT_FAIL, code: "DISPUTE_SPLIT_RPC" };
}

export type DisputeSplitWonInput = {
  orderId: string;
  mentorGrossWon: number;
  studentRefundWon: number;
  adminId: string;
};

/** 관리자 분배 RPC 입력(원, 정수) 사전 검증 — UI 없이 서버 액션에서도 사용 */
export function validateDisputeSplitWonInput(input: DisputeSplitWonInput): string | null {
  if (!input.orderId.trim()) {
    return "주문 ID가 필요합니다.";
  }
  if (!input.adminId.trim()) {
    return MSG_ADMIN;
  }
  const mg = input.mentorGrossWon;
  const sr = input.studentRefundWon;
  if (!Number.isInteger(mg) || !Number.isInteger(sr) || mg < 0 || sr < 0) {
    return MSG_INVALID_AMOUNTS;
  }
  return null;
}

/**
 * 맞춤의뢰 분쟁 예치 분배 — `record_custom_order_dispute_split` RPC (service_role).
 */
export async function recordCustomOrderDisputeSplitRpc(
  input: DisputeSplitWonInput
): Promise<RecordCustomOrderDisputeSplitResult> {
  const pre = validateDisputeSplitWonInput(input);
  if (pre) {
    return {
      ok: false,
      error: pre,
      code: pre === MSG_ADMIN ? "ADMIN_REQUIRED" : "INVALID_AMOUNTS",
    };
  }

  try {
    const admin = createServiceRoleClient();
    const { data, error } = await admin.rpc("record_custom_order_dispute_split", {
      p_order_id: input.orderId.trim(),
      p_mentor_gross_won: input.mentorGrossWon,
      p_student_refund_won: input.studentRefundWon,
      p_admin_id: input.adminId.trim(),
    });
    if (error) {
      const mapped = mapDisputeSplitRpcError(String(error.message ?? error));
      console.error("[recordCustomOrderDisputeSplitRpc] RPC error", {
        orderId: input.orderId,
        message: String(error.message ?? error),
        code: mapped.code,
      });
      return { ok: false, ...mapped };
    }
    const payload =
      data && typeof data === "object" && !Array.isArray(data) ? (data as Record<string, unknown>) : null;
    return { ok: true, data: payload };
  } catch (e) {
    const m = e instanceof Error ? e.message : String(e);
    const mapped = mapDisputeSplitRpcError(m);
    console.error("[recordCustomOrderDisputeSplitRpc] exception", {
      orderId: input.orderId,
      message: m,
      code: mapped.code,
    });
    return { ok: false, ...mapped };
  }
}
