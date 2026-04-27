"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/routeGuard";
import { createClient } from "@/lib/supabase/server";
import { insertMentorApplication } from "@/lib/customRequest/customRequestMutations";

function back(postId: string, msg: string) {
  const qs = new URLSearchParams();
  qs.set("error", msg);
  redirect(`/custom-request/${postId}?${qs.toString()}`);
}

export async function submitMentorCustomRequestApplication(formData: FormData) {
  const { user } = await requireRole("mentor");
  const supabase = await createClient();
  const postId = String(formData.get("postId") ?? "").trim();
  if (!postId) {
    redirect("/custom-request?error=" + encodeURIComponent("postId 없음"));
  }
  const proposedPrice = String(formData.get("proposedPrice") ?? "").trim();
  const deliveryAt = String(formData.get("deliveryAt") ?? "").trim();
  const scope = String(formData.get("scope") ?? "").trim();
  const coverNote = String(formData.get("coverNote") ?? "").trim();
  const extraAnswers = String(formData.get("extraAnswers") ?? "").trim();

  if (!proposedPrice || !scope || !coverNote) {
    back(postId, "제안 가격·제공 범위·커버노트는 필수입니다.");
  }

  const r = await insertMentorApplication(supabase, {
    postId,
    mentorId: user.id,
    proposedPrice,
    deliveryAt,
    scope,
    coverNote,
    extraAnswers,
  });
  if (!r.ok) {
    back(postId, r.error);
  }

  revalidatePath("/custom-request");
  revalidatePath(`/custom-request/${postId}`);
  revalidatePath(`/custom-request/${postId}/applications`, "page");
  redirect(`/custom-request/${postId}?ok=1`);
}
