import type { ReactNode } from "react";
import type { CommunityPopularMentor, CommunityNavActive } from "@/components/community/CommunityNavTypes";
import { CommunityLeftSidebar } from "@/components/community/CommunityLeftSidebar";
import { CommunityRightSidebar } from "@/components/community/CommunityRightSidebar";

type Props = {
  activeNav: CommunityNavActive;
  children: ReactNode;
  weeklyTopMentor?: CommunityPopularMentor | null;
  /** @deprecated hero slot */
  hero?: ReactNode;
};

export function CommunityLayoutShell(props: Props) {
  return (
    <div className="min-h-[60vh] pb-20 pt-6">
      <div className="mx-auto w-full max-w-[1280px] px-4 sm:px-6">
        <div className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)_280px] lg:items-start">
          <CommunityLeftSidebar active={props.activeNav} />
          <main className="min-w-0 space-y-4">
            {props.hero}
            {props.children}
          </main>
          <CommunityRightSidebar weeklyTopMentor={props.weeklyTopMentor} />
        </div>
      </div>
    </div>
  );
}
