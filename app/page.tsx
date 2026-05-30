import { HomeLanding } from "@/components/landing/HomeLanding";
import { LandingLayout } from "@/components/landing/LandingLayout";
import { getServerUserWithProfile } from "@/lib/auth/getServerUserWithProfile";
import { loadHomeLandingData } from "@/lib/landing/landingPageQueries";
import { createClient } from "@/lib/supabase/server";

/**
 * 루트 랜딩(`/`) — 공개 랜딩 페이지.
 * 역할(student/mentor/admin)에 관계없이 동일한 랜딩을 노출한다.
 * (이전: 멘토는 `/mentor/mypage`로 자동 리다이렉트했으나, 로고 클릭 시
 * 공개 랜딩으로 돌아오지 못해 UX가 막혀 제거.)
 */
export default async function LandingPage() {
  const { user, profile } = await getServerUserWithProfile();
  const supabase = await createClient();
  const data = await loadHomeLandingData(supabase);

  return (
    <LandingLayout user={user} profile={profile}>
      <HomeLanding data={data} user={user} profile={profile} />
    </LandingLayout>
  );
}
