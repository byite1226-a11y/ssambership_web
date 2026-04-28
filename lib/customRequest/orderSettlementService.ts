import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { getActiveDisputeBlockMessage } from "@/lib/customRequest/orderDisputeHelpers";
import {
  CUSTOM_ORDER_PLATFORM_FEE_RATE,
  loadApplicationRowForOrder,
  pickGrossAmountWonFromOrderAndApplication,
  splitPlatformAndMentorForGross,
} from "@/lib/customRequest/orderSettlementAmounts";
import { recordOrderEventBestEffort, type OrderRoomEventKind } from "@/lib/customRequest/orderRoomMutations";

type Row = Record<string, unknown>;

const SETTLEMENT_TABLE = "custom_order_settlement_items" as const;

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

/**
 * 납품 수락으로 주문을 completed로 바꾸기 **전**에 호출.
 * - 진행 중 분쟁이 있으면 실패(수락·정산 모두 중단).
 * - 금액이 없으면 행을 만들지 않음(created: false) — 수락은 상위에서 계속.
 * - 금액이 있으면 정산 예정 행 insert 필수 — 실패 시 수락 중단.
 * 정책: 금액이 있는데 DB insert 실패 시 completed로 가지 않음(운영 P0 대비).
 */
export async function insertCustomOrderSettlementIfRequiredBeforeComplete(
  supabase: SupabaseClient,
  orderId: string,
  orderRow: Row
): Promise<
  { ok: true; created: false; reason: "no_amount" | "already_exists" } | { ok: true; created: true; gross: number } | { ok: false; error: string }
> {
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
  const gross = pickGrossAmountWonFromOrderAndApplication(orderRow, app);
  if (gross == null || gross <= 0) {
    console.warn("[insertCustomOrderSettlementIfRequiredBeforeComplete] no gross amount, settlement row skipped", { orderId });
    return { ok: true, created: false, reason: "no_amount" };
  }

  const studentId = pickOrderStudentId(orderRow);
  const mentorId = pickOrderMentorId(orderRow);
  if (!studentId || !mentorId) {
    return { ok: false, error: "주문에 학생·멘토 정보가 없어 정산 예정을 저장할 수 없습니다." };
  }

  const { platformFee, mentorAmount } = splitPlatformAndMentorForGross(gross, CUSTOM_ORDER_PLATFORM_FEE_RATE);

  const { error: insErr } = await supabase.from(SETTLEMENT_TABLE).insert({
    custom_request_order_id: orderId,
    mentor_id: mentorId,
    student_id: studentId,
    gross_amount: gross,
    platform_fee_amount: platformFee,
    mentor_amount: mentorAmount,
    fee_rate: CUSTOM_ORDER_PLATFORM_FEE_RATE,
    status: "pending",
  });

  if (insErr) {
    if (/relation|does not exist|schema cache/i.test(insErr.message)) {
      return { ok: false, error: "정산 예정을 저장할 수 없습니다. 스키마를 적용했는지 확인하세요." };
    }
    return { ok: false, error: insErr.message };
  }

  return { ok: true, created: true, gross };
}

export async function recordCustomOrderSettlementCreatedEvent(
  supabase: SupabaseClient,
  orderId: string,
  studentId: string,
  amounts: { gross: number; platform: number; mentor: number }
): Promise<void> {
  const kind = "settlement_item_created" as OrderRoomEventKind;
  await recordOrderEventBestEffort(supabase, orderId, kind, studentId, {
    gross_amount: amounts.gross,
    platform_fee_amount: amounts.platform,
    mentor_amount: amounts.mentor,
  });
}

/**
 * 주문 완료 갱신 실패 시, 방금 만든 정산 행을 best-effort 제거(고아 방지).
 */
export async function deleteCustomOrderSettlementItemBestEffort(
  supabase: SupabaseClient,
  orderId: string
): Promise<void> {
  const { error } = await supabase.from(SETTLEMENT_TABLE).delete().eq("custom_request_order_id", orderId);
  if (error) {
    console.error("[deleteCustomOrderSettlementItemBestEffort]", orderId, error.message);
  }
}
