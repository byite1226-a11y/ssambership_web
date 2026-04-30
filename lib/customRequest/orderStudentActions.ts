"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/routeGuard";
import { canAccessOrder } from "@/lib/customRequest/orderAccess";
import {
  isOrderStatusAllowingStudentAccept,
  isOrderRowTerminalForActions,
  normalizedPrimaryOrderStatus,
  primaryOrderStatusColumnKey,
} from "@/lib/customRequest/orderLifecycleConstants";
import { getActiveDisputeBlockMessage } from "@/lib/customRequest/orderDisputeHelpers";
import {
  isCustomOrderPaymentConfirmed,
  isCustomOrderPaymentStatusStrictlyPaid,
  mustBlockUnpaidAcceptForProduction,
} from "@/lib/customRequest/orderPaymentPolicy";
import { firstReadableCustomTable, ORDER_TO_DELIVERABLE_FK_CANDIDATES } from "@/lib/customRequest/customRequestQueries";
import { recordOrderEventBestEffort } from "@/lib/customRequest/orderRoomMutations";
import { splitPlatformAndMentorForGross } from "@/lib/customRequest/orderSettlementAmounts";
import {
  deleteCustomOrderSettlementItemBestEffort,
  insertCustomOrderSettlementIfRequiredBeforeComplete,
  recordCustomOrderSettlementCreatedEvent,
} from "@/lib/customRequest/orderSettlementService";
import { pickExistingColumn } from "@/lib/qna/safeSelect";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";

type Row = Record<string, unknown>;

function orderPath(orderId: string) {
  return `/custom-request/orders/${encodeURIComponent(orderId)}`;
}

function redirectWithError(orderId: string, msg: string): never {
  redirect(`${orderPath(orderId)}?error=${encodeURIComponent(msg)}`);
}

/**
 * 수락 직후 주문 row — `primary` 1열만 갱신·타임스탬프 1곳만 채우면
 * status=completed / state=pending / order_status=open / accepted_at=null 같은 불일치가 남는다.
 * `status`·`state`·`order_status`·`accepted_at`·`completed_at`·`updated_at` 는 각각 스키마에 있을 때만 설정.
 */
async function buildOrderCompletionAfterAcceptPatch(
  supabase: SupabaseClient,
  table: string
): Promise<Record<string, unknown> | { error: "no_status_col" }> {
  const now = new Date().toISOString();
  const patch: Record<string, unknown> = {};
  const done = "completed" as const;

  let hasAnyStatusCol = false;
  for (const colName of ["status", "state", "order_status"] as const) {
    const { column: c } = await pickExistingColumn(supabase, table, [colName]);
    if (c) {
      hasAnyStatusCol = true;
      patch[c] = done;
    }
  }
  if (!hasAnyStatusCol) {
    return { error: "no_status_col" };
  }

  for (const colName of ["accepted_at", "completed_at"] as const) {
    const { column: c } = await pickExistingColumn(supabase, table, [colName]);
    if (c) {
      patch[c] = now;
    }
  }

  const { column: uCol } = await pickExistingColumn(supabase, table, ["updated_at"]);
  if (uCol) {
    patch[uCol] = now;
  }
  return patch;
}

export async function hasDeliverableRowsForOrder(supabase: SupabaseClient, orderId: string): Promise<boolean> {
  const dT = await firstReadableCustomTable(supabase, [
    "custom_order_deliverables",
    "order_deliverables",
    "request_deliverables",
  ]);
  if (!dT.table) {
    return false;
  }
  const { column: fk } = await pickExistingColumn(supabase, dT.table, [...ORDER_TO_DELIVERABLE_FK_CANDIDATES]);
  if (!fk) {
    return false;
  }
  const { count, error } = await supabase
    .from(dT.table)
    .select("id", { count: "exact", head: true })
    .eq(fk, orderId);
  return !error && (count ?? 0) > 0;
}

