"use client";

import type { MentorPayoutsPageData } from "@/lib/mentor/mentorPayoutsService";
import { MentorPayoutsLeftSidebar } from "./MentorPayoutsLeftSidebar";
import { MentorPayoutsMain } from "./MentorPayoutsMain";
import { MentorPayoutsRightPanel } from "./MentorPayoutsRightPanel";

export function MentorPayoutsPage(props: { data: MentorPayoutsPageData }) {
  return (
    <div className="mx-auto max-w-[1440px] px-4 pb-16 pt-6">
      <div className="flex flex-col gap-6 xl:flex-row xl:items-start">
        <MentorPayoutsLeftSidebar
          summary={props.data.summary}
          schedule={props.data.schedule}
          revenueShare={props.data.revenueShare}
        />
        <MentorPayoutsMain data={props.data} />
        <MentorPayoutsRightPanel schedule={props.data.schedule} months={props.data.months} />
      </div>
    </div>
  );
}
