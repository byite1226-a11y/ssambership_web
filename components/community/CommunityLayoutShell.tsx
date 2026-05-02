import type { ReactNode } from "react";
import type { CommunityNavActive, CommunityRightAsidePromo } from "@/components/community/CommunityNavTypes";
import type { CommunityMeTab } from "@/lib/community/communityMeTab";
import { CommunityLeftSidebar } from "@/components/community/CommunityLeftSidebar";
import { CommunityRightSidebar } from "@/components/community/CommunityRightSidebar";

type Props = {
  activeNav: CommunityNavActive;
  hero: ReactNode;
  children: ReactNode;
  /** 기본: 게시판 둘러보기. 게시판 목록·상세에서는 숏폼 보기로 전환 */
  rightAsidePromo?: CommunityRightAsidePromo;
  /** 내 활동(/community/me) 하위 탭 — 사이드바 하이라이트용 */
  meTab?: CommunityMeTab;
};

export function CommunityLayoutShell(props: Props) {
  const promo = props.rightAsidePromo ?? "board";
  return (
    <div className="min-h-[60vh] bg-slate-50/80 pb-16 pt-6">
      <div className="mx-auto w-full max-w-[1280px] px-4 sm:px-6">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,220px)_minmax(0,1fr)_minmax(0,260px)] lg:items-start">
          <aside className="order-2 min-w-0 lg:order-1 lg:sticky lg:top-6 lg:self-start">
            <CommunityLeftSidebar active={props.activeNav} meTab={props.meTab} />
          </aside>
          <main className="order-1 min-w-0 space-y-6 lg:order-2">
            {props.hero}
            {props.children}
          </main>
          <aside className="order-3 min-w-0 lg:sticky lg:top-6 lg:self-start">
            <CommunityRightSidebar promo={promo} />
          </aside>
        </div>
      </div>
    </div>
  );
}
