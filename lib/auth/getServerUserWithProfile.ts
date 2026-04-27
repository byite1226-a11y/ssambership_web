import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { getServerAuthUser } from "@/lib/auth/getCurrentUser";
import { getUserProfileById } from "@/lib/auth/getCurrentProfile";
import type { UserRow } from "@/lib/types/user";
import type { User } from "@supabase/supabase-js";

/**
 * 서버에서 쿠키 기준 로그인된 사용자 + public.users 프로필
 * 보호 라우트(서버 컴포넌트/middleware)에서 import — Client 컴포넌트에 직접 import 금지
 * 동일 RSC 요청에서 (public) layout + page가 모두 호출해도 1회만 조회(React cache).
 */
export const getServerUserWithProfile = cache(async function getServerUserWithProfile(): Promise<{
  user: User | null;
  profile: UserRow | null;
  error: Error | null;
}> {
  const { user, error: authError } = await getServerAuthUser();
  if (authError) {
    return { user: null, profile: null, error: authError };
  }
  if (!user) {
    return { user: null, profile: null, error: null };
  }
  const supabase = await createClient();
  const { data, error: profileError } = await getUserProfileById(supabase, user.id);
  if (profileError) {
    return { user, profile: null, error: profileError };
  }
  return { user, profile: data, error: null };
});
