import Link from "next/link";
import { mentorMainNav } from "@/lib/shell/mainNavItems";

const PRIMARY = "#1A56DB";

export function MentorDashboardSideNav() {
  return (
    <aside className="hidden w-[240px] shrink-0 xl:block">
      <nav className="sticky top-24 space-y-1 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
        <p className="px-3 pb-2 text-[11px] font-bold uppercase tracking-wide text-slate-400">멘토 메뉴</p>
        <Link
          href="/mentor/dashboard"
          className="block rounded-xl px-3 py-2.5 text-sm font-extrabold text-white shadow-sm"
          style={{ backgroundColor: PRIMARY }}
        >
          대시보드
        </Link>
        {mentorMainNav.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="block rounded-xl px-3 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
