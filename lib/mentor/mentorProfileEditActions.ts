"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/routeGuard";
import { createClient } from "@/lib/supabase/server";
import { updateMentorProfile } from "@/lib/mentor/mentorProfileMutations";

const PATH = "/mentor/profile/edit";

function errQ(msg: string) {
  const q = new URLSearchParams();
  q.set("error", msg);
  return `${PATH}?${q.toString()}`;
}

export async function submitMentorProfileEdit(formData: FormData) {
  const { user } = await requireRole("mentor");
  const supabase = await createClient();

  const intro = String(formData.get("intro") ?? "").trim();
  const university = String(formData.get("university") ?? "").trim();
  const department = String(formData.get("department") ?? "").trim();
  const subjects = String(formData.get("subjects") ?? "").trim();
  const highSchool = String(formData.get("highSchool") ?? "").trim();
  const tags = String(formData.get("tags") ?? "").trim();
  const subscribeOpen = formData.get("subscribeOpen") === "on";

  const r = await updateMentorProfile(supabase, {
    userId: user.id,
    intro,
    university,
    department,
    subjects,
    highSchool,
    tags,
    subscribeOpen,
  });

  if (!r.ok) {
    redirect(errQ(r.error));
  }

  revalidatePath("/mentor/profile");
  revalidatePath(PATH);
  revalidatePath("/mentors");
  redirect(`${PATH}?ok=1`);
}
