import type { PostgrestError, SupabaseClient } from "@supabase/supabase-js";

function isMissingColumnError(err: PostgrestError | null): boolean {
  if (!err) return false;
  return /column|does not exist|schema cache/i.test(err.message);
}

export type MentorProfileFormInput = {
  userId: string;
  intro: string;
  university: string;
  department: string;
  grade: string;
  subjects: string;
  highSchool: string;
  tags: string;
  subscribeOpen: boolean;
};

/**
 * 가입·sync 시 사용한 컬럼 + 확장 후보(마이그레이션과 맞춤)
 */
export async function updateMentorProfile(
  supabase: SupabaseClient,
  input: MentorProfileFormInput
): Promise<{ ok: true } | { ok: false; error: string }> {
  const subjects = input.subjects
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const tags = input.tags
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const now = new Date().toISOString();
  const core: Record<string, unknown> = {
    user_id: input.userId,
    intro_line: input.intro || null,
    university_name: input.university || null,
    department_name: input.department || null,
    teaching_subjects: subjects,
    high_school_name: input.highSchool || null,
    updated_at: now,
  };

  const { error: upErr } = await supabase.from("mentor_profiles").upsert(core, { onConflict: "user_id" });
  if (upErr) {
    return { ok: false, error: upErr.message };
  }

  const extras: Record<string, unknown>[] = [
    {
      tags: tags.join(", "),
      featured_tags: tags,
      accept_subscriptions: input.subscribeOpen,
      accepts_subscriptions: input.subscribeOpen,
      is_open_for_subscriptions: input.subscribeOpen,
      grade: input.grade || null,
      grade_level: input.grade || null,
      academic_year: input.grade || null,
    },
    { tags, featured_tags: tags.join(", ") },
    { grade: input.grade || null },
    { grade_level: input.grade || null },
  ];

  for (const patch of extras) {
    const { error } = await supabase.from("mentor_profiles").update({ ...patch, updated_at: now }).eq("user_id", input.userId);
    if (!error) {
      return { ok: true };
    }
    if (!isMissingColumnError(error)) {
      return { ok: false, error: error.message };
    }
  }

  return { ok: true };
}
