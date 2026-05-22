/** 클라이언트·서버 공용 — `postAttachmentFiles.ts`(server-only)와 분리 */

export const POST_ATTACHMENT_STORAGE_BUCKET = "custom-request-post-attachments" as const;

export const POST_ATTACHMENT_MAX_FILE_BYTES = 50 * 1024 * 1024;
export const POST_ATTACHMENT_MAX_FILES = 3;
