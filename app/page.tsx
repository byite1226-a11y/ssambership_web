import { redirect } from "next/navigation";
import { HomeLanding } from "@/components/landing/HomeLanding";
import { LandingLayout } from "@/components/landing/LandingLayout";
import { getPostLoginPath } from "@/lib/auth/getPostLoginPath";
import { getServerUserWithProfile } from "@/lib/auth/getServerUserWithProfile";
import { loadHomeLandingData } from "@/lib/landing/landingPageQueries";
import { createClient } from "@/lib/supabase/server";

/**
 * 루트 랜딩(`/`) — 비로그인 게스트 전용.
 * 로그인 사용자는 역할별 홈으로 redirect(로고 클릭·직접 접속 모두 동일).
 */
export default async function LandingPage() {
  const { user, profile } = await getServerUserWithProfile();
  if (user && profile?.role) {
    redirect(getPostLoginPath(profile.role));
  }
  const supabase = await createClient();
  const data = await loadHomeLandingData(supabase);

  return (
    <LandingLayout user={user} profile={profile}>
      <HomeLanding data={data} user={user} profile={profile} />
    </LandingLayout>
  );
}
