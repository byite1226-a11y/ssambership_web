import Link from "next/link";
import type { CommunityMeTab } from "@/lib/community/communityMeTab";
import { communityMePath } from "@/lib/community/communityMeTab";

const TABS: { id: CommunityMeTab; label: string }[] = [
  { id: "overview", label: "전체" },
  { id: "posts", label: "내 게시글" },
  { id: "scraps", label: "스크랩" },
  { id: "follows", label: "팔로우" },
];

export function CommunityMeTabNav(props: { active: CommunityMeTab }) {
  return (
    <div
      className="flex flex-wrap gap-2 rounded-xl border border-slate-200 bg-slate-50/90 p-2 shadow-inner"
      role="tablist"
      aria-label="내 활동 탭"
    >
      {TABS.map((t) => {
        const on = props.active === t.id;
        const href = communityMePath(t.id);
        return (
          <Link
            key={t.id}
            href={href}
            scroll={false}
            className={[
              "rounded-full px-4 py-2 text-sm font-extrabold transition",
              on
                ? "bg-blue-600 text-white shadow-sm ring-2 ring-blue-500/30"
                : "border border-slate-200/80 bg-white text-slate-700 shadow-sm hover:border-slate-300 hover:bg-slate-50",
            ].join(" ")}
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
