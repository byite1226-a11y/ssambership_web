import type { SupabaseClient } from "@supabase/supabase-js";
import { randomUUID } from "crypto";
import { createSignedStorageUrl } from "@/lib/storage/signedStorageUrl";

export { buildAttachmentMessageBody, parseAttachmentMessageBody } from "@/lib/qna/questionRoomAttachmentDisplay";
export type { ParsedAttachment } from "@/lib/qna/questionRoomAttachmentDisplay";

export const QUESTION_ROOM_ATTACHMENTS_BUCKET = "question-room-attachments";

const ALLOWED_MIME = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
  "application/pdf",
  "application/zip",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
]);

const MAX_BYTES = 20 * 1024 * 1024;

function buildObjectPath(roomId: string, threadId: string, mime: string, originalName: string): string {
  const safe = originalName.replace(/[^\w.\-]+/g, "_").slice(0, 60) || "file";
  const hasExt = /\.[a-z0-9]{1,8}$/i.test(safe);
  const ext = mime === "image/png" ? "png" : mime === "image/webp" ? "webp" : mime === "image/gif" ? "gif" : mime === "image/jpeg" ? "jpg" : "";
  const name = hasExt || !ext ? safe : `${safe}.${ext}`;
  return `${roomId}/${threadId}/${randomUUID()}-${name}`;
}

/**
 * 질문방 첨부를 private 버킷에 업로드하고 서명 URL을 반환. (서버 액션에서만 호출)
 */
export async function uploadQuestionRoomAttachment(
  supabase: SupabaseClient,
  params: { roomId: string; threadId: string; buffer: Buffer; mime: string; name: string }
): Promise<{ url: string | null; isImage: boolean; filename: string; error: string | null }> {
  const { roomId, threadId, buffer, mime, name } = params;
  const isImage = mime.startsWith("image/");
  if (!ALLOWED_MIME.has(mime)) {
    return { url: null, isImage, filename: name, error: "지원하지 않는 파일 형식입니다." };
  }
  if (buffer.length > MAX_BYTES) {
    return { url: null, isImage, filename: name, error: "파일은 20MB 이하로 올려주세요." };
  }
  const path = buildObjectPath(roomId, threadId, mime, name);
  const { error: upErr } = await supabase.storage
    .from(QUESTION_ROOM_ATTACHMENTS_BUCKET)
    .upload(path, buffer, { contentType: mime, upsert: false });
  if (upErr) return { url: null, isImage, filename: name, error: upErr.message };

  const signed = await createSignedStorageUrl(supabase, QUESTION_ROOM_ATTACHMENTS_BUCKET, path);
  if (signed.error || !signed.url) {
    return { url: null, isImage, filename: name, error: signed.error ?? "서명 URL 발급 실패" };
  }
  return { url: signed.url, isImage, filename: name, error: null };
}
