"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getServerAuthUser } from "@/lib/auth/getCurrentUser";
import { createClient } from "@/lib/supabase/server";
import { insertCommunityComment } from "@/lib/community/communityMutations";
import { getUserProfileById } from "@/lib/auth/getCurrentProfile";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function buildCommentRedirect(path: string, err: string) {
  const q = new URLSearchParams();
  q.set("commentError", err);
  return `${path}?${q.toString()}`;
}

export async function submitCommunityCommentAction(formData: FormData) {
  const postType = String(formData.get("postType") ?? "").trim();
  const postId = String(formData.get("postId") ?? "").trim();
  const body = String(formData.get("body") ?? "");
  const returnPath = String(formData.get("returnPath") ?? "").trim();

  const { user } = await getServerAuthUser();
  if (!user) {
    if (returnPath.startsWith("/")) {
      redirect(`/login?next=${encodeURIComponent(returnPath)}`);
    }
    redirect("/login");
  }

  if (postType !== "board" && postType !== "shortform") {
    redirect(buildCommentRedirect(returnPath || "/community", "invalid"));
  }
  if (!UUID_RE.test(postId)) {
    redirect(buildCommentRedirect(returnPath || "/community", "invalid"));
  }
  if (!returnPath.startsWith("/")) {
    redirect("/community");
  }

  const t = body.trim();
  if (t.length < 1 || t.length > 1000) {
    redirect(buildCommentRedirect(returnPath, "length"));
  }

  const supabase = await createClient();
  const { data: profile } = await getUserProfileById(supabase, user.id);
  const authorLabel = (() => {
    const n = profile?.nickname?.trim();
    const f = profile?.full_name?.trim();
    if (n) return n;
    if (f) return f;
    return "쌤버십 회원";
  })();

  const r = await insertCommunityComment(supabase, user.id, {
    postType,
    postId,
    body: t,
    authorLabel,
  });

  if (!r.ok) {
    if (r.error === "validation") {
      redirect(buildCommentRedirect(returnPath, "length"));
    }
    redirect(buildCommentRedirect(returnPath, "save"));
  }

  if (postType === "board") {
    revalidatePath("/community/board");
    revalidatePath(`/community/board/${postId}`);
  } else {
    revalidatePath("/community/shorts");
    revalidatePath(`/community/shorts/${postId}`);
  }
  revalidatePath("/community");

  redirect(returnPath);
}
