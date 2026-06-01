"use client";

import type { CommunityPopularMentor } from "@/components/community/CommunityNavTypes";

export function CommunityRightSidebar(props: { weeklyTopMentor?: CommunityPopularMentor | null }) {
  return (
    <aside className="hidden" aria-hidden data-weekly-mentor-id={props.weeklyTopMentor?.id ?? ""} />
  );
}
