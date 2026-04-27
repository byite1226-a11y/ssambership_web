import type { UserRow } from "@/lib/types/user";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Supabase Client + userId로 public.users 한 줄 조회 (서버/클라이언트 공용)
 * createClient()는 lib/supabase/client.ts(브라우저) 또는 server.ts(서버)에서 전달
 */
export async function getUserProfileById(
  supabase: SupabaseClient,
  userId: string
): Promise<{ data: UserRow | null; error: Error | null }> {
  const { data, error } = await supabase
    .from("users")
    .select(
      "id, role, status, full_name, nickname, email, grade_level, student_status, birth_date, terms_agreed_at, privacy_agreed_at, marketing_agreed, created_at, updated_at"
    )
    .eq("id", userId)
    .maybeSingle();
  if (error) {
    return { data: null, error: new Error(error.message) };
  }
  return { data: data as UserRow | null, error: null };
}
