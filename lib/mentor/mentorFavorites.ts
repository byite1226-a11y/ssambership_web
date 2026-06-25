import type { SupabaseClient } from "@supabase/supabase-js";

const TABLE = "favorites";

export async function loadFavoriteMentorIdsForUser(
  supabase: SupabaseClient,
  userId: string
): Promise<{ ids: Set<string>; error: string | null }> {
  const { data, error } = await supabase.from(TABLE).select("mentor_id").eq("user_id", userId);
  if (error) {
    if (/does not exist|relation/i.test(error.message)) {
      return { ids: new Set(), error: null };
    }
    return { ids: new Set(), error: error.message };
  }
  const ids = new Set<string>();
  for (const row of data ?? []) {
    const mid = (row as { mentor_id?: string }).mentor_id;
    if (mid) ids.add(String(mid));
  }
  return { ids, error: null };
}

export async function addMentorFavorite(
  supabase: SupabaseClient,
  userId: string,
  mentorId: string
): Promise<{ ok: boolean; error: string | null }> {
  // mentor_profiles 사전검사 제거: 해당 select는 mentor_select_own RLS(본인 행만)에 막혀
  // 학생이 멘토를 찜할 때 항상 0행→500이 났다. favorites.mentor_id FK(users)가 무결성 보장.
  const { error } = await supabase.from(TABLE).insert({ user_id: userId, mentor_id: mentorId });
  if (error) {
    if (/duplicate|unique/i.test(error.message)) return { ok: true, error: null };
    return { ok: false, error: error.message };
  }
  return { ok: true, error: null };
}

export async function removeMentorFavorite(
  supabase: SupabaseClient,
  userId: string,
  mentorId: string
): Promise<{ ok: boolean; error: string | null }> {
  const { error } = await supabase.from(TABLE).delete().eq("user_id", userId).eq("mentor_id", mentorId);
  if (error) return { ok: false, error: error.message };
  return { ok: true, error: null };
}
