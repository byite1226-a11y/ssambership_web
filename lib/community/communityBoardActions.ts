"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getServerAuthUser } from "@/lib/auth/getCurrentUser";
import { getUserProfileById } from "@/lib/auth/getCurrentProfile";
import { createClient } from "@/lib/supabase/server";
import {
  COMMUNITY_HASHTAG_MAX,
  COMMUNITY_IMAGE_MAX,
  normalizeCommunityPostCategory,
} from "@/lib/community/communityBoardConstants";
import {
  insertBoardComment,
  insertCommunityBoardPost,
  softDeleteBoardComment,
  togglePostReaction,
} from "@/lib/community/communityBoardMutations";
import { uploadCommunityPostImages } from "@/lib/community/communityStorage";
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function parseHashtags(raw: string): string[] {
  return raw
    .split(/[,\s#]+/)
    .map((t) => t.trim())
    .filter(Boolean)
    .slice(0, COMMUNITY_HASHTAG_MAX);
}

async function authorLabelFor(userId: string): Promise<{ label: string; role: string | null }> {
  const supabase = await createClient();
  const { data: profile } = await getUserProfileById(supabase, userId);
  const label = profile?.nickname?.trim() || profile?.full_name?.trim() || "\uC37C\uBC84\uC2ED \uD68C\uC6D0";
  const role = profile?.role === "mentor" ? "\uBA58\uD1A0" : profile?.role === "student" ? "\uD559\uC0DD" : null;
  return { label, role };
}

function errRedirect(path: string, code: string) {
  return `${path}?error=${encodeURIComponent(code)}`;
}

export async function submitCommunityBoardPostAction(formData: FormData) {
  const { user } = await getServerAuthUser();
  if (!user) redirect(`/login?next=${encodeURIComponent("/community/new")}`);

  const intent = String(formData.get("intent") ?? "publish");
  const status = intent === "draft" ? "draft" : "published";
  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const category = normalizeCommunityPostCategory(String(formData.get("category") ?? "free"));
  const hashtags = parseHashtags(String(formData.get("hashtags") ?? ""));

  if (!title) redirect(errRedirect("/community/new", "title"));
  if (body.length < 10 && status === "published") redirect(errRedirect("/community/new", "body"));

  const supabase = await createClient();
  const imageUrls: string[] = [];
  const files = formData.getAll("images").filter((f): f is File => f instanceof File && f.size > 0);
  if (files.length > COMMUNITY_IMAGE_MAX) redirect(errRedirect("/community/new", "images"));

  if (files.length) {
    const buffers = await Promise.all(
      files.slice(0, COMMUNITY_IMAGE_MAX).map(async (f) => ({
        buffer: Buffer.from(await f.arrayBuffer()),
        mime: (f.type || "image/jpeg").toLowerCase(),
        name: f.name || "image",
      }))
    );
    const up = await uploadCommunityPostImages(supabase, user.id, buffers);
    if (up.error) redirect(errRedirect("/community/new", "upload"));
    imageUrls.push(...up.urls);
  }

  const { label, role } = await authorLabelFor(user.id);
  const r = await insertCommunityBoardPost(supabase, user.id, {
    title,
    body,
    category,
    imageUrls,
    hashtags,
    status,
    authorLabel: label,
    authorRole: role,
  });

  if (!r.ok) redirect(errRedirect("/community/new", r.error));

  revalidatePath("/community");
  revalidatePath("/community/board");
  if (status === "published") redirect(`/community/board/${r.id}`);
  redirect(`/community/new?draft=1`);
}

export async function toggleCommunityPostReactionAction(formData: FormData) {
  const postId = String(formData.get("postId") ?? "").trim();
  const type = String(formData.get("type") ?? "") as "like" | "scrap";
  const returnPath = String(formData.get("returnPath") ?? "/community").trim();

  const { user } = await getServerAuthUser();
  if (!user) {
    redirect(`/login?next=${encodeURIComponent(returnPath)}`);
  }
  if (!UUID_RE.test(postId) || (type !== "like" && type !== "scrap")) {
    redirect(returnPath.startsWith("/") ? returnPath : "/community");
  }

  const supabase = await createClient();
  await togglePostReaction(supabase, user.id, postId, type);

  revalidatePath(returnPath);
  revalidatePath(`/community/board/${postId}`);
  revalidatePath("/community");
  redirect(returnPath);
}

export async function submitBoardCommentAction(formData: FormData) {
  const postId = String(formData.get("postId") ?? "").trim();
  const parentId = String(formData.get("parentId") ?? "").trim() || null;
  const content = String(formData.get("content") ?? "");
  const returnPath = String(formData.get("returnPath") ?? "").trim();

  const { user } = await getServerAuthUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(returnPath)}`);

  if (!UUID_RE.test(postId) || !returnPath.startsWith("/")) redirect("/community");

  const { label } = await authorLabelFor(user.id);
  const supabase = await createClient();
  const r = await insertBoardComment(supabase, user.id, {
    postId,
    parentId: parentId && UUID_RE.test(parentId) ? parentId : null,
    content,
    authorLabel: label,
  });

  if (!r.ok) {
    const q = new URLSearchParams();
    q.set("commentError", r.error);
    redirect(`${returnPath}?${q.toString()}`);
  }

  revalidatePath(`/community/board/${postId}`);
  revalidatePath("/community");
  redirect(returnPath);
}

export async function deleteBoardCommentAction(formData: FormData) {
  const commentId = String(formData.get("commentId") ?? "").trim();
  const returnPath = String(formData.get("returnPath") ?? "").trim();
  const { user } = await getServerAuthUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(returnPath)}`);
  if (!UUID_RE.test(commentId)) redirect(returnPath);

  const supabase = await createClient();
  await softDeleteBoardComment(supabase, user.id, commentId);
  revalidatePath(returnPath);
  redirect(returnPath);
}
