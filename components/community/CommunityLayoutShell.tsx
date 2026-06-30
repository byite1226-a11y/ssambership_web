import type { ReactNode } from "react";
import { getServerUserWithProfile } from "@/lib/auth/getServerUserWithProfile";
import type { CommunityNavActive } from "@/components/community/CommunityNavTypes";
import { CommunityLeftSidebar } from "@/components/community/CommunityLeftSidebar";
import { MobileNavTabs } from "@/components/common/MobileNavTabs";

type Props = {
  activeNav: CommunityNavActive;
  children: ReactNode;
  /** @deprecated hero slot */
  hero?: ReactNode;
};

export async function CommunityLayoutShell(props: Props) {
  const { user } = await getServerUserWithProfile();
  return (
    <div className="min-h-[60vh] bg-[#fcfcfd] pb-20 pt-6">
      <div className="mx-auto w-full max-w-[1480px] px-4 sm:px-6">
        <div className="grid grid-cols-1 items-start gap-[18px] lg:grid-cols-[200px_minmax(0,1fr)]">
          <CommunityLeftSidebar active={props.activeNav} loggedIn={Boolean(user)} />
          <main className="min-w-0 space-y-4">
            <MobileNavTabs
              tone="blue"
              ariaLabel="커뮤니티 메뉴"
              items={[
                { href: "/community", label: "홈", active: props.activeNav === "home" },
                { href: "/community/shortform", label: "숏폼", active: props.activeNav === "shortform" },
                { href: "/community/board", label: "게시판", active: props.activeNav === "board" },
                {
                  href: "/community/me",
                  label: "내 활동",
                  active: props.activeNav === "me" || props.activeNav === "my-posts" || props.activeNav === "scraps",
                },
              ]}
            />
            {props.hero}
            {props.children}
          </main>
        </div>
      </div>
    </div>
  );
}
