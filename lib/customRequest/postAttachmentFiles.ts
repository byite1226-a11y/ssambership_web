import "server-only";

import { randomUUID } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { inferStorageFileExtension } from "@/lib/customRequest/orderDeliverableFiles";

export const POST_ATTACHMENT_STORAGE_BUCKET = "custom-request-post-attachments" as const;

/** 의뢰 등록 첨부: 파일당 최대 50MB */
export const POST_ATTACHMENT_MAX_FILE_BYTES = 50 * 1024 * 1024;
export const POST_ATTACHMENT_MAX_FILES = 3;

const ORDER_ID_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
/** object key 2nd segment: `{timestamp}-{8hex}.ext` — ASCII */
const POST_ATTACHMENT_FILE_SEGMENT = /^[0-9]+-[0-9a-f]{8}\.[A-Za-z0-9._-]+$/;

/**
 * @param storagePath — `{postId}/{timestamp}-{8hex}.{ext}`
 */
export function validatePostAttachmentStoragePath(
  storagePath: string,
  expectedPostId: string
): { ok: true } | { ok: false; userMessage: string } {
  const s = (storagePath ?? "").trim();
  if (!s || s.includes("..") || s.startsWith("/") || s.includes("\n") || s.includes("\r")) {
    return { ok: false, userMessage: "저장소 경로가 올바르지 않습니다." };
  }
  const segs = s.split("/");
  if (segs.length !== 2) {
    return { ok: false, userMessage: "저장소 경로가 올바르지 않습니다." };
  }
  const [seg0, seg1] = segs;
  if (!ORDER_ID_UUID.test(seg0) || seg0 !== expectedPostId.trim()) {
    return { ok: false, userMessage: "의뢰에 맞는 저장소 경로가 아닙니다." };
  }
  if (!seg1 || !POST_ATTACHMENT_FILE_SEGMENT.test(seg1)) {
    return { ok: false, userMessage: "저장소 파일 키가 올바르지 않습니다." };
  }
  return { ok: true };
}

export function buildPostAttachmentStorageObjectPath(
  postId: string,
  mimeType: string,
  originalFileName: string
): { objectPath: string; timestamp: number; randomId: string } {
  const ext = inferStorageFileExtension(mimeType, originalFileName);
  const ts = Date.now();
  const randomId = randomUUID().replace(/-/g, "").slice(0, 8);
  return {
    objectPath: `${postId.trim()}/${ts}-${randomId}.${ext}`,
    timestamp: ts,
    randomId,
  };
}

export {
  getOriginalFilenameForDisplay,
  validateDeliverableFileForUpload as validatePostAttachmentFileForUpload,
  validateDeliverableFileMagicBytes as validatePostAttachmentFileMagicBytes,
} from "@/lib/customRequest/orderDeliverableFiles";

export { getDeliverableFileFromFormData as getPostAttachmentFileFromFormData } from "@/lib/customRequest/orderDeliverableFiles";

export function getPostAttachmentFilesFromFormData(formData: FormData, fieldName: string): File[] {
  const files = formData
    .getAll(fieldName)
    .filter((x): x is File => x instanceof File && x.size > 0);
  return files.slice(0, POST_ATTACHMENT_MAX_FILES);
}

/**
 * `remove` 실패 시 `ORPHAN_STORAGE_OBJECT` 로 남겨 수동 정리/모니터링에 사용.
 */
export async function removePostAttachmentStorageObjectBestEffort(
  supabase: SupabaseClient,
  objectPath: string
): Promise<void> {
  const { error } = await supabase.storage.from(POST_ATTACHMENT_STORAGE_BUCKET).remove([objectPath]);
  if (error) {
    console.error("ORPHAN_STORAGE_OBJECT", {
      bucket: POST_ATTACHMENT_STORAGE_BUCKET,
      storagePath: objectPath,
      error: error.message,
    });
  }
}
