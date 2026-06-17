import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { getServerUserWithProfile } from "@/lib/auth/getServerUserWithProfile";
import {
  findOrderForPostAndStudent,
  isAuthorOfPost,
  loadCustomPostById,
  type ApplicationAttachmentListItem,
} from "@/lib/customRequest/customRequestQueries";
import {
  APPLICATION_ATTACHMENT_STORAGE_BUCKET,
  validateApplicationAttachmentStoragePath,
} from "@/lib/customRequest/applicationAttachmentFiles";
import { isPreviewableImageMime } from "@/lib/customRequest/applicationAttachmentMime";
import { createSignedStorageUrl } from "@/lib/storage/signedStorageUrl";
import { createClient } from "@/lib/supabase/server";
import type { AppRole } from "@/lib/types/user";

type Row = Record<string, unknown>;

export const APPLICATION_ATTACHMENT_SIGNED_URL_TTL_SEC = 600;

export type ResolveApplicationAttachmentArgs = {
  postId: string;
  applicationId: string;
  attachmentId: string;
};

export type ApplicationAttachmentAccessFailure = {
  kind: "redirect";
  path: string;
};

export class ApplicationAttachmentAccessError extends Error {
  readonly failure: ApplicationAttachmentAccessFailure;

  constructor(failure: ApplicationAttachmentAccessFailure) {
    super(failure.path);
    this.failure = failure;
  }
}

function comparePagePath(postId: string) {
  return `/custom-request/${encodeURIComponent(postId)}/applications`;
}

export function applicationAttachmentAccessRedirectPath(
  postId: string,
  msg: string,
  loginNext?: string
): string {
  if (loginNext) {
    return `/login?next=${encodeURIComponent(loginNext)}`;
  }
  return comparePagePath(postId) + "?error=" + encodeURIComponent(msg);
}

type Viewer = { userId: string; role: AppRole };

function assertAppLevelAccess(viewer: Viewer, postId: string, postRow: Row | null, mentorId: string): void {
  const isStudentAuthor = viewer.role === "student" && isAuthorOfPost(viewer.userId, postRow).ok;
  const isMentorOwner = viewer.role === "mentor" && mentorId === viewer.userId;
  const isAdmin = viewer.role === "admin";
  if (!isStudentAuthor && !isMentorOwner && !isAdmin) {
    throw new ApplicationAttachmentAccessError({
      kind: "redirect",
      path: applicationAttachmentAccessRedirectPath(postId, "첨부를 다운로드할 권한이 없습니다."),
    });
  }
}

async function assertStudentCanPreviewAfterSelection(
  supabase: SupabaseClient,
  viewer: Viewer,
  postId: string,
  postRow: Row | null
): Promise<void> {
  if (viewer.role !== "student" || !isAuthorOfPost(viewer.userId, postRow).ok) {
    return;
  }
  const existing = await findOrderForPostAndStudent(supabase, postId, viewer.userId);
  if (existing.orderId) {
    return;
  }
  throw new ApplicationAttachmentAccessError({
    kind: "redirect",
    path: applicationAttachmentAccessRedirectPath(postId, "첨부 파일은 멘토 선택 후 확인할 수 있어요."),
  });
}

async function loadAttachmentStoragePath(
  supabase: SupabaseClient,
  postId: string,
  applicationId: string,
  attachmentId: string
): Promise<string> {
  const { data: att, error: ae } = await supabase
    .from("custom_request_application_attachments")
    .select("id, application_id, storage_path, original_filename")
    .eq("id", attachmentId)
    .eq("application_id", applicationId)
    .maybeSingle();
  if (ae || !att) {
    throw new ApplicationAttachmentAccessError({
      kind: "redirect",
      path: applicationAttachmentAccessRedirectPath(postId, "첨부를 찾을 수 없거나 권한이 없습니다."),
    });
  }
  const attRow = att as Row;
  const path = typeof attRow.storage_path === "string" ? attRow.storage_path.trim() : "";
  if (!path || path.startsWith("http://") || path.startsWith("https://")) {
    throw new ApplicationAttachmentAccessError({
      kind: "redirect",
      path: applicationAttachmentAccessRedirectPath(postId, "연결된 파일이 없습니다."),
    });
  }
  const pCheck = validateApplicationAttachmentStoragePath(path, applicationId);
  if (pCheck.ok === false) {
    throw new ApplicationAttachmentAccessError({
      kind: "redirect",
      path: applicationAttachmentAccessRedirectPath(postId, "저장소 경로를 확인할 수 없어 다운로드할 수 없습니다."),
    });
  }
  return path;
}

