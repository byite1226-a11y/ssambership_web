"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/routeGuard";
import { createClient } from "@/lib/supabase/server";
import { insertMentorBoardPost, insertMentorShortformPost } from "@/lib/community/communityMutations";

const NEW_PATH = "/mentor/community/new";

function buildErrorRedirect(code: string) {
  const qs = new URLSearchParams();
  qs.set("error", code);
  return `${NEW_PATH}?${qs.toString()}`;
}

export async function submitMentorCommunityPost(formData: FormData) {
  const { user } = await requireRole("mentor");
  const supabase = await createClient();

  const postType = String(formData.get("postType") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const category = String(formData.get("category") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const source = String(formData.get("source") ?? "").trim();
  const rights = formData.get("rightsAck") === "on";

  if (postType !== "shortform" && postType !== "board") {
    redirect(buildErrorRedirect("invalid_target"));
  }
  if (!title || !body) {
    redirect(buildErrorRedirect("validation_fields"));
  }
  if (!source) {
    redirect(buildErrorRedirect("validation_source"));
  }
  if (!rights) {
    redirect(buildErrorRedirect("validation_rights"));
  }

  const input = { title, body, category, source };

  if (postType === "shortform") {
    const r = await insertMentorShortformPost(supabase, user.id, input);
    if (!r.ok) {
      console.error("[submitMentorCommunityPost] shortform insert failed", r.error);
      redirect(buildErrorRedirect("shortform_save"));
    }
    revalidatePath("/community/shorts");
    revalidatePath("/community/shortform");
    revalidatePath("/community");
    revalidatePath(`/community/shorts/${r.id}`);
    redirect(`/community/shorts/${r.id}`);
  }

  const r2 = await insertMentorBoardPost(supabase, user.id, input);
  if (!r2.ok) {
    console.error("[submitMentorCommunityPost] board insert failed", r2.error);
    redirect(buildErrorRedirect("board_save"));
  }
  revalidatePath("/community/board");
  revalidatePath("/community");
  revalidatePath(`/community/board/${r2.id}`);
  redirect(`/community/board/${r2.id}`);
}
