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
  isOrderRowTerminalForActions,
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
  buildDeliverableSubmittedEventMetadataFromRow,
  DELIVERABLE_STORAGE_BUCKET,
  getDeliverableFileFromFormData,
  getOriginalFilenameForDisplay,
  removeStorageObjectBestEffort,
  validateDeliverableFileMagicBytes,
  validateDeliverableFileForUpload,
  validateDeliverableStoragePath,
} from "@/lib/customRequest/orderDeliverableFiles";
import { isCustomOrderPaymentConfirmed } from "@/lib/customRequest/orderPaymentPolicy";
import { recordOrderEventBestEffort } from "@/lib/customRequest/orderRoomMutations";
import { markCustomOrderDeliveredRpc, startCustomOrderWorkRpc } from "@/lib/customRequest/orderTransitionRpc";
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
 * 멘토 작업 시작: primary 상태가 허용 집합(예: pending/open)일 때만 `in_progress` 등으로 전이.
 * insert 직후 값은 `insertCustomRequestOrder`·스키마에 따름.
 */
export async function startCustomOrderWorkAction(formData: FormData): Promise<void> {
  const { user } = await requireRole("mentor");
  const supabase = await createClient();
  const orderId = String(formData.get("orderId") ?? "").trim();
  if (!orderId) {
    redirect("/custom-request?error=" + encodeURIComponent("orderId가 필요합니다."));
  }

  if (!isCustomRequestOrderStatusDdlInRepo()) {
    redirectWithError(orderId, MENTOR_START_SCHEMA_GATE_MESSAGE);
  }

  const oT = await firstReadableCustomTable(supabase, ["custom_request_orders", "request_orders"]);
  if (!oT.table) {
    redirectWithError(orderId, oT.error || "주문 테이블을 찾을 수 없습니다.");
  }
  const table = oT.table;

  const { data: rowData, error: oe } = await supabase.from(table).select("*").eq("id", orderId).maybeSingle();
  if (oe || !rowData) {
    redirectWithError(orderId, oe?.message ?? "주문 정보를 찾을 수 없습니다.");
  }
  const row = rowData as Row;

  const access = canAccessOrder(row, user.id, "mentor");
  if (!access.ok) {
    redirectWithError(orderId, "이 주문에 접근할 수 없습니다.");
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
    redirectWithError(orderId, "배정된 멘토 본인만 작업을 시작할 수 있습니다.");
  }

  const disputeBlockStart = await getActiveDisputeBlockMessage(supabase, orderId);
  if (disputeBlockStart) {
    redirectWithError(orderId, disputeBlockStart);
  }

  if (!isCustomOrderPaymentConfirmed(row)) {
    redirectWithError(orderId, "학생 측 결제가 완료된 뒤에만 작업을 시작할 수 있습니다.");
  }

  const norm = normalizedPrimaryOrderStatus(row);
  if (!norm) {
    redirectWithError(orderId, "주문 상태를 확인할 수 없어 작업을 시작할 수 없습니다.");
  }
  if (isOrderRowTerminalForActions(row)) {
    redirectWithError(orderId, "완료된 주문에서는 작업을 시작할 수 없습니다.");
  }
  if (norm === ORDER_MENTOR_WORK_STARTED_PRIMARY_STATUS) {
    redirectWithError(orderId, "이미 작업이 시작된 상태입니다.");
  }
  if (!ORDER_STATUSES_MENTOR_START_WORK_ALLOWED.has(norm)) {
    redirectWithError(orderId, `현재 상태(${norm})에서는 작업을 시작할 수 없습니다.`);
  }

  const stCol = primaryOrderStatusColumnKey(row);
  if (!stCol) {
    redirectWithError(orderId, "주문 상태 컬럼을 찾을 수 없습니다.");
  }

  const transition = await startCustomOrderWorkRpc(supabase, orderId);
  if (!transition.ok) {
    redirectWithError(orderId, transition.error);
  }

  await recordOrderEventBestEffort(supabase, orderId, "order_started", user.id, { from: norm });

  revalidatePath(orderPath(orderId));
  revalidatePath("/custom-request");
  revalidatePath("/mentor/custom-request/orders");
  redirect(`${orderPath(orderId)}?ok=${encodeURIComponent("작업을 시작했습니다.")}`);
}

