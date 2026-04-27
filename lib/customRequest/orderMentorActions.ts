"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/routeGuard";
import { canAccessOrder } from "@/lib/customRequest/orderAccess";
import { getActiveDisputeBlockMessage } from "@/lib/customRequest/orderDisputeHelpers";
import { isCustomRequestOrderStatusDdlInRepo, MENTOR_START_SCHEMA_GATE_MESSAGE } from "@/lib/customRequest/orderSchemaGate";
import {
  ORDER_INSERT_STATUS_PENDING,
  ORDER_MENTOR_WORK_STARTED_PRIMARY_STATUS,
  ORDER_STATUSES_MENTOR_START_WORK_ALLOWED,
  isOrderStatusTerminal,
  normalizedPrimaryOrderStatus,
  primaryOrderStatusColumnKey,
} from "@/lib/customRequest/orderLifecycleConstants";
import {
  firstReadableCustomTable,
  mergeOrderChildIdMirrorColumns,
  ORDER_TO_DELIVERABLE_FK_CANDIDATES,
} from "@/lib/customRequest/customRequestQueries";
import { recordOrderEventBestEffort } from "@/lib/customRequest/orderRoomMutations";
import { pickExistingColumn } from "@/lib/qna/safeSelect";
import { createClient } from "@/lib/supabase/server";

type Row = Record<string, unknown>;

function orderPath(orderId: string) {
  return `/custom-request/orders/${encodeURIComponent(orderId)}`;
}

function redirectWithError(orderId: string, msg: string): never {
  redirect(`${orderPath(orderId)}?error=${encodeURIComponent(msg)}`);
}

/**
 * ??: ?? primary ??? `pending`(insert ??)? ?? `open`?? ??.
 * `open`? `insertCustomRequestOrder`? `order_status`? ?? ?? ???.
 */
export async function startCustomOrderWorkAction(formData: FormData): Promise<void> {
  const { user } = await requireRole("mentor");
  const supabase = await createClient();
  const orderId = String(formData.get("orderId") ?? "").trim();
  if (!orderId) {
    redirect("/custom-request?error=" + encodeURIComponent("orderId? ?????."));
  }

  if (!isCustomRequestOrderStatusDdlInRepo()) {
    redirectWithError(orderId, MENTOR_START_SCHEMA_GATE_MESSAGE);
  }

  const oT = await firstReadableCustomTable(supabase, ["custom_request_orders", "custom_orders", "request_orders"]);
  if (!oT.table) {
    redirectWithError(orderId, oT.error || "?? ???? ?? ? ????.");
  }
  const table = oT.table;

  const { data: rowData, error: oe } = await supabase.from(table).select("*").eq("id", orderId).maybeSingle();
  if (oe || !rowData) {
    redirectWithError(orderId, oe?.message ?? "??? ?? ? ????.");
  }
  const row = rowData as Row;

  const access = canAccessOrder(row, user.id, "mentor");
  if (!access.ok) {
    redirectWithError(orderId, "? ???? ??? ??? ??? ????.");
  }

  const { column: menCol } = await pickExistingColumn(supabase, table, [
    "mentor_id",
    "mentor_user_id",
    "assignee_id",
    "assigned_mentor_id",
    "selected_mentor_id",
    "expert_id",
  ]);
  if (!menCol || String(row[menCol]) !== user.id) {
    redirectWithError(orderId, "??? ?? ??? ??? ??? ? ????.");
  }

  const disputeBlockStart = await getActiveDisputeBlockMessage(supabase, orderId);
  if (disputeBlockStart) {
    redirectWithError(orderId, disputeBlockStart);
  }

  const norm = normalizedPrimaryOrderStatus(row);
  if (!norm) {
    redirectWithError(orderId, "?? ??? ??? ? ?? ??? ??? ? ????.");
  }
  if (isOrderStatusTerminal(norm)) {
    redirectWithError(orderId, "?? ??? ?????.");
  }
  if (norm === ORDER_MENTOR_WORK_STARTED_PRIMARY_STATUS) {
    redirectWithError(orderId, "?? ??? ??? ?????.");
  }
  if (!ORDER_STATUSES_MENTOR_START_WORK_ALLOWED.has(norm)) {
    redirectWithError(orderId, `?? ??(${norm})??? ??? ??? ? ????.`);
  }

  const stCol = primaryOrderStatusColumnKey(row);
  if (!stCol) {
    redirectWithError(orderId, "?? ?? ??? ?? ? ????.");
  }

  const patch: Record<string, unknown> = { [stCol]: ORDER_MENTOR_WORK_STARTED_PRIMARY_STATUS };

  const { column: startedCol } = await pickExistingColumn(supabase, table, [
    "started_at",
    "work_started_at",
    "in_progress_at",
    "mentor_started_at",
  ]);
  if (startedCol) {
    patch[startedCol] = new Date().toISOString();
  }

  const { error: ue } = await supabase.from(table).update(patch).eq("id", orderId).eq(menCol, user.id);
  if (ue) {
    redirectWithError(orderId, ue.message || "?? ??? ??????.");
  }

  await recordOrderEventBestEffort(supabase, orderId, "order_started", user.id, { from: norm });

  revalidatePath(orderPath(orderId));
  revalidatePath("/custom-request");
  redirect(`${orderPath(orderId)}?ok=${encodeURIComponent("??? ??????.")}`);
}

function isMissingColumnPostgrest(msg: string): boolean {
  return /column|does not exist|schema cache/i.test(msg);
}