/**
 * 학생: 납품 검토 단계 주문을 완료(`completed`)로 전이. 본인 주문 + 허용 상태 + 납품 행 존재 필요.
 */
export async function acceptCustomOrderDeliverableAction(formData: FormData): Promise<void> {
  const { user } = await requireRole("student");
  const supabase = await createClient();
  const orderId = String(formData.get("orderId") ?? "").trim();
  if (!orderId) {
    redirect("/custom-request?error=" + encodeURIComponent("orderId가 필요합니다."));
  }

  const oT = await firstReadableCustomTable(supabase, ["custom_request_orders", "custom_orders", "request_orders"]);
  if (!oT.table) {
    redirectWithError(orderId, oT.error || "주문 테이블을 찾을 수 없습니다.");
  }
  const table = oT.table;

  const { data: rowData, error: oe } = await supabase.from(table).select("*").eq("id", orderId).maybeSingle();
  if (oe || !rowData) {
    redirectWithError(orderId, "주문을 찾을 수 없어요. 잠시 후 다시 시도해 주세요.");
  }
  const row = rowData as Row;

  const access = canAccessOrder(row, user.id, "student");
  if (!access.ok) {
    redirectWithError(orderId, "이 주문을 수락할 권한이 없습니다.");
  }

  const { column: stuCol } = await pickExistingColumn(supabase, table, [
    "student_id",
    "buyer_id",
    "user_id",
    "client_id",
    "author_id",
    "requester_id",
  ]);
  if (!stuCol || String(row[stuCol]) !== user.id) {
    redirectWithError(orderId, "의뢰자(학생) 본인만 납품을 수락할 수 있습니다.");
  }

  if (mustBlockUnpaidAcceptForProduction(row)) {
    redirectWithError(
      orderId,
      "결제가 완료되지 않은 주문은 수락할 수 없습니다. 결제 확인 후 다시 시도해 주세요."
    );
  }
  if (!isCustomOrderPaymentStatusStrictlyPaid(row)) {
    // `mustBlockUnpaidAcceptForProduction` 통과: 비결제는 CUSTOM_ORDER_ALLOW_UNPAID_ACCEPT === "true"일 때만 여기로 온다.
    const paymentStatus: string | null = (() => {
      for (const k of ["payment_status", "payment_state", "pay_status"] as const) {
        const v = row[k];
        if (v != null && String(v).trim()) {
          return String(v).trim();
        }
      }
      return null;
    })();
    console.warn(
      "[acceptCustomOrderDeliverableAction] Unpaid accept allowed by env (staging/test). Custom order will proceed without payment_status === \"paid\".",
      {
        orderId,
        payment_status: paymentStatus,
        CUSTOM_ORDER_ALLOW_UNPAID_ACCEPT: process.env.CUSTOM_ORDER_ALLOW_UNPAID_ACCEPT,
        NODE_ENV: process.env.NODE_ENV,
      }
    );
  }

  const disputeBlock = await getActiveDisputeBlockMessage(supabase, orderId);
  if (disputeBlock) {
    redirectWithError(orderId, disputeBlock);
  }

  const norm = normalizedPrimaryOrderStatus(row);
  if (!norm) {
    redirectWithError(orderId, "주문 상태를 확인할 수 없어 수락할 수 없습니다.");
  }
  if (isOrderRowTerminalForActions(row)) {
    redirectWithError(orderId, "이미 완료된 주문입니다.");
  }
  if (!isOrderStatusAllowingStudentAccept(norm)) {
    redirectWithError(orderId, `현재 상태(${norm})에서는 납품 수락을 할 수 없습니다.`);
  }

  const hasDel = await hasDeliverableRowsForOrder(supabase, orderId);
  if (!hasDel) {
    redirectWithError(orderId, "등록된 납품이 없어 수락할 수 없습니다.");
  }

  if (!primaryOrderStatusColumnKey(row)) {
    redirectWithError(orderId, "주문 상태 컬럼을 찾을 수 없습니다.");
  }

  const settlementStep = await insertCustomOrderSettlementIfRequiredBeforeComplete(supabase, orderId, row);
  if (settlementStep.ok === false) {
    redirectWithError(orderId, settlementStep.error);
  }

  const built = await buildOrderCompletionAfterAcceptPatch(supabase, table);
  if ("error" in built) {
    if (settlementStep.ok && settlementStep.created) {
      await deleteCustomOrderSettlementItemBestEffort(supabase, orderId);
    }
    redirectWithError(orderId, "주문을 완료로 표시할 수 없는 구성입니다. 잠시 후 다시 시도해 주세요.");
  }
  const patch = built as Record<string, unknown>;

  const { error: ue } = await supabase.from(table).update(patch).eq("id", orderId).eq(stuCol, user.id);
  if (ue) {
    console.error("[acceptCustomOrderDeliverableAction] order update", orderId, ue.message);
    if (settlementStep.ok && settlementStep.created) {
      await deleteCustomOrderSettlementItemBestEffort(supabase, orderId);
    }
    redirectWithError(orderId, "납품 수락 후 주문을 반영하는 중 오류가 났어요. 잠시 후 다시 시도해 주세요.");
  }

  await recordOrderEventBestEffort(supabase, orderId, "deliverable_accepted", user.id, {
    settlement_row_created: settlementStep.ok && settlementStep.created,
  });

  if (settlementStep.ok && settlementStep.created) {
    const { platformFee, mentorAmount } = splitPlatformAndMentorForGross(
      settlementStep.gross,
      settlementStep.feeRate
    );
    await recordCustomOrderSettlementCreatedEvent(supabase, orderId, user.id, {
      settlementId: settlementStep.settlementId,
      gross: settlementStep.gross,
      platform: platformFee,
      mentor: mentorAmount,
      feeRate: settlementStep.feeRate,
      amountSource: settlementStep.amountSource,
      paymentStatus: settlementStep.paymentStatus,
      isPaymentConfirmed: settlementStep.paymentConfirmed,
    });
  }

  revalidatePath(orderPath(orderId));
  revalidatePath("/custom-request");
  redirect(`${orderPath(orderId)}?ok=${encodeURIComponent("납품을 수락해 주문을 완료했습니다.")}`);
}

