import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import {
  getActiveDisputeBlockMessage,
  getDisputeRowsForOrderId,
  hasActiveDisputeForOrderRows,
} from "@/lib/customRequest/orderDisputeHelpers";
import { isCustomOrderPaymentConfirmed, mustBlockUnpaidAcceptForProduction } from "@/lib/customRequest/orderPaymentPolicy";
import {
  CUSTOM_ORDER_PLATFORM_FEE_RATE,
  loadApplicationRowForOrder,
  pickGrossAmountWonWithSource,
  splitPlatformAndMentorForGross,
  type GrossAmountSource,
} from "@/lib/customRequest/orderSettlementAmounts";
import { recordOrderEventBestEffort, type OrderRoomEventKind } from "@/lib/customRequest/orderRoomMutations";
import { createServiceRoleClient } from "@/lib/supabase/admin";

type Row = Record<string, unknown>;

const SETTLEMENT_TABLE = "custom_order_settlement_items" as const;

/** 동시 수락·unique index로 인한 insert 충돌(Postgres 23505 등). */
function isPostgresUniqueViolation(err: { code?: string; message?: string; details?: string; hint?: string } | null): boolean {
  if (!err) return false;
  if (err.code === "23505") return true;
  const blob = [err.message, err.details, err.hint].filter(Boolean).join(" ").toLowerCase();
  return /duplicate key|unique constraint|already exists/i.test(blob);
}

function pickOrderStudentId(r: Row): string | null {
  for (const k of ["student_id", "buyer_id", "user_id", "client_id", "author_id", "requester_id"] as const) {
    const v = r[k];
    if (typeof v === "string" && v.trim()) return v;
  }
  return null;
}

function pickOrderMentorId(r: Row): string | null {
  for (const k of ["mentor_id", "selected_mentor_id", "assigned_mentor_id", "expert_id", "mentor_user_id"] as const) {
    const v = r[k];
    if (typeof v === "string" && v.trim()) return v;
  }
  return null;
}

function pickPaymentStatusRaw(orderRow: Row): string | null {
  for (const k of ["payment_status", "payment_state"] as const) {
    const v = orderRow[k];
    if (v != null && String(v).trim()) {
      return String(v).trim();
    }
  }
  return null;
}

/**
 * 주문방·정산 배너용: 정산 예정 1행(없으면 null, 테이블 없으면 null).
 */
export async function loadCustomOrderSettlementItemByOrderId(
  supabase: SupabaseClient,
  orderId: string
): Promise<{ row: Row | null; error: string | null }> {
  const { data, error } = await supabase
    .from(SETTLEMENT_TABLE)
    .select("*")
    .eq("custom_request_order_id", orderId)
    .maybeSingle();
  if (error) {
    if (/relation|does not exist|schema cache/i.test(error.message)) {
      return { row: null, error: null };
    }
    return { row: null, error: error.message };
  }
  return { row: (data as Row) ?? null, error: null };
}

export type InsertSettlementSuccess =
  | { ok: true; created: false; reason: "no_amount" | "already_exists" }
  | {
      ok: true;
      created: true;
      gross: number;
      settlementId: string;
      amountSource: GrossAmountSource;
      feeRate: number;
      paymentStatus: string | null;
      paymentConfirmed: boolean;
    };

export type InsertSettlementResult = InsertSettlementSuccess | { ok: false; error: string };

/**
 * 납품 수락으로 주문을 completed로 바꾸기 **전**에 호출.
 * - 진행 중 분쟁이 있으면 실패(수락·정산 모두 중단).
 * - 비결제(플래그 꺼짐)는 `mustBlockUnpaidAcceptForProduction`로 중단.
 * - 금액이 없으면 행을 만들지 않음(created: false) — 수락은 상위에서 계속.
 * - 금액이 있으면 정산 예정 행 insert 필수 — 실패 시 수락 중단.
 * insert는 service role (RLS 우회) 전용.
 */
