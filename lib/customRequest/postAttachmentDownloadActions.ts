"use server";

import { redirect } from "next/navigation";
import { getServerUserWithProfile } from "@/lib/auth/getServerUserWithProfile";
import {
  POST_ATTACHMENT_STORAGE_BUCKET,
  validatePostAttachmentStoragePath,
} from "@/lib/customRequest/postAttachmentFiles";
import { createClient } from "@/lib/supabase/server";
import type { AppRole } from "@/lib/types/user";

type Row = Record<string, unknown>;

const SIGNED_URL_TTL_SEC = 600;

function postDetailPath(postId: string) {
  return `/custom-request/${encodeURIComponent(postId)}`;
}

/**
 * 의뢰 등록 첨부 다운로드(private bucket) — signed URL 리다이렉트.
 * RLS로 행·스토리지 접근이 이미 제한됨. 서버에서 로그인·역할 최소 확인.
 */
export async function downloadCustomRequestPostAttachmentAction(formData: FormData): Promise<void> {
  const postId = String(formData.get("postId") ?? "").trim();
  const attachmentId = String(formData.get("attachmentId") ?? "").trim();
  if (!postId || !attachmentId) {
    redirect("/custom-request?error=" + encodeURIComponent("다운로드 요청이 올바르지 않습니다."));
  }

  const { user, profile } = await getServerUserWithProfile();
  if (!user) {
    redirect("/login?next=" + encodeURIComponent(postDetailPath(postId)));
  }
  const role = profile?.role as AppRole | undefined;
  if (role !== "student" && role !== "mentor" && role !== "admin") {
    redirect(postDetailPath(postId) + "?error=" + encodeURIComponent("다운로드 권한이 없습니다."));
  }

  const supabase = await createClient();

  const { data: att, error: ae } = await supabase
    .from("custom_request_post_attachments")
    .select("storage_path, custom_request_post_id")
    .eq("id", attachmentId)
    .eq("custom_request_post_id", postId)
    .maybeSingle();
  if (ae || !att) {
    redirect(postDetailPath(postId) + "?error=" + encodeURIComponent("첨부를 찾을 수 없거나 권한이 없습니다."));
  }
  const r = att as Row;
  const path = typeof r.storage_path === "string" ? r.storage_path.trim() : "";
  if (!path || path.startsWith("http://") || path.startsWith("https://")) {
    redirect(postDetailPath(postId) + "?error=" + encodeURIComponent("연결된 파일이 없습니다."));
  }
  const pCheck = validatePostAttachmentStoragePath(path, postId);
  if (pCheck.ok === false) {
    redirect(postDetailPath(postId) + "?error=" + encodeURIComponent("저장소 경로를 확인할 수 없어 다운로드할 수 없습니다."));
  }

  const { data: signed, error: se } = await supabase.storage
    .from(POST_ATTACHMENT_STORAGE_BUCKET)
    .createSignedUrl(path, SIGNED_URL_TTL_SEC);
  if (se || !signed?.signedUrl) {
    redirect(
      postDetailPath(postId) +
        "?error=" +
        encodeURIComponent(se?.message ?? "다운로드 링크를 만들 수 없습니다. 잠시 후 다시 시도하세요.")
    );
  }
  redirect(signed.signedUrl);
}
