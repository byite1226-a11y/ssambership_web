/** 클라이언트·서버 공용 — `applicationAttachmentFiles.ts`(server-only)와 분리 */

export const APPLICATION_ATTACHMENT_STORAGE_BUCKET = "custom-request-application-attachments" as const;

export const APPLICATION_ATTACHMENT_MAX_FILE_BYTES = 20 * 1024 * 1024;
export const APPLICATION_ATTACHMENT_MAX_FILES = 40;

/** post 의뢰 등록 첨부와 동일 accept (zip은 서버 MIME 검증으로 허용) */
export const APPLICATION_ATTACHMENT_ACCEPT =
  "application/pdf,image/png,image/jpeg,image/webp,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.presentationml.presentation";
