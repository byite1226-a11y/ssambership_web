import { createClient } from "@/lib/supabase/server";
import type { User } from "@supabase/supabase-js";

/**
 * 서버(서버 컴포넌트·Route·보호 라우트)에서 현재 auth 사용자 조회
 */
export async function getServerAuthUser(): Promise<{
  user: User | null;
  error: Error | null;
}> {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error) {
    return { user: null, error: new Error(error.message) };
  }
  return { user: data.user, error: null };
}