function isMissingColumnPostgrest(msg: string): boolean {
  return /column|does not exist|schema cache/i.test(msg);
}

function mentorOrderFilesPath(orderId: string) {
  return `/mentor/custom-request/orders/${encodeURIComponent(orderId)}/files`;
}

function mentorOrderWaitingReviewPath(orderId: string) {
  return `/mentor/custom-request/orders/${encodeURIComponent(orderId)}/waiting-review`;
}

function redirectFilesWithError(orderId: string, msg: string): never {
  redirect(`${mentorOrderFilesPath(orderId)}?error=${encodeURIComponent(msg)}`);
}

async function insertMentorDeliverableFromForm(
  supabase: Awaited<ReturnType<typeof createClient>>,
  user: { id: string },
  orderId: string,
  file: File | null,
  note: string,
  allowWithoutStatusChange: boolean
): Promise<{ inserted: Row; nextVersion: number; orderTable: string; orderRow: Row; menCol: string }> {
  if (!file && !note) {
    throw new Error("납품 파일을 선택하거나 설명을 입력하세요.");
  }
  if (file) {
    const verr = validateDeliverableFileForUpload({ name: file.name, size: file.size, type: file.type });
    if (verr) throw new Error(verr);
  }

  const oT = await firstReadableCustomTable(supabase, ["custom_request_orders", "request_orders"]);
  if (!oT.table) throw new Error(oT.error || "주문 테이블을 찾을 수 없습니다.");
  const table = oT.table;
  const { data: rowData, error: oe } = await supabase.from(table).select("*").eq("id", orderId).maybeSingle();
  if (oe || !rowData) throw new Error(oe?.message ?? "주문을 찾을 수 없습니다.");
  const row = rowData as Row;

  const access = canAccessOrder(row, user.id, "mentor");
  if (!access.ok) throw new Error("이 주문에 파일을 등록할 권한이 없습니다.");
  const { column: menCol } = await pickExistingColumn(supabase, table, [
    "mentor_id",
    "mentor_user_id",
    "assignee_id",
    "assigned_mentor_id",
    "selected_mentor_id",
    "expert_id",
  ]);
  if (!menCol || String(row[menCol]) !== user.id) {
    throw new Error("배정 멘토 본인만 파일을 등록할 수 있습니다.");
  }

  const disputeBlock = await getActiveDisputeBlockMessage(supabase, orderId);
  if (disputeBlock) throw new Error(disputeBlock);
  if (!isCustomOrderPaymentConfirmed(row)) {
    throw new Error("학생 측 결제가 완료된 뒤에만 파일을 등록할 수 있습니다.");
  }

  const norm = normalizedPrimaryOrderStatus(row);
  if (!norm) throw new Error("주문 상태를 확인할 수 없어 파일을 등록할 수 없습니다.");
  if (isOrderRowTerminalForActions(row)) {
    throw new Error("완료된 주문에서는 파일을 등록할 수 없습니다.");
  }
  if (norm === ORDER_INSERT_STATUS_PENDING) {
    throw new Error("작업 시작 후에만 파일을 등록할 수 있습니다.");
  }
  if (
    !allowWithoutStatusChange &&
    norm !== ORDER_MENTOR_WORK_STARTED_PRIMARY_STATUS &&
    norm !== "delivered"
  ) {
    throw new Error(`이 상태(${norm})에서는 납품을 등록할 수 없습니다.`);
  }
  if (
    allowWithoutStatusChange &&
    norm !== ORDER_MENTOR_WORK_STARTED_PRIMARY_STATUS &&
    norm !== "delivered" &&
    norm !== "revision_requested"
  ) {
    throw new Error(`이 상태(${norm})에서는 파일을 업로드할 수 없습니다.`);
  }

  const dT = await firstReadableCustomTable(supabase, [
    "custom_order_deliverables",
    "order_deliverables",
    "request_deliverables",
  ]);
  if (!dT.table) throw new Error(dT.error || "납품 테이블을 찾을 수 없습니다.");
  const { column: fk } = await pickExistingColumn(supabase, dT.table, [...ORDER_TO_DELIVERABLE_FK_CANDIDATES]);
  if (!fk) throw new Error("납품 테이블의 주문 FK를 찾을 수 없습니다.");

  const { data: vrows, error: ve } = await supabase.from(dT.table).select("version").eq(fk, orderId);
  if (ve) throw new Error(ve.message);
  const list = (vrows as { version?: unknown }[] | null) ?? [];
  const nextVersion =
    list.length > 0
      ? Math.max(1, ...list.map((r) => (typeof r.version === "number" ? r.version : Number(r.version) || 0))) + 1
      : 1;

  const idBase = await mergeOrderChildIdMirrorColumns(supabase, dT.table, orderId, { [fk]: orderId });

  let storageObjectPath: string | null = null;
  let fileMeta: { objectPath: string; originalName: string; mime: string; size: number } | null = null;

  if (file) {
    const originalForDb = getOriginalFilenameForDisplay(file.name);
    if (originalForDb == null) throw new Error("파일 이름이 비어 있거나 사용할 수 없습니다.");
    const buf = await file.arrayBuffer();
    const mErr = validateDeliverableFileMagicBytes(file.type, buf);
    if (mErr) throw new Error(mErr);
    const { objectPath } = buildDeliverableStorageObjectPath(orderId, nextVersion, file.type, file.name);
    const pCheck = validateDeliverableStoragePath(objectPath, orderId, nextVersion);
    if (pCheck.ok === false) throw new Error(pCheck.userMessage);
    storageObjectPath = objectPath;
    const { error: upErr } = await supabase.storage.from(DELIVERABLE_STORAGE_BUCKET).upload(objectPath, buf, {
      contentType: file.type && file.type.length > 0 ? file.type : "application/octet-stream",
      upsert: false,
    });
    if (upErr) throw new Error(upErr.message || "파일 업로드에 실패했습니다.");
    fileMeta = {
      objectPath,
      originalName: originalForDb,
      mime: (file.type || "application/octet-stream").toLowerCase(),
      size: file.size,
    };
  }

  const primary = await buildDeliverableRowPayload(
    supabase,
    dT.table,
    idBase,
    orderId,
    nextVersion,
    note,
    fileMeta,
    user.id
  );
  const fallbacks: Record<string, unknown>[] = [
    primary,
    { ...idBase, note, file_url: null, version: nextVersion, status: "submitted" },
    { ...idBase, body: note, file_url: null, version: nextVersion, status: "submitted" },
  ];

  let inserted: Row | null = null;
  for (const payload of fallbacks) {
    const { data, error: ie } = await supabase.from(dT.table).insert(payload).select("*").maybeSingle();
    if (!ie && data) {
      inserted = data as Row;
      break;
    }
    if (ie && isPostgresUniqueViolation(ie)) {
      if (storageObjectPath) await removeStorageObjectBestEffort(supabase, storageObjectPath);
      throw new Error("파일 등록 중 충돌이 발생했습니다. 다시 시도해 주세요.");
    }
    if (ie && !isMissingColumnPostgrest(ie.message)) {
      if (storageObjectPath) await removeStorageObjectBestEffort(supabase, storageObjectPath);
      throw new Error(ie.message);
    }
  }
  if (!inserted) {
    if (storageObjectPath) await removeStorageObjectBestEffort(supabase, storageObjectPath);
    throw new Error("파일 기록을 저장하지 못했습니다.");
  }

  return { inserted, nextVersion, orderTable: table, orderRow: row, menCol };
}

