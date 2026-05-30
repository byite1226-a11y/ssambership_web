"use client";

import type { HomeLandingData } from "@/lib/landing/landingPageQueries";
import type { UserRow } from "@/lib/types/user";
import type { User } from "@supabase/supabase-js";
import { PublicGuestLanding } from "@/components/landing/PublicGuestLanding";
import { DashboardStatsSection } from "@/components/landing/DashboardStatsSection";
import { RecommendedMentorsSection } from "@/components/landing/RecommendedMentorsSection";
import { DashboardActivitySection } from "@/components/landing/DashboardActivitySection";

const MENTOR_HERO_CTAS = {
  primary: { href: "/mentor/question-room", label: "질문방 바로가기" },
  secondary: { href: "/mentor/custom-request/dashboard", label: "맞춤의뢰 관리" },
} as const;

export function HomeLanding(props: {
  data: HomeLandingData;
  user: User | null;
  profile: UserRow | null;
}) {
  const logged = Boolean(props.user);
  const isMentor = logged && props.profile?.role === "mentor";

  // 비로그인: 공개 랜딩
  if (!logged) {
    return <PublicGuestLanding stats={props.data.publicStats} />;
  }

  // 멘토 로그인: 공개 랜딩과 동일 레이아웃 + CTA만 멘토용
  if (isMentor) {
    return <PublicGuestLanding stats={props.data.publicStats} heroCtas={MENTOR_HERO_CTAS} />;
  }

  // 학생·관리자 로그인: 기존 대시보드 섹션 유지
  return (
    <div className="pb-12">
      <DashboardStatsSection profile={props.profile} />
      <RecommendedMentorsSection data={props.data.mentors} />
      <DashboardActivitySection />
    </div>
  );
}
