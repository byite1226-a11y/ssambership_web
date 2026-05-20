import Link from "next/link";
import type { CommunityHashtagRow } from "@/lib/community/communityBoardQueries";
import type { CommunityNavActive, CommunitySidebarStats } from "@/components/community/CommunityNavTypes";

const PRIMARY = "#1A56DB";

function NavLink({ href, label, active }: { href: string; label: string; active: boolean }) {
  return (
    <Link
      href={href}
      className={[
        "block rounded-lg px-3 py-2 text-sm font-bold transition",
        active ? "text-white shadow-sm" : "text-slate-700 hover:bg-slate-50",
      ].join(" ")}
      style={active ? { backgroundColor: PRIMARY } : undefined}
    >
      {label}
    </Link>
  );
}

export function CommunityLeftSidebar(props: {
  active: CommunityNavActive;
  stats?: CommunitySidebarStats;
  hashtags?: CommunityHashtagRow[];
}) {
  const a = props.active;
  const stats = props.stats ?? { points: 0, badges: 0 };
  const tags = props.hashtags ?? [];

  return (
    <aside className="w-full space-y-4 lg:w-[200px]" aria-label={"\uCEE4\uBAE0\uB2C8\uD2F0 \uBA54\uB274"}>
      <nav className="rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
        <NavLink href="/community" label={"\uD648"} active={a === "home"} />
        <NavLink href="/community/shortform" label={"\uC877\uD3FC"} active={a === "shortform"} />
        <NavLink href="/community/board" label={"\uAC8C\uC2DC\uBC18"} active={a === "board"} />
        <NavLink href="/community/me" label={"\uB0B4 \uD65C\uB3D9"} active={a === "me"} />
        <NavLink href="/community/me?tab=posts" label={"\uB0B4 \uAC8C\uC2DC\uAE00"} active={a === "my-posts"} />
        <NavLink href="/community/me?tab=scraps" label={"\uC2A4\uD06C\uB7A9"} active={a === "scraps"} />
        <NavLink href="/community/me?tab=follows" label={"\uD314\uB85C\uC6B0"} active={a === "follows"} />
      </nav>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="text-xs font-extrabold uppercase tracking-wide text-slate-400">{"\uB0B4 \uD65C\uB3D9"}</h3>
        <dl className="mt-2 space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="font-semibold text-slate-600">{"\uB0B4 \uD3EC\uC778\uD2B8"}</dt>
            <dd className="font-black text-[#1A56DB]">{stats.points.toLocaleString("ko-KR")}P</dd>
          </div>
          <div className="flex justify-between">
            <dt className="font-semibold text-slate-600">{"\uB0B4 \uBC30\uC9C0"}</dt>
            <dd className="font-black text-slate-900">{stats.badges}</dd>
          </div>
        </dl>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="text-xs font-extrabold uppercase tracking-wide text-slate-400">{"\uC778\uAE30 \uD574\uC2DC\uD0DC\uADF8"}</h3>
        <ul className="mt-2 space-y-2">
          {tags.map((t) => (
            <li key={t.tag}>
              <Link href={`/community?tag=${encodeURIComponent(t.tag)}`} className="flex justify-between text-xs font-semibold text-slate-700 hover:text-[#1A56DB]">
                <span>#{t.tag}</span>
                <span className="text-slate-400">{t.count.toLocaleString("ko-KR")}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <Link
        href="/community/new"
        className="block rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-white p-4 text-center shadow-sm transition hover:border-[#1A56DB]/30"
      >
        <p className="text-sm font-extrabold text-[#1A56DB]">{"\uC877\uD3FC \uC5C5\uB85C\uB4DC"}</p>
        <p className="mt-1 text-xs leading-relaxed text-slate-600">{"\uC9E7\uC740 \uC601\uC0C1\uC73C\uB85C \uD559\uC2B5 \uD301\uC744 \uACF5\uC720\uD574 \uBCF4\uC138\uC694."}</p>
      </Link>
    </aside>
  );
}
