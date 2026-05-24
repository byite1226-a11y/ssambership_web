"use client";

import type { HomeLandingData } from "@/lib/landing/landingPageQueries";
import type { UserRow } from "@/lib/types/user";
import type { User } from "@supabase/supabase-js";
import { PublicGuestLanding } from "@/components/landing/PublicGuestLanding";
import { DashboardStatsSection } from "@/components/landing/DashboardStatsSection";
import { RecommendedMentorsSection } from "@/components/landing/RecommendedMentorsSection";
import { DashboardActivitySection } from "@/components/landing/DashboardActivitySection";

export function HomeLanding(props: {
  data: HomeLandingData;
  user: User | null;
  profile: UserRow | null;
}) {
  const logged = Boolean(props.user);

  if (!logged) {
    return <PublicGuestLanding stats={props.data.publicStats} />;
  }

  return (
    <div className="pb-12">
      <DashboardStatsSection profile={props.profile} />
      <RecommendedMentorsSection data={props.data.mentors} />
      <DashboardActivitySection />
    </div>
  );
}