/** 작업 파일만 업로드(주문 상태 변경 없음) */
export async function uploadMentorOrderWorkFileAction(formData: FormData): Promise<void> {
  const { user } = await requireRole("mentor");
  const supabase = await createClient();
  const orderId = String(formData.get("orderId") ?? "").trim();
  const note = String(formData.get("deliverableBody") ?? "").trim();
  const file = getDeliverableFileFromFormData(formData, "deliverableFile");

  if (!orderId) redirect("/mentor/custom-request/orders?error=" + encodeURIComponent("orderId가 필요합니다."));
  if (!file) redirectFilesWithError(orderId, "업로드할 파일을 선택해 주세요.");

  try {
    const { inserted, nextVersion } = await insertMentorDeliverableFromForm(
      supabase,
      user,
      orderId,
      file,
      note,
      true
    );
    const eventMeta = buildDeliverableSubmittedEventMetadataFromRow(inserted, nextVersion);
    await recordOrderEventBestEffort(supabase, orderId, "deliverable_submitted", user.id, {
      ...eventMeta,
      upload_only: true,
    });
  } catch (e) {
    redirectFilesWithError(orderId, e instanceof Error ? e.message : "업로드에 실패했습니다.");
  }

  revalidatePath(mentorOrderFilesPath(orderId));
  revalidatePath(orderPath(orderId));
  redirect(`${mentorOrderFilesPath(orderId)}?ok=${encodeURIComponent("파일이 업로드되었습니다.")}`);
}

