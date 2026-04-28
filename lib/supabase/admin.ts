import "server-only";

import { createClient } from "@supabase/supabase-js";

/**
 * 서버 전용 — 서비스 롤로 RLS를 우회합니다.
 * - 비밀 키는 **반드시** `process.env.SUPABASE_SERVICE_ROLE_KEY` 만 사용합니다.
 * - `NEXT_PUBLIC_*` 로 서비스 키를 넣지 마세요(클라이언트 번들에 유출됨).
 * - 이 모듈은 `"server-only"` 이므로 Client Component에서 import 시 빌드가 실패합니다.
 * - URL은 공개 Supabase URL이므로 `NEXT_PUBLIC_SUPABASE_URL` 사용이 일반적입니다.
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
