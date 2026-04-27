import "server-only";

import { randomUUID } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getStringField, pickExistingColumn } from "@/lib/qna/safeSelect";

type Row = Record<string, unknown>;

export const DELIVERABLE_STORAGE_BUCKET = "custom-order-deliverables" as const;

export const DELIVERABLE_MAX_FILE_BYTES = 20 * 1024 * 1024;

const MIME_LIST = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/webp",
  "application/zip",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
] as const;

export const DELIVERABLE_ALLOWED_MIME_TYPES = new Set<string>(MIME_LIST);

const CONTROL_CHARS = /[\x00-\x1f\x7f]/g;
const SLASHES = /[/\\]/g;

const ORDER_ID_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
/** object key last segment: timestamp-hex.ext — 허용 ASCII */
const OBJECT_FILENAME_SEGMENT = /^[A-Za-z0-9._-]+$/;
const POS_INT_STRING = /^[1-9]\d*$/;

const MIME_TO_EXT: Record<string, string> = {
  "application/pdf": "pdf",
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "application/zip": "zip",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": "pptx",
};

function sanitizeAsciiExtensionSegment(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .slice(0, 8);
}

export function inferStorageFileExtension(mimeType: string, originalFileName: string): string {
  const m = (mimeType || "").toLowerCase().trim();
  if (m && MIME_TO_EXT[m]) {
    return MIME_TO_EXT[m];
  }
  const base = (originalFileName || "").replace(SLASHES, "/").split("/").pop() ?? "";
  const lastDot = base.lastIndexOf(".");
  if (lastDot >= 0 && lastDot < base.length - 1) {
    const ext = sanitizeAsciiExtensionSegment(base.slice(lastDot + 1));
    if (ext.length > 0) {
      return ext;
    }
  }
  return "bin";
}

/**
 * DB `original_filename` (표시용). `file.name`을 trim 한 뒤 경로/제어 문자만 정리(한글 유지).
 * trim·정리 후 비면 `null` → 업로드 거절. storage key에는 **절대** 사용하지 않는다.
 */
export function getOriginalFilenameForDisplay(name: string): string | null {
  const trimmed = (name ?? "").trim();
  if (trimmed.length === 0) {
    return null;
  }
  const base = trimmed.split(SLASHES).pop() ?? trimmed;
  const cleaned = base.replace(CONTROL_CHARS, "").replace(/\s+/g, " ").trim();
  if (cleaned.length === 0) {
    return null;
  }
  return cleaned.length > 255 ? cleaned.slice(0, 255) : cleaned;
}

/**
 * @deprecated `getOriginalFilenameForDisplay` 사용(반환 `string | null`)
 */
export function sanitizeUploadFileName(name: string): string {
  return getOriginalFilenameForDisplay(name) ?? "upload";
}

const MAGIC_FAIL = "파일 형식이 허용된 형식과 일치하지 않습니다.";

/**
 * Content-Type(신고) vs 바이트 시그니처. `arrayBuffer()` 한 번으로 호출(업로드와 공유).
 */
export function validateDeliverableFileMagicBytes(mime: string, buffer: ArrayBuffer): string | null {
  const m = (mime || "").toLowerCase().trim();
  const d = new Uint8Array(buffer);
  const n = d.length;
  if (n < 4) {
    return MAGIC_FAIL;
  }
  if (m === "image/png") {
    if (d[0] === 0x89 && d[1] === 0x50 && d[2] === 0x4e && d[3] === 0x47) {
      return null;
    }
    return MAGIC_FAIL;
  }
  if (m === "image/jpeg") {
    if (d[0] === 0xff && d[1] === 0xd8 && d[2] === 0xff) {
      return null;
    }
    return MAGIC_FAIL;
  }
  if (m === "image/webp") {
    if (n < 12) {
      return MAGIC_FAIL;
    }
    if (
      d[0] === 0x52 &&
      d[1] === 0x49 &&
      d[2] === 0x46 &&
      d[3] === 0x46 &&
      d[8] === 0x57 &&
      d[9] === 0x45 &&
      d[10] === 0x42 &&
      d[11] === 0x50
    ) {
      return null;
    }
    return MAGIC_FAIL;
  }
  if (m === "application/pdf") {
    if (d[0] === 0x25 && d[1] === 0x50 && d[2] === 0x44 && d[3] === 0x46) {
      return null;
    }
    return MAGIC_FAIL;
  }
  if (m === "application/zip" || m.includes("openxmlformats")) {
    if (d[0] !== 0x50 || d[1] !== 0x4b || n < 4) {
      return MAGIC_FAIL;
    }
    if (
      (d[2] === 0x03 && d[3] === 0x04) ||
      (d[2] === 0x05 && d[3] === 0x06) ||
      (d[2] === 0x07 && d[3] === 0x08)
    ) {
      return null;
    }
    return MAGIC_FAIL;
  }
  return MAGIC_FAIL;
}

