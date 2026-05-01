import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { createServiceRoleClient } from "@/lib/supabase/admin";

/**
 * `mentor_profiles` 기본 RLS는 본인 행만이라, 관리자 콘솔 목록·집계는 서비스 롤 읽기를 우선합니다.
 * 키가 없으면 세션 클라이언트로 폴백합니다(로컬·스테이징).
 */
export function mentorProfilesAdminReadClient(sessionClient: SupabaseClient): SupabaseClient {
  try {
    return createServiceRoleClient();
  } catch {
    return sessionClient;
  }
}