/**
 * 학생(의뢰자): 맞춤의뢰 주문 결제 확인(E2E·PG 미연동 시 수동 확인).
 * `payment_status` / `payment_state` / `pay_status` 중 스키마에 있는 첫 컬럼을 `paid`로 갱신한다.
 * 멘토 작업 시작 게이트(`isCustomOrderPaymentConfirmed` / `isOrderRowPaymentConfirmedForMentorWork`)와 값을 맞춘다.
 *
 * 1차: 로그인 세션 클라이언트로 update (RLS 허용 시).
 * 실패 시 permission/RLS로 보이면 service_role로 동일 WHERE(id + 학생 FK)만 재시도한다.
 */
export async function confirmStudentCustomOrderPaymentAction(formData: FormData): Promise<void> {
  const { user } = await requireRole("student");
  const supabase = await createClient();
  const orderId = String(formData.get("orderId") ?? "").trim();
  if (!orderId) {
    redirect("/custom-request?error=" + encodeURIComponent("orderId가 필요합니다."));
  }

  const oT = await firstReadableCustomTable(supabase, ["custom_request_orders", "request_orders"]);
  if (!oT.table) {
    redirectWithError(orderId, oT.error || "주문 테이블을 찾을 수 없습니다.");
  }
  const table = oT.table;

  const { data: rowData, error: oe } = await supabase.from(table).select("*").eq("id", orderId).maybeSingle();
  if (oe || !rowData) {
    redirectWithError(orderId, "주문을 찾을 수 없어요. 잠시 후 다시 시도해 주세요.");
  }
  const row = rowData as Row;

  const access = canAccessOrder(row, user.id, "student");
  if (!access.ok) {
    redirectWithError(orderId, "이 주문을 처리할 권한이 없습니다.");
  }

  const { column: stuCol } = await pickExistingColumn(supabase, table, [
    "student_id",
    "buyer_id",
    "user_id",
    "client_id",
    "author_id",
    "requester_id",
  ]);
  if (!stuCol || String(row[stuCol]) !== user.id) {
    redirectWithError(orderId, "의뢰자(학생) 본인만 결제 확인을 할 수 있습니다.");
  }

  if (isCustomOrderPaymentConfirmed(row)) {
    redirect(`${orderPath(orderId)}?ok=${encodeURIComponent("이미 결제가 확인된 주문입니다.")}`);
  }

  const norm = normalizedPrimaryOrderStatus(row);
  if (!norm) {
    redirectWithError(orderId, "주문 상태를 확인할 수 없어 결제 확인을 진행할 수 없습니다.");
  }
  if (isOrderRowTerminalForActions(row)) {
    redirectWithError(orderId, "완료된 주문에서는 결제 확인을 진행할 수 없습니다.");
  }

  const { column: payCol } = await pickExistingColumn(supabase, table, [
    "payment_status",
    "payment_state",
    "pay_status",
  ]);
  if (!payCol) {
    redirectWithError(orderId, "주문에 결제 상태 컬럼이 없어 확인 처리를 할 수 없습니다.");
  }

  const now = new Date().toISOString();
  const patch: Record<string, unknown> = { [payCol]: "paid" };
  const { column: paidAtCol } = await pickExistingColumn(supabase, table, [
    "paid_at",
    "payment_confirmed_at",
    "payment_completed_at",
  ]);
  if (paidAtCol) {
    patch[paidAtCol] = now;
  }
  const { column: uCol } = await pickExistingColumn(supabase, table, ["updated_at"]);
  if (uCol) {
    patch[uCol] = now;
  }

  const { error: ue } = await supabase.from(table).update(patch).eq("id", orderId).eq(stuCol, user.id);
  if (!ue) {
    await recordOrderEventBestEffort(supabase, orderId, "payment_confirmed", user.id, { via: "session" });
    revalidatePath(orderPath(orderId));
    revalidatePath("/custom-request");
    revalidatePath("/mentor/custom-request/orders");
    redirect(`${orderPath(orderId)}?ok=${encodeURIComponent("결제 확인이 반영되었습니다. 멘토가 작업을 시작할 수 있어요.")}`);
  }

  const msg = String(ue.message ?? "");
  const looksLikeRls = /permission|RLS|42501|policy|not authorized/i.test(msg);
  if (!looksLikeRls) {
    redirectWithError(orderId, msg || "결제 확인을 저장하지 못했습니다.");
  }

  try {
    const admin = createServiceRoleClient();
    const { error: ae } = await admin.from(table).update(patch).eq("id", orderId).eq(stuCol, user.id);
    if (ae) {
      console.error("[confirmStudentCustomOrderPaymentAction] service_role update", orderId, ae.message);
      redirectWithError(orderId, "결제 확인을 저장하지 못했습니다. 잠시 후 다시 시도하거나 운영자에 문의해 주세요.");
    }
    await recordOrderEventBestEffort(supabase, orderId, "payment_confirmed", user.id, { via: "service_role" });
  } catch (e) {
    const m = e instanceof Error ? e.message : String(e);
    console.error("[confirmStudentCustomOrderPaymentAction] service_role unavailable", m);
    redirectWithError(orderId, "결제 확인을 저장할 권한이 없습니다. 서버 설정(SUPABASE_SERVICE_ROLE_KEY)을 확인해 주세요.");
  }

  revalidatePath(orderPath(orderId));
  revalidatePath("/custom-request");
  revalidatePath("/mentor/custom-request/orders");
  redirect(`${orderPath(orderId)}?ok=${encodeURIComponent("결제 확인이 반영되었습니다. 멘토가 작업을 시작할 수 있어요.")}`);
}
