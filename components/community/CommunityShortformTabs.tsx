import Link from "next/link";
import { communityFilterChipClass } from "@/components/community/communityFilterChipStyles";

const TABS = [
  { id: "latest", label: "최신" },
  { id: "popular", label: "인기" },
  { id: "all", label: "전체" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export function CommunityShortformTabs(props: { active: TabId; className?: string }) {
  return (
    <div className={props.className ?? ""}>
      <div className="flex flex-wrap gap-2" role="tablist" aria-label="숏폼 영상 탭">
        {TABS.map((t) => {
          const href = t.id === "all" ? "/community/shortform" : `/community/shortform?tab=${t.id}`;
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
    </div>
  );
}

export function parseShortformTab(raw: string | undefined): TabId {
  const v = (raw ?? "all").toLowerCase();
  if (v === "latest" || v === "popular" || v === "all") return v;
  return "all";
}
