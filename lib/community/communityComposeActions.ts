"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/routeGuard";
import { createClient } from "@/lib/supabase/server";
import { insertMentorBoardPost, insertMentorShortformPost } from "@/lib/community/communityMutations";

const NEW_PATH = "/mentor/community/new";

function buildErrorRedirect(message: string) {
  const qs = new URLSearchParams();
  qs.set("error", message);
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
    redirect(buildErrorRedirect("작성 대상(숏폼 / 게시판)을 선택하세요."));
  }
  if (!title || !body) {
    redirect(buildErrorRedirect("제목과 본문을 입력하세요."));
  }
  if (!source) {
    redirect(buildErrorRedirect("출처(attribution)를 입력하세요."));
  }
  if (!rights) {
    redirect(buildErrorRedirect("권리·정당한 이용 확인에 동의해 주세요."));
  }

  const input = { title, body, category, source };

  if (postType === "shortform") {
    const r = await insertMentorShortformPost(supabase, user.id, input);
    if (!r.ok) {
      redirect(buildErrorRedirect(`shortform: ${r.error}`));
    }
    revalidatePath("/community/shorts");
    revalidatePath("/community");
    revalidatePath(`/community/shorts/${r.id}`);
    redirect(`/community/shorts/${r.id}`);
  }

  const r2 = await insertMentorBoardPost(supabase, user.id, input);
  if (!r2.ok) {
    redirect(buildErrorRedirect(`board: ${r2.error}`));
  }
  revalidatePath("/community/board");
  revalidatePath("/community");
  revalidatePath(`/community/board/${r2.id}`);
  redirect(`/community/board/${r2.id}`);
}