/**
 * ??: custom_order_deliverables insert + primary ?? open ? delivered (RLS: ?? ??).
 */
export async function submitMentorOrderDeliverableAction(formData: FormData): Promise<void> {
  const { user } = await requireRole("mentor");
  const supabase = await createClient();
  const orderId = String(formData.get("orderId") ?? "").trim();
  const body = String(formData.get("deliverableBody") ?? "").trim();
  if (!orderId) {
    redirect("/custom-request?error=" + encodeURIComponent("orderId? ?????."));
  }
  if (!body) {
    redirectWithError(orderId, "?? ??(???)? ?????.");
  }

  const oT = await firstReadableCustomTable(supabase, ["custom_request_orders", "custom_orders", "request_orders"]);
  if (!oT.table) {
    redirectWithError(orderId, oT.error || "?? ???? ?? ? ????.");
  }
  const table = oT.table;
  const { data: rowData, error: oe } = await supabase.from(table).select("*").eq("id", orderId).maybeSingle();
  if (oe || !rowData) {
    redirectWithError(orderId, oe?.message ?? "??? ?? ? ????.");
  }
  const row = rowData as Row;

  const access = canAccessOrder(row, user.id, "mentor");
  if (!access.ok) {
    redirectWithError(orderId, "? ??? ??? ??? ??? ????.");
  }
  const { column: menCol } = await pickExistingColumn(supabase, table, [
    "mentor_id",
    "mentor_user_id",
    "assignee_id",
    "assigned_mentor_id",
    "selected_mentor_id",
    "expert_id",
  ]);
  if (!menCol || String(row[menCol]) !== user.id) {
    redirectWithError(orderId, "??? ?? ??? ??? ??? ? ????.");
  }

  const disputeBlockDel = await getActiveDisputeBlockMessage(supabase, orderId);
  if (disputeBlockDel) {
    redirectWithError(orderId, disputeBlockDel);
  }

  const norm = normalizedPrimaryOrderStatus(row);
  if (!norm) {
    redirectWithError(orderId, "?? ??? ??? ? ?? ??? ??? ? ????.");
  }
  if (isOrderStatusTerminal(norm)) {
    redirectWithError(orderId, "?? ??? ?????.");
  }
  if (norm === ORDER_INSERT_STATUS_PENDING) {
    redirectWithError(orderId, "?? ?? ??? ??? ??? ? ????(??: pending).");
  }
  if (norm !== ORDER_MENTOR_WORK_STARTED_PRIMARY_STATUS && norm !== "delivered") {
    redirectWithError(orderId, `?? ??? ???? ?? ?????(${norm}).`);
  }

  const dT = await firstReadableCustomTable(supabase, ["custom_order_deliverables", "order_deliverables", "request_deliverables"]);
  if (!dT.table) {
    redirectWithError(orderId, dT.error || "?? ???? ?? ? ????.");
  }
  const { column: fk } = await pickExistingColumn(supabase, dT.table, [...ORDER_TO_DELIVERABLE_FK_CANDIDATES]);
  if (!fk) {
    redirectWithError(orderId, "?? ???? ?? FK ?? ?? ?????.");
  }

  const { data: vrows, error: ve } = await supabase.from(dT.table).select("version").eq(fk, orderId);
  if (ve) {
    redirectWithError(orderId, ve.message);
  }
  const list = (vrows as { version?: unknown }[] | null) ?? [];
  const nextVersion =
    list.length > 0
      ? Math.max(1, ...list.map((r) => (typeof r.version === "number" ? r.version : Number(r.version) || 0))) + 1
      : 1;

  const idBase = await mergeOrderChildIdMirrorColumns(supabase, dT.table, orderId, { [fk]: orderId });
  const payloads: Record<string, unknown>[] = [
    { ...idBase, note: body, file_url: null, version: nextVersion, status: "submitted" },
    { ...idBase, body, file_url: null, version: nextVersion, status: "submitted" },
  ];
  let insertErr: string | null = null;
  for (const payload of payloads) {
    const { error: ie } = await supabase.from(dT.table).insert(payload).select("id").limit(1);
    if (!ie) {
      insertErr = null;
      break;
    }
    insertErr = ie.message;
    if (!isMissingColumnPostgrest(ie.message)) {
      redirectWithError(orderId, ie.message);
    }
  }
  if (insertErr) {
    console.error("[submitMentorOrderDeliverableAction] insert failed", { orderId, insertErr, fk });
    redirectWithError(orderId, "?? ?? insert? ??????.");
  }

  await recordOrderEventBestEffort(supabase, orderId, "deliverable_submitted", user.id, { version: nextVersion });

  if (norm === ORDER_MENTOR_WORK_STARTED_PRIMARY_STATUS) {
    const stCol = primaryOrderStatusColumnKey(row);
    if (!stCol) {
      redirectWithError(orderId, "?? ?? ??? ?? ? ????.");
    }
    const patch: Record<string, unknown> = { [stCol]: "delivered" };
    const { error: ue } = await supabase.from(table).update(patch).eq("id", orderId).eq(menCol, user.id);
    if (ue) {
      console.error("[submitMentorOrderDeliverableAction] order status update failed", { orderId, ue: ue.message });
      redirectWithError(orderId, ue.message || "??? ????? ?? ?? ??? ??????.");
    }
  }

  revalidatePath(orderPath(orderId));
  revalidatePath("/custom-request");
  redirect(`${orderPath(orderId)}?ok=${encodeURIComponent("??? ??????.")}`);
}
