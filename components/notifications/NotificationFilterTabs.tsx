import Link from "next/link";

type Filter = "all" | "unread";

const STY = {
  active: "bg-slate-900 text-white border-slate-900",
  idle: "bg-white text-slate-700 border-slate-200 hover:border-slate-300",
} as const;

/**
 * /notifications?filter=all|unread
 */
export function NotificationFilterTabs(props: { current: Filter }) {
  const { current } = props;
  return (
    <div className="flex flex-wrap gap-2" role="tablist" aria-label="알림 필터">
      <FilterLink href="/notifications" label="전체" active={current === "all"} filterParam={null} />
      <FilterLink
        href="/notifications?filter=unread"
        label="읽지 않음"
        active={current === "unread"}
        filterParam="unread"
      />
    </div>
  );
}

function FilterLink({
  href,
  label,
  active,
  filterParam,
}: {
  href: string;
  label: string;
  active: boolean;
  filterParam: string | null;
}) {
  return (
    <Link
      href={href}
      className={`rounded-lg border px-3 py-1.5 text-xs font-extrabold ${active ? STY.active : STY.idle}`}
      aria-selected={active}
      role="tab"
      id={filterParam ? `notif-filter-${filterParam}` : "notif-filter-all"}
    >
      {label}
    </Link>
  );
}
