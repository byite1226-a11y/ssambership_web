import type { ReactNode } from "react";
import type { CommunityBoardPostCard, CommunityHashtagRow } from "@/lib/community/communityBoardQueries";
import type {
  CommunityNavActive,
  CommunityPopularMentor,
  CommunityRightAsidePromo,
  CommunitySidebarStats,
} from "@/components/community/CommunityNavTypes";
import { CommunityLeftSidebar } from "@/components/community/CommunityLeftSidebar";
import { CommunityRightSidebar } from "@/components/community/CommunityRightSidebar";

type Props = {
  activeNav: CommunityNavActive;
  children: ReactNode;
  rightAsidePromo?: CommunityRightAsidePromo;
  sidebarStats?: CommunitySidebarStats;
  hashtags?: CommunityHashtagRow[];
  popularPosts?: CommunityBoardPostCard[];
  popularMentors?: CommunityPopularMentor[];
  /** @deprecated hero slot — 홈은 피드만 사용 */
  hero?: ReactNode;
};

export function CommunityLayoutShell(props: Props) {
  const promo = props.rightAsidePromo ?? "home";
  return (
    <div className="min-h-[60vh] pb-20 pt-6">
      <div className="mx-auto w-full max-w-[1280px] px-4 sm:px-6">
        <div className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)_260px] lg:items-start">
          <CommunityLeftSidebar active={props.activeNav} hashtags={props.hashtags} />
          <main className="min-w-0 space-y-4">
            {props.hero}
            {props.children}
          </main>
          <CommunityRightSidebar promo={promo} popularPosts={props.popularPosts} popularMentors={props.popularMentors} />
        </div>
      </div>
    </div>
  );
}
