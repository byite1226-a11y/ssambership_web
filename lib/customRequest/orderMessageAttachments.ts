import "server-only";

import { randomUUID } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  getOriginalFilenameForDisplay,
  inferStorageFileExtension,
} from "@/lib/customRequest/orderDeliverableFiles";
import { createSignedStorageUrl } from "@/lib/storage/signedStorageUrl";
import { validateMagicBytesForMime } from "@/lib/storage/uploadMagicBytes";

export const ORDER_MESSAGE_ATTACHMENTS_TABLE = "custom_order_message_attachments" as const;
export const ORDER_MESSAGE_ATTACHMENTS_BUCKET = "custom-order-message-attachments" as const;
export const ORDER_MESSAGE_ATTACHMENT_MAX_BYTES = 20 * 1024 * 1024;
export const ORDER_MESSAGE_ATTACHMENT_SIGNED_URL_TTL_SEC = 10 * 60;

export const ORDER_MESSAGE_ATTACHMENT_ACCEPT =
  "application/pdf,image/png,image/jpeg,image/webp,application/zip,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.presentationml.presentation,.pdf,.png,.jpg,.jpeg,.webp,.zip,.docx,.pptx";

const MIME_LIST = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/webp",
  "application/zip",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
] as const;

const ALLOWED_MIME_TYPES = new Set<string>(MIME_LIST);
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const EXTENSION_TO_MIME: Record<string, (typeof MIME_LIST)[number]> = {
  pdf: "application/pdf",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
  zip: "application/zip",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
};

export type OrderMessageAttachmentMeta = {
  objectPath: string;
  originalName: string;
  mime: string;
  size: number;
};

export type OrderMessageAttachmentRow = {
  id: string;
  order_id: string;
  message_id: string | null;
  uploader_id: string;
  storage_path: string;
  original_filename: string;
  mime_type: string;
  file_size_bytes: number | string;
  created_at: string;
};

export type OrderMessageAttachmentView = {
  id: string;
  orderId: string;
  messageId: string | null;
  uploaderId: string;
  fileName: string;
  mimeType: string;
  fileSizeBytes: number;
  displaySize: string;
  signedUrl: string | null;
  signedUrlError: string | null;
  isImage: boolean;
  isPdf: boolean;
  createdAt: string;
};

export function getOrderMessageAttachmentFileFromFormData(formData: FormData, fieldName: string): File | null {
  const raw = formData.get(fieldName);
  if (!raw || typeof raw !== "object" || !("size" in raw) || !("arrayBuffer" in raw)) {
    return null;
  }
  const file = raw as File;
  return file.size > 0 ? file : null;
}

function normalizeUploadMime(file: File): string | null {
  const declared = (file.type || "").toLowerCase().trim();
  if (ALLOWED_MIME_TYPES.has(declared)) {
    return declared;
  }
  if (declared === "application/x-zip-compressed") {
    return "application/zip";
  }

  const base = (file.name || "").split(/[/\\]/).pop() ?? "";
  const dot = base.lastIndexOf(".");
  const ext = dot >= 0 ? base.slice(dot + 1).toLowerCase().replace(/[^a-z0-9]/g, "") : "";
  return EXTENSION_TO_MIME[ext] ?? null;
}

function isMissingAttachmentStoreError(message: string): boolean {
  return /relation|does not exist|schema cache|bucket not found|not found/i.test(message);
}

export async function prepareOrderMessageAttachmentFile(
  file: File
): Promise<{ ok: true; buffer: ArrayBuffer; originalName: string; mime: string; size: number } | { ok: false; error: string }> {
  if (file.size <= 0) {
    return { ok: false, error: "빈 파일은 첨부할 수 없습니다." };
  }
  if (file.size > ORDER_MESSAGE_ATTACHMENT_MAX_BYTES) {
    return { ok: false, error: "첨부 파일은 20MB 이하만 업로드할 수 있습니다." };
  }

  const mime = normalizeUploadMime(file);
  if (!mime) {
    return { ok: false, error: "지원하는 파일 형식만 첨부할 수 있습니다: PDF, PNG, JPEG, WebP, ZIP, Word(docx), PowerPoint(pptx)." };
  }

  const originalName = getOriginalFilenameForDisplay(file.name) ?? "attachment";
  const buffer = await file.arrayBuffer();
  const magicError = validateMagicBytesForMime(buffer, mime);
  if (magicError) {
    return { ok: false, error: magicError };
  }

  return { ok: true, buffer, originalName, mime, size: file.size };
}

export function buildOrderMessageAttachmentObjectPath(
  orderId: string,
  userId: string,
  mimeType: string,
  originalFileName: string
): string {
  const cleanOrderId = orderId.trim();
  const cleanUserId = userId.trim();
  if (!UUID_RE.test(cleanOrderId) || !UUID_RE.test(cleanUserId)) {
    throw new Error("invalid_order_message_attachment_scope");
  }
  const ext = inferStorageFileExtension(mimeType, originalFileName);
  const randomId = randomUUID().replace(/-/g, "").slice(0, 12);
  return `${cleanOrderId}/${cleanUserId}/${Date.now()}-${randomId}.${ext}`;
}

