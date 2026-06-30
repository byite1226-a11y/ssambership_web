import type { ReactNode } from "react";
import { MentorCustomRequestSubNav, type MentorCustomRequestNavKey } from "@/components/customRequest/MentorCustomRequestSubNav";
import { MobileNavTabs } from "@/components/common/MobileNavTabs";

export function MentorCustomRequestWorkspaceLayout(props: {
  active: MentorCustomRequestNavKey;
  tab?: string;
  counts?: Record<string, number>;
  showAuxCards?: boolean;
  children: ReactNode;
}) {
  const mobileTabs = [
    { href: "/mentor/custom-request/dashboard", label: "대시보드", active: props.active === "dashboard" },
    {
      href: "/mentor/custom-request/posts",
      label: "새 의뢰 목록",
      active: props.active === "posts" && (!props.tab || props.tab === "open"),
    },
    {
      href: "/mentor/custom-request/posts?tab=applied",
      label: "제안한 의뢰",
      active: props.active === "posts" && props.tab === "applied",
    },
    { href: "/mentor/custom-request/orders", label: "수락된 의뢰", active: props.active === "orders" },
  ];
  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-6">
      {/* Left sidebar - 데스크탑 전용 (~200px) */}
      <aside className="hidden w-full shrink-0 lg:order-1 lg:block lg:w-[200px]">
        <div className="lg:sticky lg:top-20">
          <MentorCustomRequestSubNav
            active={props.active}
            tab={props.tab}
            counts={props.counts}
            showAuxCards={props.showAuxCards}
          />
        </div>
      </aside>
      {/* Main content — 모바일은 상단 가로 탭 네비 */}
      <div className="order-1 min-w-0 flex-1 lg:order-2">
        <MobileNavTabs items={mobileTabs} tone="green" ariaLabel="맞춤의뢰 메뉴" className="mb-4" />
        {props.children}
      </div>
    </div>
  );
}