/**
 * Storage object key(버킷 내부) 검증: `{orderId}/{versionSeg}/{fileSeg}` 3 segment.
 * - orderId: UUID, expectedOrderId 와 일치
 * - versionSeg: 양의 정수 문자열(선택: expectedVersion 과 일치)
 * - fileSeg: ASCII (a-z A-Z 0-9 . _ -) 만
 */
export function validateDeliverableStoragePath(
  storagePath: string,
  expectedOrderId: string,
  expectedVersion?: number
): { ok: true } | { ok: false; userMessage: string } {
  const s = (storagePath ?? "").trim();
  if (!s || s.includes("..") || s.startsWith("/") || s.includes("\n") || s.includes("\r")) {
    return { ok: false, userMessage: "저장소 경로가 올바르지 않습니다." };
  }
  const segs = s.split("/");
  if (segs.length !== 3) {
    return { ok: false, userMessage: "저장소 경로가 올바르지 않습니다." };
  }
  const [seg0, seg1, seg2] = segs;
  if (!ORDER_ID_UUID.test(seg0) || seg0 !== expectedOrderId.trim()) {
    return { ok: false, userMessage: "주문에 맞는 저장소 경로가 아닙니다." };
  }
  if (!POS_INT_STRING.test(seg1)) {
    return { ok: false, userMessage: "납품 버전 경로가 올바르지 않습니다." };
  }
  if (expectedVersion !== undefined && seg1 !== String(expectedVersion)) {
    return { ok: false, userMessage: "납품 버전 경로가 올바르지 않습니다." };
  }
  if (!seg2 || !OBJECT_FILENAME_SEGMENT.test(seg2) || /[\s/\\]/.test(seg2)) {
    return { ok: false, userMessage: "저장소 파일 키가 올바르지 않습니다." };
  }
  return { ok: true };
}

export function buildDeliverableStorageObjectPath(
  orderId: string,
  version: number,
  mimeType: string,
  originalFileName: string
): { objectPath: string; timestamp: number; randomId: string } {
  const v = Math.max(1, Math.floor(Number(version)) || 1);
  const ext = inferStorageFileExtension(mimeType, originalFileName);
  const ts = Date.now();
  const randomId = randomUUID().replace(/-/g, "").slice(0, 8);
  return {
    objectPath: `${orderId.trim()}/${String(v)}/${ts}-${randomId}.${ext}`,
    timestamp: ts,
    randomId,
  };
}

export function validateDeliverableFileForUpload(file: {
  name: string;
  size: number;
  type: string;
}): string | null {
  if (file.size <= 0) {
    return "파일이 비어 있습니다. 다른 파일을 선택해 주세요.";
  }
  if (file.size > DELIVERABLE_MAX_FILE_BYTES) {
    return "파일은 20MB 이하여야 합니다.";
  }
  const mt = (file.type || "application/octet-stream").toLowerCase().trim();
  if (!DELIVERABLE_ALLOWED_MIME_TYPES.has(mt)) {
    return "지원하는 형식만 올릴 수 있습니다: PDF, PNG, JPEG, WebP, ZIP, Word(docx), PowerPoint(pptx).";
  }
  return null;
}

export function getDeliverableFileFromFormData(formData: FormData, fieldName: string): File | null {
  const v = formData.get(fieldName);
  if (!v) {
    return null;
  }
  if (typeof v === "object" && "size" in v && "arrayBuffer" in v) {
    const f = v as File;
    if (f.size === 0) {
      return null;
    }
    return f;
  }
  return null;
}

/**
 * remove 실패 시 `ORPHAN_STORAGE_OBJECT` 로 남겨 수동 정리/모니터링에 사용.
 */
