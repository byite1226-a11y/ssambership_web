"use server";

import {
  ApplicationAttachmentAccessError,
  applicationAttachmentAccessRedirectPath,
  resolveApplicationAttachmentSignedUrl,
  type ResolveApplicationAttachmentArgs,
} from "@/lib/customRequest/applicationAttachmentAccess";

/** 라이트박스·PDF 새 탭 — 다운로드와 동일 인증, URL만 반환 */
export async function getApplicationAttachmentPreviewUrlAction(
  args: ResolveApplicationAttachmentArgs
): Promise<{ url: string }> {
  try {
    return await resolveApplicationAttachmentSignedUrl(args);
  } catch (err) {
    if (err instanceof ApplicationAttachmentAccessError) {
      throw new Error(applicationAttachmentAccessRedirectPath(args.postId, "미리보기 권한이 없습니다."));
    }
    throw err;
  }
}