export async function uploadOrderMessageAttachment(
  supabase: SupabaseClient,
  input: {
    orderId: string;
    userId: string;
    file: File;
  }
): Promise<{ ok: true; meta: OrderMessageAttachmentMeta } | { ok: false; error: string }> {
  const prepared = await prepareOrderMessageAttachmentFile(input.file);
  if (!prepared.ok) {
    return prepared;
  }

  let objectPath: string;
  try {
    objectPath = buildOrderMessageAttachmentObjectPath(
      input.orderId,
      input.userId,
      prepared.mime,
      prepared.originalName
    );
  } catch {
    return { ok: false, error: "첨부 파일 저장 경로를 만들 수 없습니다." };
  }

  const { error } = await supabase.storage
    .from(ORDER_MESSAGE_ATTACHMENTS_BUCKET)
    .upload(objectPath, prepared.buffer, {
      contentType: prepared.mime,
      upsert: false,
    });

  if (error) {
    const fallback = isMissingAttachmentStoreError(error.message)
      ? "주문방 첨부 저장소가 아직 준비되지 않았습니다. 관리자에게 문의해 주세요."
      : error.message;
    return { ok: false, error: fallback };
  }

  return {
    ok: true,
    meta: {
      objectPath,
      originalName: prepared.originalName,
      mime: prepared.mime,
      size: prepared.size,
    },
  };
}

export async function removeOrderMessageAttachmentObjectBestEffort(
  supabase: SupabaseClient,
  objectPath: string
): Promise<void> {
  const { error } = await supabase.storage.from(ORDER_MESSAGE_ATTACHMENTS_BUCKET).remove([objectPath]);
  if (error) {
    console.error("[orderMessageAttachments] orphan storage object", {
      bucket: ORDER_MESSAGE_ATTACHMENTS_BUCKET,
      storagePath: objectPath,
      error: error.message,
    });
  }
}

export async function insertOrderMessageAttachmentRow(
  supabase: SupabaseClient,
  input: {
    orderId: string;
    messageId: string | null;
    uploaderId: string;
    fileMeta: OrderMessageAttachmentMeta;
  }
): Promise<{ error: string | null }> {
  const { error } = await supabase.from(ORDER_MESSAGE_ATTACHMENTS_TABLE).insert({
    order_id: input.orderId,
    message_id: input.messageId,
    uploader_id: input.uploaderId,
    storage_path: input.fileMeta.objectPath,
    original_filename: input.fileMeta.originalName,
    mime_type: input.fileMeta.mime,
    file_size_bytes: input.fileMeta.size,
  });

  if (!error) {
    return { error: null };
  }

  return {
    error: isMissingAttachmentStoreError(error.message)
      ? "주문방 첨부 저장소가 아직 준비되지 않았습니다. 관리자에게 문의해 주세요."
      : error.message,
  };
}

export async function loadOrderMessageAttachmentRows(
  supabase: SupabaseClient,
  orderId: string
): Promise<{ rows: OrderMessageAttachmentRow[]; error: string | null; tableMissing: boolean }> {
  const { data, error } = await supabase
    .from(ORDER_MESSAGE_ATTACHMENTS_TABLE)
    .select("id, order_id, message_id, uploader_id, storage_path, original_filename, mime_type, file_size_bytes, created_at")
    .eq("order_id", orderId)
    .order("created_at", { ascending: true });

  if (!error) {
    return { rows: (data as OrderMessageAttachmentRow[]) ?? [], error: null, tableMissing: false };
  }

  if (isMissingAttachmentStoreError(error.message)) {
    return { rows: [], error: null, tableMissing: true };
  }

  return { rows: [], error: error.message, tableMissing: false };
}

export function formatAttachmentFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return "";
  }
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  const kb = bytes / 1024;
  if (kb < 1024) {
    return `${kb.toFixed(kb >= 100 ? 0 : 1)} KB`;
  }
  const mb = kb / 1024;
  return `${mb.toFixed(mb >= 100 ? 0 : 1)} MB`;
}

export async function buildOrderMessageAttachmentViews(
  supabase: SupabaseClient,
  rows: OrderMessageAttachmentRow[]
): Promise<OrderMessageAttachmentView[]> {
  return Promise.all(
    rows.map(async (row) => {
      const storagePath = String(row.storage_path ?? "").trim();
      const fileSizeBytes = Number(row.file_size_bytes);
      const { url, error } = storagePath
        ? await createSignedStorageUrl(
            supabase,
            ORDER_MESSAGE_ATTACHMENTS_BUCKET,
            storagePath,
            ORDER_MESSAGE_ATTACHMENT_SIGNED_URL_TTL_SEC
          )
        : { url: null, error: "missing storage path" };

      const mimeType = String(row.mime_type ?? "").toLowerCase().trim();
      return {
        id: String(row.id),
        orderId: String(row.order_id),
        messageId: row.message_id ? String(row.message_id) : null,
        uploaderId: String(row.uploader_id),
        fileName: String(row.original_filename || "attachment"),
        mimeType,
        fileSizeBytes: Number.isFinite(fileSizeBytes) ? fileSizeBytes : 0,
        displaySize: formatAttachmentFileSize(Number.isFinite(fileSizeBytes) ? fileSizeBytes : 0),
        signedUrl: url,
        signedUrlError: error,
        isImage: mimeType.startsWith("image/"),
        isPdf: mimeType === "application/pdf",
        createdAt: String(row.created_at ?? ""),
      };
    })
  );
}

export function groupOrderMessageAttachmentViews(
  attachments: OrderMessageAttachmentView[]
): {
  byMessageId: Record<string, OrderMessageAttachmentView[]>;
  loose: OrderMessageAttachmentView[];
} {
  const byMessageId: Record<string, OrderMessageAttachmentView[]> = {};
  const loose: OrderMessageAttachmentView[] = [];

  for (const attachment of attachments) {
    if (!attachment.messageId) {
      loose.push(attachment);
      continue;
    }
    if (!byMessageId[attachment.messageId]) {
      byMessageId[attachment.messageId] = [];
    }
    byMessageId[attachment.messageId].push(attachment);
  }

  return { byMessageId, loose };
}
