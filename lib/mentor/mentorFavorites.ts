import type { SupabaseClient } from "@supabase/supabase-js";

const TABLE = "favorites";
const MENTOR_PROFILES = "mentor_profiles";

/** mentor_profiles PK는 user_id (id 아님) */
async function mentorProfileExists(
  supabase: SupabaseClient,
  mentorUserId: string
): Promise<{ ok: boolean; error: string | null }> {
  const { data, error } = await supabase
    .from(MENTOR_PROFILES)
    .select("user_id")
    .eq("user_id", mentorUserId)
    .maybeSingle();
  if (error) {
    if (/does not exist|relation/i.test(error.message)) {
      return { ok: true, error: null };
    }
    return { ok: false, error: error.message };
  }
  return { ok: Boolean(data?.user_id), error: null };
}

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
  const exists = await mentorProfileExists(supabase, mentorId);
  if (exists.error) return { ok: false, error: exists.error };
  if (!exists.ok) return { ok: false, error: "멘토 프로필을 찾을 수 없습니다." };

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
