import Link from "next/link";

const TABS = [
  { id: "recommend", label: "추천" },
  { id: "latest", label: "최신" },
  { id: "popular", label: "인기" },
  { id: "all", label: "전체" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export function CommunityShortformTabs(props: { active: TabId; className?: string }) {
  return (
    <div
      className={[
        "rounded-xl border border-slate-200 bg-slate-50/90 p-2 shadow-inner",
        props.className ?? "",
      ].join(" ")}
    >
      <div className="flex flex-wrap gap-2" role="tablist" aria-label="숏폼 영상 탭">
        {TABS.map((t) => {
          const href = t.id === "all" ? "/community/shortform" : `/community/shortform?tab=${t.id}`;
          const on = props.active === t.id;
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
    </div>
  );
}

export function parseShortformTab(raw: string | undefined): TabId {
  const v = (raw ?? "all").toLowerCase();
  if (v === "recommend" || v === "latest" || v === "popular" || v === "all") return v;
  return "all";
}
