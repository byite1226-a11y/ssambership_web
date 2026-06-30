"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/routeGuard";
import { createClient } from "@/lib/supabase/server";
import { setMentorSubscribeOpen } from "@/lib/mentor/mentorSubscribeOpen";

/**
 * 멘토 self "신규 구독 받기 / 그만 받기" 토글.
 * 본인 mentor_profiles 의 구독 받기 flag 만 갱신(다른 필드·정산·환불·cap 무관).
 * form 의 hidden input `open` = "true" | "false".
 */
export async function setMentorSubscribeOpenAction(formData: FormData): Promise<void> {
  const { user } = await requireRole("mentor");
  const supabase = await createClient();
  const open = String(formData.get("open") ?? "") === "true";
  await setMentorSubscribeOpen(supabase, user.id, open);
  revalidatePath("/mentor/mypage");
  revalidatePath("/mentor/profile");
  revalidatePath("/mentors");
}
