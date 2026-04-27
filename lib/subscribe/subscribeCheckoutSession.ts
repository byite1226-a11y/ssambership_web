import { getServerUserWithProfile } from "@/lib/auth/getServerUserWithProfile";
import { createClient } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";

export type SubscribeSessionResult =
  | { ok: true; studentId: string; supabase: SupabaseClient }
  | { ok: false; status: 401 | 403; error: string; code: "auth" };

/**
 * 구독 결제 intent/complete — 학생 세션 + RLS에 맞는 Supabase 클라이언트
 */
export async function getStudentSupabaseForSubscribe(): Promise<SubscribeSessionResult> {
  const { user, profile, error } = await getServerUserWithProfile();
  if (error || !user) {
    return { ok: false, status: 401, error: "로그인이 필요합니다.", code: "auth" };
  }
  if (profile?.role !== "student") {
    return { ok: false, status: 403, error: "학생 계정만 구독 결제를 진행할 수 있습니다.", code: "auth" };
  }
  const supabase = await createClient();
  return { ok: true, studentId: user.id, supabase };
}