export async function insertCustomOrderSettlementIfRequiredBeforeComplete(
  supabase: SupabaseClient,
  orderId: string,
  orderRow: Row
): Promise<InsertSettlementResult> {
  if (mustBlockUnpaidAcceptForProduction(orderRow)) {
    return {
      ok: false,
      error:
        "결제가 확인되지 않은 주문은 정산 예정을 만들 수 없습니다. 개발·스테이징에서는 CUSTOM_ORDER_ALLOW_UNPAID_ACCEPT=true 로 테스트할 수 있습니다.",
    };
  }

  const block = await getActiveDisputeBlockMessage(supabase, orderId);
  if (block) {
    return { ok: false, error: "진행 중인 분쟁이 있어 납품 수락·정산 예정을 진행할 수 없습니다." };
  }

  const { data: existing, error: exErr } = await supabase
    .from(SETTLEMENT_TABLE)
    .select("id")
    .eq("custom_request_order_id", orderId)
    .maybeSingle();
  if (exErr && !/relation|does not exist|schema cache/i.test(exErr.message)) {
    return { ok: false, error: exErr.message };
  }
  if (existing) {
    return { ok: true, created: false, reason: "already_exists" };
  }

  const app = await loadApplicationRowForOrder(supabase, orderRow);
  const picked = pickGrossAmountWonWithSource(orderRow, app, { orderId });
  if (picked == null || picked.gross <= 0) {
    console.warn("[insertCustomOrderSettlementIfRequiredBeforeComplete] no gross amount, settlement row skipped", {
      orderId,
    });
    return { ok: true, created: false, reason: "no_amount" };
  }
  const { gross, source: amountSource } = picked;

  const studentId = pickOrderStudentId(orderRow);
  const mentorId = pickOrderMentorId(orderRow);
  if (!studentId || !mentorId) {
    return { ok: false, error: "주문에 학생·멘토 정보가 없어 정산 예정을 저장할 수 없습니다." };
  }

  const { platformFee, mentorAmount } = splitPlatformAndMentorForGross(gross, CUSTOM_ORDER_PLATFORM_FEE_RATE);
  const paymentStatus = pickPaymentStatusRaw(orderRow);
  const paymentConfirmed = isCustomOrderPaymentConfirmed(orderRow);

  const reDispute = await getDisputeRowsForOrderId(supabase, orderId);
  if (reDispute.error) {
    console.warn("[insertCustomOrderSettlementIfRequiredBeforeComplete] dispute re-check read failed", orderId, reDispute.error);
  } else if (hasActiveDisputeForOrderRows(reDispute.rows)) {
    return { ok: false, error: "진행 중인 분쟁이 있어 정산 예정을 저장할 수 없습니다. 잠시 후 다시 시도해 주세요." };
  }

  const admin = createServiceRoleClient();
  const { data: inserted, error: insErr } = await admin
    .from(SETTLEMENT_TABLE)
    .insert({
      custom_request_order_id: orderId,
      mentor_id: mentorId,
      student_id: studentId,
      gross_amount: gross,
      platform_fee_amount: platformFee,
      mentor_amount: mentorAmount,
      fee_rate: CUSTOM_ORDER_PLATFORM_FEE_RATE,
      status: "pending",
    })
    .select("id")
    .maybeSingle();

  if (insErr) {
    if (/relation|does not exist|schema cache/i.test(insErr.message)) {
      return { ok: false, error: "정산 예정을 저장할 수 없습니다. 스키마를 적용했는지 확인하세요." };
    }
    if (isPostgresUniqueViolation(insErr)) {
      console.warn(
        "[insertCustomOrderSettlementIfRequiredBeforeComplete] settlement unique violation (concurrent insert?), orderId:",
        orderId
      );
      const verified = await loadCustomOrderSettlementItemByOrderId(supabase, orderId);
      if (verified.error) {
        console.warn(
          "[insertCustomOrderSettlementIfRequiredBeforeComplete] post-unique verify read failed (still treating as already_exists)",
          orderId
        );
      }
      void verified.row;
      return { ok: true, created: false, reason: "already_exists" };
    }
    return { ok: false, error: insErr.message };
  }
  const settlementId = inserted && typeof (inserted as Row).id === "string" ? String((inserted as Row).id) : "";
  if (!settlementId) {
    return { ok: false, error: "정산 예정 저장 응답에 id가 없습니다." };
  }

  return {
    ok: true,
    created: true,
    gross,
    settlementId,
    amountSource,
    feeRate: CUSTOM_ORDER_PLATFORM_FEE_RATE,
    paymentStatus,
    paymentConfirmed,
  };
}

export async function recordCustomOrderSettlementCreatedEvent(
  supabase: SupabaseClient,
  orderId: string,
  studentId: string,
  payload: {
    settlementId: string;
    gross: number;
    platform: number;
    mentor: number;
    feeRate: number;
    amountSource: GrossAmountSource;
    paymentStatus: string | null;
    isPaymentConfirmed: boolean;
  }
): Promise<void> {
  const kind = "settlement_item_created" as OrderRoomEventKind;
  await recordOrderEventBestEffort(supabase, orderId, kind, studentId, {
    settlement_id: payload.settlementId,
    gross_amount: payload.gross,
    platform_fee_amount: payload.platform,
    mentor_amount: payload.mentor,
    fee_rate: payload.feeRate,
    amount_source: payload.amountSource,
    payment_status: payload.paymentStatus,
    payment_confirmed: payload.isPaymentConfirmed,
    is_payment_confirmed: payload.isPaymentConfirmed,
  });
}

/**
 * 주문 완료 갱신 실패 시, 방금 만든 정산 행을 best-effort 제거(고아 방지). service role.
 */
export async function deleteCustomOrderSettlementItemBestEffort(_supabase: SupabaseClient, orderId: string): Promise<void> {
  try {
    const admin = createServiceRoleClient();
    const { error } = await admin.from(SETTLEMENT_TABLE).delete().eq("custom_request_order_id", orderId);
    if (error) {
      console.error("[deleteCustomOrderSettlementItemBestEffort]", orderId, error.message);
    }
  } catch (e) {
    console.error("[deleteCustomOrderSettlementItemBestEffort]", orderId, e);
  }
}
