"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/routeGuard";
import { createClient } from "@/lib/supabase/server";
import {
  findOrderForPostAndStudent,
  isAuthorOfPost,
  loadApplicationById,
  loadCustomPostById,
  pickMentorIdFromApplication,
  verifyApplicationForPost,
} from "@/lib/customRequest/customRequestQueries";
import { insertCustomRequestOrder } from "@/lib/customRequest/customRequestMutations";

function backToApplications(postId: string, msg: string) {
  redirect(`/custom-request/${postId}/applications?error=${encodeURIComponent(msg)}`);
}

/**
 * 의뢰자(학생)가 지원 1건을 골라 custom_request_orders 1행 생성(결제/납품 후속).
 */
export async function selectMentorApplicationForOrder(formData: FormData) {
  const { user } = await requireRole("student");
  const supabase = await createClient();
  const postId = String(formData.get("postId") ?? "").trim();
  const applicationId = String(formData.get("applicationId") ?? "").trim();
  if (!postId || !applicationId) {
    redirect("/custom-request?error=" + encodeURIComponent("postId·applicationId가 필요합니다."));
  }

  const existing = await findOrderForPostAndStudent(supabase, postId, user.id);
  if (existing.orderId) {
    redirect(`/custom-request/orders/${existing.orderId}`);
  }

  const [post, app] = await Promise.all([loadCustomPostById(supabase, postId), loadApplicationById(supabase, applicationId)]);

  const authz = isAuthorOfPost(user.id, post.row);
  if (!authz.ok) {
    backToApplications(postId, "의뢰자(등록한 학생)만 멘토를 선택해 주문을 열 수 있습니다.");
  }
  if (!app.row) {
    backToApplications(postId, app.error ?? "지원서를 찾을 수 없습니다.");
    return;
  }
  const postMatch = verifyApplicationForPost(app.row, postId);
  if (!postMatch.ok) {
    backToApplications(postId, "이 지원서는 해당 의뢰에 속하지 않습니다.");
  }
  const mentor = pickMentorIdFromApplication(app.row!);
  if (!mentor) {
    backToApplications(postId, "지원서에 mentor 식별자가 없습니다.");
    return;
  }

  const r = await insertCustomRequestOrder(supabase, {
    postId,
    studentId: user.id,
    applicationId,
    mentorId: mentor,
  });
  if (r.ok) {
    revalidatePath("/custom-request");
    revalidatePath(`/custom-request/${postId}`);
    revalidatePath(`/custom-request/${postId}/applications`, "page");
    revalidatePath(`/custom-request/orders/${r.id}`);
    redirect(`/custom-request/orders/${r.id}`);
  }
  backToApplications(postId, r.error);
}