/** 납품 확정: delivered 상태로 전환 후 검토 대기 화면으로 */
export async function markMentorOrderDeliveredForReviewAction(formData: FormData): Promise<void> {
  const { user } = await requireRole("mentor");
  const supabase = await createClient();
  const orderId = String(formData.get("orderId") ?? "").trim();
  if (!orderId) redirect("/mentor/custom-request/orders?error=" + encodeURIComponent("orderId가 필요합니다."));

  const oT = await firstReadableCustomTable(supabase, ["custom_request_orders", "request_orders"]);
  if (!oT.table) redirectFilesWithError(orderId, oT.error || "주문 테이블을 찾을 수 없습니다.");
  const table = oT.table;
  const { data: rowData, error: oe } = await supabase.from(table).select("*").eq("id", orderId).maybeSingle();
  if (oe || !rowData) redirectFilesWithError(orderId, oe?.message ?? "주문을 찾을 수 없습니다.");
  const row = rowData as Row;

  const access = canAccessOrder(row, user.id, "mentor");
  if (!access.ok) redirectFilesWithError(orderId, "이 주문에 접근할 수 없습니다.");
  const { column: menCol } = await pickExistingColumn(supabase, table, [
    "mentor_id",
    "mentor_user_id",
    "assignee_id",
    "assigned_mentor_id",
    "selected_mentor_id",
    "expert_id",
  ]);
  if (!menCol || String(row[menCol]) !== user.id) {
    redirectFilesWithError(orderId, "배정 멘토 본인만 납품할 수 있습니다.");
  }

  const dT = await firstReadableCustomTable(supabase, [
    "custom_order_deliverables",
    "order_deliverables",
    "request_deliverables",
  ]);
  if (!dT.table) redirectFilesWithError(orderId, "납품 파일이 없습니다.");
  const { column: fk } = await pickExistingColumn(supabase, dT.table, [...ORDER_TO_DELIVERABLE_FK_CANDIDATES]);
  if (!fk) redirectFilesWithError(orderId, "납품 스키마를 확인할 수 없습니다.");
  const { count } = await supabase.from(dT.table).select("*", { count: "exact", head: true }).eq(fk, orderId);
  if (!count || count < 1) {
    redirectFilesWithError(orderId, "납품할 파일을 먼저 업로드해 주세요.");
  }

  const norm = normalizedPrimaryOrderStatus(row);
  if (isOrderRowTerminalForActions(row)) {
    redirect(`${mentorOrderWaitingReviewPath(orderId)}?ok=${encodeURIComponent("이미 완료된 주문입니다.")}`);
  }

  const transition = await markCustomOrderDeliveredRpc(supabase, orderId);
  if (!transition.ok) {
    redirectFilesWithError(orderId, transition.error);
  }

  await recordOrderEventBestEffort(supabase, orderId, "deliverable_submitted", user.id, {
    marked_delivered: true,
    from: norm,
  });

  revalidatePath(mentorOrderWaitingReviewPath(orderId));
  revalidatePath(orderPath(orderId));
  redirect(`${mentorOrderWaitingReviewPath(orderId)}?ok=${encodeURIComponent("납품이 완료되었습니다. 학생 검토를 기다려 주세요.")}`);
}


