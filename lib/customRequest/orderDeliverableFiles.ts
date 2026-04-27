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

/**
 * App에서 지원하는 MIME → Storage object key에 쓸 ASCII 확장자(소문자, a-z0-9).
 * MIME이 알려지지 않으면 원본 파일명의 확장자(ASCII로만 sanitizer)에 의존.
 */
const MIME_TO_EXT: Record<string, string> = {
  "application/pdf": "pdf",
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "application/zip": "zip",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": "pptx",
};

/** 확장자 세그먼트: a-z0-1만, 비면 실패 */
function sanitizeAsciiExtensionSegment(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .slice(0, 8);
}

/**
 * Storage key용 ASCII 확장자. MIME 우선, 없으면 원본 파일명 끝의 점 뒤, 그래도 없으면 "bin".
 */
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
 * DB `original_filename` — 사용자에게 보이는 원본명(한글·공백 유지). 경로·제어문자만 제거.
 * Storage object key 생성에는 사용하지 않음.
 */
export function getOriginalFilenameForDisplay(name: string): string {
  const base = (name || "upload").split(SLASHES).pop() ?? "upload";
  const cleaned = base.replace(CONTROL_CHARS, "").replace(/\s+/g, " ").trim() || "upload";
  return cleaned.length > 255 ? cleaned.slice(0, 255) : cleaned;
}

/**
 * @deprecated `getOriginalFilenameForDisplay` 사용. Storage key는 `buildDeliverableStorageObjectPath`가 별도로 생성.
 */
export function sanitizeUploadFileName(name: string): string {
  return getOriginalFilenameForDisplay(name);
}

/**
 * **ASCII-only** object key(버킷 내부, leading slash 없음):
 * `{orderId}/{version}/{timestamp}-{8 hex random from uuid}.{ext}`
 *
 * - `orderId` / `version` 은 슬래시 구분만(주문 id·버전은 서버에서 이미 검증된 값).
 * - 파일명 부분에 한글·공백·슬래시·비ASCII 사용 안 함(Supabase "Invalid key" 방지).
 * - 원래 파일명·한글은 `getOriginalFilenameForDisplay` + DB `original_filename` 에만 둔다.
 */
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

/** Remove uploaded object best-effort after failed DB insert. */
export async function removeStorageObjectIfExists(
  supabase: SupabaseClient,
  objectPath: string
): Promise<void> {
  await supabase.storage.from(DELIVERABLE_STORAGE_BUCKET).remove([objectPath]);
}

/**
 * `custom_order_deliverables` — 스키마 차이 흡수(010 컬럼 + legacy).
 * storage_path(또는 file_path) 와 메타: 가능한 열만 set.
 */
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

export function pickStoragePathFromDeliverableRow(r: Row): string | null {
  return getStringField(r, ["storage_path", "file_path", "file_storage_path", "object_path", "file_url"]);
}