export async function removeStorageObjectBestEffort(
  supabase: SupabaseClient,
  objectPath: string
): Promise<void> {
  const { error } = await supabase.storage.from(DELIVERABLE_STORAGE_BUCKET).remove([objectPath]);
  if (error) {
    console.error("ORPHAN_STORAGE_OBJECT", {
      bucket: DELIVERABLE_STORAGE_BUCKET,
      storagePath: objectPath,
      error: error.message,
    });
  }
}

export async function buildDeliverableRowPayload(
  supabase: SupabaseClient,
  table: string,
  idBase: Record<string, unknown>,
  _orderId: string,
  version: number,
  note: string,
  fileMeta: {
    objectPath: string;
    originalName: string;
    mime: string;
    size: number;
  } | null,
  mentorUserId: string | null
): Promise<Record<string, unknown>> {
  const noteCol = (await pickExistingColumn(supabase, table, ["note", "body", "message", "description", "text"]))
    .column;
  const statusCol = (await pickExistingColumn(supabase, table, ["status", "state", "label"])).column;
  const verCol = (await pickExistingColumn(supabase, table, ["version", "v"])).column;
  const fileUrlCol = (await pickExistingColumn(supabase, table, ["file_url", "url", "file_uri"])).column;
  const storagePathCol = (await pickExistingColumn(supabase, table, [
    "storage_path",
    "file_path",
    "file_storage_path",
    "object_path",
  ])).column;
  const origNameCol = (await pickExistingColumn(supabase, table, [
    "original_filename",
    "file_name",
    "filename",
    "original_name",
  ])).column;
  const mimeCol = (await pickExistingColumn(supabase, table, ["mime_type", "content_type", "file_mime_type"])).column;
  const sizeCol = (await pickExistingColumn(supabase, table, ["file_size", "file_size_bytes", "size_bytes", "size"]))
    .column;
  const mentorCol = (await pickExistingColumn(supabase, table, ["mentor_id", "uploaded_by", "submitted_by", "author_id"]))
    .column;

  const p: Record<string, unknown> = { ...idBase };
  if (verCol) {
    p[verCol] = version;
  } else {
    p.version = version;
  }
  if (statusCol) {
    p[statusCol] = "submitted";
  } else {
    p.status = "submitted";
  }
  if (noteCol) {
    p[noteCol] = note;
  } else {
    p.note = note;
  }
  if (fileUrlCol && fileMeta) {
    p[fileUrlCol] = null;
  }
  if (fileMeta) {
    if (storagePathCol) p[storagePathCol] = fileMeta.objectPath;
    if (origNameCol) p[origNameCol] = fileMeta.originalName;
    if (mimeCol) p[mimeCol] = fileMeta.mime;
    if (sizeCol) p[sizeCol] = fileMeta.size;
  }
  if (mentorUserId && mentorCol) {
    p[mentorCol] = mentorUserId;
  }
  return p;
}

/**
 * `deliverable_submitted` order_events metadata 용(운영 추적; public URL 없음).
 */
export function buildDeliverableSubmittedEventMetadataFromRow(
  row: Row,
  fallbackVersion: number
): Record<string, unknown> {
  const sp = getStringField(row, ["storage_path", "file_path", "file_storage_path", "object_path"]) ?? null;
  const ofn = getStringField(row, ["original_filename", "file_name", "filename", "original_name"]) ?? null;
  const mt = getStringField(row, ["mime_type", "content_type", "file_mime_type"]) ?? null;
  const vRaw = row.version;
  const version = typeof vRaw === "number" && Number.isFinite(vRaw) ? vRaw : fallbackVersion;
  let size: number | null = null;
  for (const k of ["file_size_bytes", "file_size", "size_bytes", "size"] as const) {
    const x = row[k];
    if (typeof x === "number" && Number.isFinite(x)) {
      size = x;
      break;
    }
  }
  const hasFile = Boolean(
    sp && !sp.startsWith("http://") && !sp.startsWith("https://") && sp.length > 0
  );
  return {
    deliverable_id: row.id != null ? String(row.id) : null,
    version,
    has_file: hasFile,
    original_filename: ofn,
    file_size_bytes: size,
    mime_type: mt,
    storage_path: hasFile ? sp : null,
  };
}

export function pickStoragePathFromDeliverableRow(r: Row): string | null {
  return getStringField(r, ["storage_path", "file_path", "file_storage_path", "object_path", "file_url"]);
}
