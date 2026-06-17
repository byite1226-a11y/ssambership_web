import "server-only";

import { randomUUID } from "crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createSignedStorageUrl } from "@/lib/storage/signedStorageUrl";

export const INDIVIDUAL_QUESTION_ATTACHMENTS_BUCKET = "individual-question-attachments";

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

function safeObjectName(name: string, mime: string): string {
  const safe = name.replace(/[^\w.\-]+/g, "_").slice(0, 80) || "file";
  const hasExt = /\.[a-z0-9]{1,8}$/i.test(safe);
  const ext =
    mime === "image/png"
      ? "png"
      : mime === "image/webp"
        ? "webp"
        : mime === "image/gif"
          ? "gif"
          : mime === "image/jpeg"
            ? "jpg"
            : "";
  return hasExt || !ext ? safe : `${safe}.${ext}`;
}

function buildObjectPath(questionId: string, mime: string, originalName: string): string {
  return `${questionId}/${randomUUID()}-${safeObjectName(originalName, mime)}`;
}

export function fileHasContent(file: File | null | undefined): file is File {
  return Boolean(file && file.size > 0 && file.name);
}

export async function uploadIndividualQuestionAttachment(
  supabase: SupabaseClient,
  params: {
    questionId: string;
    messageId: string | null;
    file: File;
  }
): Promise<{ ok: true; path: string } | { ok: false; error: string }> {
  const mime = params.file.type || "application/octet-stream";
  if (!ALLOWED_MIME.has(mime)) {
    return { ok: false, error: "지원하지 않는 파일 형식입니다." };
  }
  if (params.file.size > MAX_BYTES) {
    return { ok: false, error: "첨부 파일은 20MB 이하로 올려 주세요." };
  }

  const buffer = Buffer.from(await params.file.arrayBuffer());
  const path = buildObjectPath(params.questionId, mime, params.file.name);
  const { error: uploadError } = await supabase.storage
    .from(INDIVIDUAL_QUESTION_ATTACHMENTS_BUCKET)
    .upload(path, buffer, { contentType: mime, upsert: false });

  if (uploadError) {
    return { ok: false, error: uploadError.message };
  }

  const { error: insertError } = await supabase.from("individual_question_attachments").insert({
    question_id: params.questionId,
    message_id: params.messageId,
    storage_path: path,
    file_name: params.file.name,
    mime_type: mime,
  });

  if (insertError) {
    return { ok: false, error: insertError.message };
  }

  return { ok: true, path };
}

export async function signIndividualQuestionAttachment(
  supabase: SupabaseClient,
  storagePath: string
): Promise<string | null> {
  const signed = await createSignedStorageUrl(supabase, INDIVIDUAL_QUESTION_ATTACHMENTS_BUCKET, storagePath, 60 * 10);
  return signed.url;
}