async function loadApplicationContext(
  supabase: SupabaseClient,
  postId: string,
  applicationId: string
): Promise<{ mentorId: string; postRow: Row | null }> {
  const { data: app, error: appErr } = await supabase
    .from("custom_request_applications")
    .select("mentor_id, post_id")
    .eq("id", applicationId)
    .maybeSingle();
  if (appErr || !app) {
    throw new ApplicationAttachmentAccessError({
      kind: "redirect",
      path: applicationAttachmentAccessRedirectPath(postId, "지원서를 찾을 수 없거나 권한이 없습니다."),
    });
  }
  const appRow = app as Row;
  const appPostId = appRow.post_id != null ? String(appRow.post_id) : "";
  if (appPostId !== postId) {
    throw new ApplicationAttachmentAccessError({
      kind: "redirect",
      path: applicationAttachmentAccessRedirectPath(postId, "의뢰와 지원서가 일치하지 않습니다."),
    });
  }
  const post = await loadCustomPostById(supabase, postId);
  const mentorId = appRow.mentor_id != null ? String(appRow.mentor_id) : "";
  return { mentorId, postRow: post.row };
}

async function signStoragePath(supabase: SupabaseClient, path: string, postId: string): Promise<string> {
  const { url, error } = await createSignedStorageUrl(
    supabase,
    APPLICATION_ATTACHMENT_STORAGE_BUCKET,
    path,
    APPLICATION_ATTACHMENT_SIGNED_URL_TTL_SEC
  );
  if (error || !url) {
    throw new ApplicationAttachmentAccessError({
      kind: "redirect",
      path: applicationAttachmentAccessRedirectPath(
        postId,
        error ?? "다운로드 링크를 만들 수 없습니다. 잠시 후 다시 시도하세요."
      ),
    });
  }
  return url;
}

export async function resolveApplicationAttachmentSignedUrlWithViewer(
  supabase: SupabaseClient,
  viewer: Viewer,
  args: ResolveApplicationAttachmentArgs
): Promise<string> {
  const { postId, applicationId, attachmentId } = args;
  if (!postId || !applicationId || !attachmentId) {
    throw new ApplicationAttachmentAccessError({
      kind: "redirect",
      path: "/custom-request?error=" + encodeURIComponent("다운로드 요청이 올바르지 않습니다."),
    });
  }
  if (viewer.role !== "student" && viewer.role !== "mentor" && viewer.role !== "admin") {
    throw new ApplicationAttachmentAccessError({
      kind: "redirect",
      path: applicationAttachmentAccessRedirectPath(postId, "다운로드 권한이 없습니다."),
    });
  }

  const path = await loadAttachmentStoragePath(supabase, postId, applicationId, attachmentId);
  const { mentorId, postRow } = await loadApplicationContext(supabase, postId, applicationId);
  assertAppLevelAccess(viewer, postId, postRow, mentorId);
  await assertStudentCanPreviewAfterSelection(supabase, viewer, postId, postRow);
  return signStoragePath(supabase, path, postId);
}

export async function resolveApplicationAttachmentSignedUrl(
  args: ResolveApplicationAttachmentArgs
): Promise<{ url: string }> {
  const { postId, applicationId, attachmentId } = args;
  if (!postId || !applicationId || !attachmentId) {
    throw new ApplicationAttachmentAccessError({
      kind: "redirect",
      path: "/custom-request?error=" + encodeURIComponent("다운로드 요청이 올바르지 않습니다."),
    });
  }

  const { user, profile } = await getServerUserWithProfile();
  if (!user) {
    throw new ApplicationAttachmentAccessError({
      kind: "redirect",
      path: applicationAttachmentAccessRedirectPath(postId, "", comparePagePath(postId)),
    });
  }
  const role = profile?.role as AppRole | undefined;
  if (role !== "student" && role !== "mentor" && role !== "admin") {
    throw new ApplicationAttachmentAccessError({
      kind: "redirect",
      path: applicationAttachmentAccessRedirectPath(postId, "다운로드 권한이 없습니다."),
    });
  }

  const supabase = await createClient();
  const url = await resolveApplicationAttachmentSignedUrlWithViewer(
    supabase,
    { userId: user.id, role },
    args
  );
  return { url };
}

/** SSR 썸네일 — 이미지 첨부만, 다운로드와 동일 권한 검사 후 배치 서명 */
export async function batchSignApplicationAttachmentImageThumbUrls(
  supabase: SupabaseClient,
  viewer: Viewer,
  postId: string,
  attachments: ApplicationAttachmentListItem[]
): Promise<Record<string, string>> {
  const out: Record<string, string> = {};
  for (const att of attachments) {
    if (!isPreviewableImageMime(att.mime_type, att.original_filename)) continue;
    try {
      out[att.id] = await resolveApplicationAttachmentSignedUrlWithViewer(supabase, viewer, {
        postId,
        applicationId: att.application_id,
        attachmentId: att.id,
      });
    } catch {
      /* RLS/권한 없으면 썸네일 생략 */
    }
  }
  return out;
}
