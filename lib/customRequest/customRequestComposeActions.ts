"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/routeGuard";
import { createClient } from "@/lib/supabase/server";
import { insertCustomRequestPost } from "@/lib/customRequest/customRequestMutations";

const NEW = "/custom-request/new";

function errRedirect(msg: string) {
  const qs = new URLSearchParams();
  qs.set("error", msg);
  return `${NEW}?${qs.toString()}`;
}

export async function submitCustomRequestNew(formData: FormData) {
  const { user } = await requireRole("student");
  const supabase = await createClient();

  const category = String(formData.get("category") ?? "").trim();
  const subject = String(formData.get("subject") ?? "").trim();
  const goal = String(formData.get("goal") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const deadline = String(formData.get("deadline") ?? "").trim();
  const budgetMin = String(formData.get("budgetMin") ?? "").trim();
  const budgetMax = String(formData.get("budgetMax") ?? "").trim();
  const deliverableFormat = String(formData.get("deliverableFormat") ?? "").trim();
  const agreed = formData.get("agreeProhibited") === "on" && formData.get("agreeNoExternal") === "on";

  if (!category || !subject || !body) {
    redirect(errRedirect("카테고리·과목(제목)·설명을 입력하세요."));
  }
  if (!agreed) {
    redirect(errRedirect("금지행위 동의·외부 연락 금지에 동의해 주세요."));
  }

  const r = await insertCustomRequestPost(supabase, {
    category,
    subject,
    goal,
    body,
    deadline,
    budgetMin,
    budgetMax,
    deliverableFormat,
    agreedProhibited: true,
    agreedNoExternalContact: true,
    authorId: user.id,
  });

  if (!r.ok) {
    redirect(errRedirect(r.error));
  }

  revalidatePath("/custom-request");
  revalidatePath(`/custom-request/${r.id}`);
  revalidatePath(`/custom-request/${r.id}/applications`, "page");
  redirect(`/custom-request/${r.id}/applications`);
}