function isPostgresUniqueViolation(e: { code?: string; message?: string } | null | undefined): boolean {
  if (e?.code === "23505") {
    return true;
  }
  const m = (e?.message ?? "").toLowerCase();
  return m.includes("duplicate key") || m.includes("unique constraint");
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

  const oT = await firstReadableCustomTable(supabase, ["custom_request_orders", "request_orders"]);
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

  if (!isCustomOrderPaymentConfirmed(row)) {
    redirectWithError(orderId, "학생 측 결제가 완료된 뒤에만 납품을 등록할 수 있습니다.");
  }

  const norm = normalizedPrimaryOrderStatus(row);
  if (!norm) {
    redirectWithError(orderId, "주문 상태를 확인할 수 없어 납품을 등록할 수 없습니다.");
  }
  if (isOrderRowTerminalForActions(row)) {
    redirectWithError(orderId, "완료된 주문에서는 납품을 등록할 수 없습니다.");
  }
  if (norm === ORDER_INSERT_STATUS_PENDING) {
    redirectWithError(orderId, "작업 시작 후에만 납품을 등록할 수 있습니다(상태: pending).");
  }
  if (
    norm !== ORDER_MENTOR_WORK_STARTED_PRIMARY_STATUS &&
    norm !== "delivered" &&
    norm !== "revision_requested"
  ) {
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
    if (originalForDb == null) {
      redirectWithError(orderId, "파일 이름이 비어 있거나 사용할 수 없습니다.");
    }
    const buf = await file.arrayBuffer();
    const mErr = validateDeliverableFileMagicBytes(file.type, buf);
    if (mErr) {
      redirectWithError(orderId, mErr);
    }
    const { objectPath } = buildDeliverableStorageObjectPath(orderId, nextVersion, file.type, file.name);
    const pCheck = validateDeliverableStoragePath(objectPath, orderId, nextVersion);
    if (pCheck.ok === false) {
      redirectWithError(orderId, pCheck.userMessage);
    }
    storageObjectPath = objectPath;
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

  let inserted: Row | null = null;
  let insertErr: string | null = null;

  for (const payload of fallbacks) {
    const { data, error: ie } = await supabase.from(dT.table).insert(payload).select("*").maybeSingle();
    if (!ie && data) {
      inserted = data as Row;
      break;
    }
    if (!ie && !data) {
      insertErr = "insert 결과 행이 없습니다.";
      break;
    }
    if (ie) {
      insertErr = ie.message;
      if (isPostgresUniqueViolation(ie)) {
        if (storageObjectPath) {
          await removeStorageObjectBestEffort(supabase, storageObjectPath);
        }
        redirectWithError(orderId, "납품 처리 중 충돌이 발생했습니다. 다시 시도해 주세요.");
      }
      if (!isMissingColumnPostgrest(ie.message)) {
        if (storageObjectPath) {
          await removeStorageObjectBestEffort(supabase, storageObjectPath);
        }
        redirectWithError(orderId, ie.message);
      }
    }
  }
  if (insertErr || !inserted) {
    if (storageObjectPath) {
      await removeStorageObjectBestEffort(supabase, storageObjectPath);
    }
    console.error("[submitMentorOrderDeliverableAction] insert failed", { orderId, insertErr, fk });
    redirectWithError(orderId, "납품 기록을 저장하지 못했습니다. 스키마를 확인하거나 잠시 후 다시 시도하세요.");
  }

  const eventMeta = buildDeliverableSubmittedEventMetadataFromRow(inserted, nextVersion);
  await recordOrderEventBestEffort(supabase, orderId, "deliverable_submitted", user.id, eventMeta);

  if (
    norm === ORDER_MENTOR_WORK_STARTED_PRIMARY_STATUS ||
    norm === "revision_requested" ||
    norm === "delivered"
  ) {
    const transition = await markCustomOrderDeliveredRpc(supabase, orderId);
    if (!transition.ok) {
      console.error("[submitMentorOrderDeliverableAction] order delivered transition failed", orderId, transition.error);
      redirectWithError(orderId, transition.error);
    }
  }

  revalidatePath(orderPath(orderId));
  revalidatePath("/custom-request");
  revalidatePath("/mentor/custom-request/orders");
  redirect(`${orderPath(orderId)}?ok=${encodeURIComponent("납품이 등록되었습니다.")}`);
}
