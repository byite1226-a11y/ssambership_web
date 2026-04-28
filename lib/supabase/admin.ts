import "server-only";

import { createClient } from "@supabase/supabase-js";

/**
 * 서버 전용 — `SUPABASE_SERVICE_ROLE_KEY`로 RLS를 우회합니다.
 * 브라우저·클라이언트 번들에 포함하지 마세요.
 */
export function createServiceRoleClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "createServiceRoleClient: NEXT_PUBLIC_SUPABASE_URL 또는 SUPABASE_SERVICE_ROLE_KEY가 없습니다. 서버 환경 변수를 설정하세요."
    );
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
