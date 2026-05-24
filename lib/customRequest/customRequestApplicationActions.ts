"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/routeGuard";
import { createClient } from "@/lib/supabase/server";
import { insertMentorApplication } from "@/lib/customRequest/customRequestMutations";
import { firstReadableCustomTable, pickDisplayField } from "@/lib/customRequest/customRequestQueries";
import {
  fetchUserDisplayName,
  insertNotificationBestEffort,
} from "@/lib/notifications/notificationInsert";

function back(postId: string, msg: string, returnContext: "mentor" | "public") {
  const qs = new URLSearchParams();
  qs.set("error", msg);
  if (returnContext === "mentor") {
    redirect(`/mentor/custom-request/posts/${postId}/apply?${qs.toString()}`);
  }
  redirect(`/custom-request/${postId}?${qs.toString()}`);
}

function onFailure(postId: string, code: string | undefined, returnContext: "mentor" | "public") {
  const userMsg = code === "ALREADY_APPLIED" 
    ? "이미 이 의뢰에 제출하신 지원이 있습니다. 중복 제출은 할 수 없습니다."
    : "잠시 후 다시 시도해 주세요.";
  back(postId, userMsg, returnContext);
}

export async function submitMentorCustomRequestApplication(formData: FormData) {
  const { user } = await requireRole("mentor");
  const supabase = await createClient();
  const returnContext: "mentor" | "public" = String(formData.get("returnContext") ?? "").trim() === "mentor" ? "mentor" : "public";
  const postId = String(formData.get("postId") ?? "").trim();
  if (!postId) {
    if (returnContext === "mentor") {
      redirect("/mentor/custom-request/posts");
    }
    redirect("/custom-request");
  }
  const proposedPrice = String(formData.get("proposedPrice") ?? "").trim();
  const deliveryAt = String(formData.get("deliveryAt") ?? "").trim();
  const coverNote = String(formData.get("coverNote") ?? "").trim();
  const extraAnswers = String(formData.get("extraAnswers") ?? "").trim();
  const scope = coverNote;

  if (!proposedPrice || !deliveryAt || !coverNote) {
    back(postId, "제안 가격, 예상 납기, 제안 내용을 모두 입력해 주세요.", returnContext);
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
    onFailure(postId, r.error, returnContext);
  }

  const pT = await firstReadableCustomTable(supabase, ["custom_request_posts", "request_posts"]);
  if (pT.table) {
    const { data: postRow } = await supabase.from(pT.table).select("*").eq("id", postId).maybeSingle();
    if (postRow) {
      const authorId = pickDisplayField(postRow as Record<string, unknown>, [
        "author_id",
        "student_id",
        "user_id",
        "requester_id",
        "client_id",
      ]);
      if (authorId && authorId !== "—") {
        const mentorName = await fetchUserDisplayName(supabase, user.id);
        await insertNotificationBestEffort({
          recipientUserId: authorId,
          type: "new_application",
          title: "새 지원서가 도착했어요",
          body: `${mentorName}님이 의뢰에 지원했습니다.`,
          link: `/custom-request/${encodeURIComponent(postId)}/applications/waiting`,
          metadata: { post_id: postId, mentor_id: user.id },
        });
      }
    }
  }

  revalidatePath("/custom-request");
  revalidatePath(`/custom-request/${postId}`);
  revalidatePath(`/custom-request/${postId}/applications`, "page");
  revalidatePath("/mentor/custom-request", "layout");
  revalidatePath("/mentor/custom-request/posts", "page");
  revalidatePath(`/mentor/custom-request/posts/${postId}`, "page");
  revalidatePath(`/mentor/custom-request/posts/${postId}/apply`, "page");

  if (returnContext === "mentor") {
    redirect(`/mentor/custom-request/posts/${postId}?submitted=1`);
  }
  redirect(`/custom-request/${postId}?ok=1`);
}
