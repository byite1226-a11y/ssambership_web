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
import {
  buildDeliverableRowPayload,
  buildDeliverableStorageObjectPath,
  DELIVERABLE_STORAGE_BUCKET,
  getDeliverableFileFromFormData,
  getOriginalFilenameForDisplay,
  removeStorageObjectIfExists,
  validateDeliverableFileForUpload,
} from "@/lib/customRequest/orderDeliverableFiles";
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
 * custom_order_deliverables insert + Storage(비공개 버킷) 업로드 + primary open → delivered.
 * FormData: orderId, deliverableFile(optional), deliverableBody(노트·텍스트, 파일 없을 때는 필수).
 */
export async function submitMentorOrderDeliverableAction(formData: FormData): Promise<void> {
  const { user } = await requireRole("mentor");
  const supabase = await createClient();
  const orderId = String(formData.get("orderId") ?? "").trim();
  const note = String(formData.get("deliverableBody") ?? "").trim();
  const file = getDeliverableFileFromFormData(formData, "deliverableFile");

  if (!orderId) {
    redirect("/custom-request?error=" + encodeURIComponent("orderId가 필요합니다."));
  }
  if (!file && !note) {
    redirectWithError(orderId, "납품 파일을 선택하거나 납품 설명(텍스트)을 입력하세요.");
  }
  if (file) {
    const verr = validateDeliverableFileForUpload({
      name: file.name,
      size: file.size,
      type: file.type,
    });
    if (verr) {
      redirectWithError(orderId, verr);
    }
  }

  const oT = await firstReadableCustomTable(supabase, ["custom_request_orders", "custom_orders", "request_orders"]);
  if (!oT.table) {
    redirectWithError(orderId, oT.error || "주문 테이블을 찾을 수 없습니다.");
  }
  const table = oT.table;
  const { data: rowData, error: oe } = await supabase.from(table).select("*").eq("id", orderId).maybeSingle();
  if (oe || !rowData) {
    redirectWithError(orderId, oe?.message ?? "주문을 찾을 수 없습니다.");
  }
  const row = rowData as Row;

  const access = canAccessOrder(row, user.id, "mentor");
  if (!access.ok) {
    redirectWithError(orderId, "이 주문에 납품을 등록할 권한이 없습니다.");
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
    redirectWithError(orderId, "배정 멘토 본인만 납품을 등록할 수 있습니다.");
  }

  const disputeBlockDel = await getActiveDisputeBlockMessage(supabase, orderId);
  if (disputeBlockDel) {
    redirectWithError(orderId, disputeBlockDel);
  }

  const norm = normalizedPrimaryOrderStatus(row);
  if (!norm) {
    redirectWithError(orderId, "주문 상태를 확인할 수 없어 납품을 등록할 수 없습니다.");
  }
  if (isOrderStatusTerminal(norm)) {
    redirectWithError(orderId, "이미 종료된 주문입니다.");
  }
  if (norm === ORDER_INSERT_STATUS_PENDING) {
    redirectWithError(orderId, "작업 시작 후에만 납품을 등록할 수 있습니다(상태: pending).");
  }
  if (norm !== ORDER_MENTOR_WORK_STARTED_PRIMARY_STATUS && norm !== "delivered") {
    redirectWithError(orderId, `이 상태(${norm})에서는 납품을 등록할 수 없습니다.`);
  }

  const dT = await firstReadableCustomTable(supabase, ["custom_order_deliverables", "order_deliverables", "request_deliverables"]);
  if (!dT.table) {
    redirectWithError(orderId, dT.error || "납품 테이블을 찾을 수 없습니다.");
  }
  const { column: fk } = await pickExistingColumn(supabase, dT.table, [...ORDER_TO_DELIVERABLE_FK_CANDIDATES]);
  if (!fk) {
    redirectWithError(orderId, "납품 테이블의 주문 FK를 찾을 수 없습니다.");
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

  let storageObjectPath: string | null = null;
  let fileMeta: {
    objectPath: string;
    originalName: string;
    mime: string;
    size: number;
  } | null = null;

  if (file) {
    const originalForDb = getOriginalFilenameForDisplay(file.name);
    const { objectPath } = buildDeliverableStorageObjectPath(orderId, nextVersion, file.type, file.name);
    storageObjectPath = objectPath;
    const buf = await file.arrayBuffer();
    const { error: upErr } = await supabase.storage.from(DELIVERABLE_STORAGE_BUCKET).upload(objectPath, buf, {
      contentType: file.type && file.type.length > 0 ? file.type : "application/octet-stream",
      upsert: false,
    });
    if (upErr) {
      console.error("[submitMentorOrderDeliverableAction] storage upload", upErr);
      redirectWithError(orderId, upErr.message || "파일 업로드에 실패했습니다. 잠시 후 다시 시도하세요.");
    }
    fileMeta = {
      objectPath,
      originalName: originalForDb,
      mime: (file.type || "application/octet-stream").toLowerCase(),
      size: file.size,
    };
  }

  const primary = await buildDeliverableRowPayload(supabase, dT.table, idBase, orderId, nextVersion, note, fileMeta, user.id);
  const fallbacks: Record<string, unknown>[] = [
    primary,
    { ...idBase, note, file_url: null, version: nextVersion, status: "submitted" },
    { ...idBase, body: note, file_url: null, version: nextVersion, status: "submitted" },
  ];

  let insertErr: string | null = null;
  for (const payload of fallbacks) {
    const { error: ie } = await supabase.from(dT.table).insert(payload).select("id").limit(1);
    if (!ie) {
      insertErr = null;
      break;
    }
    insertErr = ie.message;
    if (!isMissingColumnPostgrest(ie.message)) {
      if (storageObjectPath) {
        await removeStorageObjectIfExists(supabase, storageObjectPath);
      }
      redirectWithError(orderId, ie.message);
    }
  }
  if (insertErr) {
    if (storageObjectPath) {
      await removeStorageObjectIfExists(supabase, storageObjectPath);
    }
    console.error("[submitMentorOrderDeliverableAction] insert failed", { orderId, insertErr, fk });
    redirectWithError(orderId, "납품 기록을 저장하지 못했습니다. 스키마를 확인하거나 잠시 후 다시 시도하세요.");
  }

  await recordOrderEventBestEffort(supabase, orderId, "deliverable_submitted", user.id, {
    version: nextVersion,
    has_file: Boolean(fileMeta),
    original_filename: fileMeta?.originalName,
    storage_path: fileMeta?.objectPath,
    mime_type: fileMeta?.mime,
  });

  if (norm === ORDER_MENTOR_WORK_STARTED_PRIMARY_STATUS) {
    const stCol = primaryOrderStatusColumnKey(row);
    if (!stCol) {
      redirectWithError(orderId, "주문 상태 컬럼을 찾을 수 없습니다. 납품은 저장되었으나 운영에 문의가 필요할 수 있습니다.");
    }
    const patch: Record<string, unknown> = { [stCol]: "delivered" };
    const { error: ue } = await supabase.from(table).update(patch).eq("id", orderId).eq(menCol, user.id);
    if (ue) {
      console.error("[submitMentorOrderDeliverableAction] order status update failed", { orderId, ue: ue.message });
      redirectWithError(orderId, ue.message || "주문 상태를 갱신하지 못했습니다.");
    }
  }

  revalidatePath(orderPath(orderId));
  revalidatePath("/custom-request");
  redirect(`${orderPath(orderId)}?ok=${encodeURIComponent("납품이 등록되었습니다.")}`);
}
