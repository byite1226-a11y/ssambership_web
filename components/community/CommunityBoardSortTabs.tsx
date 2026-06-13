"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { communityFilterChipClass } from "@/components/community/communityFilterChipStyles";
import {
  COMMUNITY_BOARD_SORT_TABS,
  type CommunityBoardSortTab,
} from "@/lib/community/communityBoardSort";

export function CommunityBoardSortTabs(props: { active: CommunityBoardSortTab; basePath?: string }) {
  const pathname = usePathname();
  const sp = useSearchParams();
  const base = props.basePath ?? pathname;

  return (
    <div className="flex flex-wrap gap-2" role="tablist" aria-label="게시판 정렬">
      {COMMUNITY_BOARD_SORT_TABS.map((t) => {
        const q = new URLSearchParams(sp.toString());
        if (t.id === "all") q.delete("tab");
        else q.set("tab", t.id);
        const href = q.toString() ? `${base}?${q}` : base;
        const on = props.active === t.id;
        return (
          <Link
            key={t.id}
            href={href}
            scroll={false}
            className={communityFilterChipClass(on)}
            role="tab"
            aria-selected={on}
          >
            {t.label}
          </Link>
        );
      })}
    </div>
  );
}
