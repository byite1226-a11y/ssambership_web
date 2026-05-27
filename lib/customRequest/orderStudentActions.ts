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
  isCustomOrderPaymentStatusStrictlyPaid,
  mustBlockUnpaidAcceptForProduction,
} from "@/lib/customRequest/orderPaymentPolicy";
import { firstReadableCustomTable, ORDER_TO_DELIVERABLE_FK_CANDIDATES } from "@/lib/customRequest/customRequestQueries";
import { recordOrderEventBestEffort } from "@/lib/customRequest/orderRoomMutations";
import { splitPlatformAndMentorForGross } from "@/lib/customRequest/orderSettlementAmounts";
import { MENTOR_CUSTOM_REQUEST_PLATFORM_SHARE } from "@/lib/mentor/mentorPayoutsConstants";
import {
  acceptCustomOrderDeliverableAtomic,
  recordCustomOrderSettlementCreatedEvent,
} from "@/lib/customRequest/orderSettlementService";
import { pickExistingColumn } from "@/lib/qna/safeSelect";
import { createClient } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";

type Row = Record<string, unknown>;

function orderPath(orderId: string) {
  return `/custom-request/orders/${encodeURIComponent(orderId)}`;
}

function redirectWithError(orderId: string, msg: string): never {
  redirect(`${orderPath(orderId)}?error=${encodeURIComponent(msg)}`);
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
 * 주문 완료·정산 row 생성은 `accept_custom_order_deliverable_atomic` RPC 단일 트랜잭션으로 처리.
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

  const { data: rowData, error: oe } = await supabase.from(oT.table).select("*").eq("id", orderId).maybeSingle();
  if (oe || !rowData) {
    redirectWithError(orderId, "주문을 찾을 수 없어요. 잠시 후 다시 시도해 주세요.");
  }
  const row = rowData as Row;

  const access = canAccessOrder(row, user.id, "student");
  if (!access.ok) {
    redirectWithError(orderId, "이 주문을 수락할 권한이 없습니다.");
  }

  const { column: stuCol } = await pickExistingColumn(supabase, oT.table, [
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

  const atomic = await acceptCustomOrderDeliverableAtomic(
    orderId,
    user.id,
    mustBlockUnpaidAcceptForProduction(row)
  );
  if (!atomic.ok) {
    redirectWithError(orderId, atomic.error);
  }

  await recordOrderEventBestEffort(supabase, orderId, "deliverable_accepted", user.id, {
    settlement_row_created: atomic.settlementCreated,
    via: "accept_custom_order_deliverable_atomic",
  });

  if (atomic.settlementCreated && atomic.settlementId && atomic.gross != null) {
    const feeRate = atomic.feeRate ?? MENTOR_CUSTOM_REQUEST_PLATFORM_SHARE;
    const { platformFee, mentorAmount } = splitPlatformAndMentorForGross(atomic.gross, feeRate);
    await recordCustomOrderSettlementCreatedEvent(supabase, orderId, user.id, {
      settlementId: atomic.settlementId,
      gross: atomic.gross,
      platform: platformFee,
      mentor: mentorAmount,
      feeRate,
      amountSource: "order.agreed_price",
      paymentStatus: (() => {
        for (const k of ["payment_status", "payment_state", "pay_status"] as const) {
          const v = row[k];
          if (v != null && String(v).trim()) return String(v).trim();
        }
        return null;
      })(),
      isPaymentConfirmed: !mustBlockUnpaidAcceptForProduction(row),
    });
  }

  revalidatePath(orderPath(orderId));
  revalidatePath("/custom-request");
  redirect(`${orderPath(orderId)}?ok=${encodeURIComponent("납품을 수락해 주문을 완료했습니다.")}`);
}
