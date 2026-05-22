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
    <aside className="w-full space-y-4 lg:w-[200px]" aria-label="커뮤니티 메뉴">
      <nav className="rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
        <NavLink href="/community" label="홈" active={a === "home"} />
        <NavLink href="/community/shortform" label="숏폼" active={a === "shortform"} />
        <NavLink href="/community/board" label="게시판" active={a === "board"} />
        <NavLink href="/community/me" label="내 활동" active={a === "me"} />
        <NavLink href="/community/me?tab=posts" label="내 게시글" active={a === "my-posts"} />
        <NavLink href="/community/me?tab=scraps" label="스크랩" active={a === "scraps"} />
        <NavLink href="/community/me?tab=follows" label="팔로우" active={a === "follows"} />
      </nav>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="text-xs font-extrabold uppercase tracking-wide text-slate-400">내 활동</h3>
        <dl className="mt-2 space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="font-semibold text-slate-600">내 포인트</dt>
            <dd className="font-black text-[#1A56DB]">{stats.points.toLocaleString("ko-KR")}P</dd>
          </div>
          <div className="flex justify-between">
            <dt className="font-semibold text-slate-600">내 배지</dt>
            <dd className="font-black text-slate-900">{stats.badges.toLocaleString("ko-KR")}개</dd>
          </div>
        </dl>
        <Link
          href="/community/me"
          className="mt-3 inline-flex text-xs font-extrabold text-[#1A56DB] hover:underline"
        >
          혜택 보러가기 &gt;
        </Link>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="text-xs font-extrabold uppercase tracking-wide text-slate-400">인기 해시태그</h3>
        <ul className="mt-2 space-y-2">
          {tags.map((t) => (
            <li key={t.tag}>
              <Link
                href={`/community?tag=${encodeURIComponent(t.tag)}`}
                className="flex justify-between text-xs font-semibold text-slate-700 hover:text-[#1A56DB]"
              >
                <span>#{t.tag}</span>
                <span className="text-slate-400">{t.count.toLocaleString("ko-KR")}</span>
              </Link>
            </li>
          ))}
        </ul>
        <Link
          href="/community/board"
          className="mt-3 block text-center text-xs font-bold text-slate-500 hover:text-[#1A56DB]"
        >
          전체 해시태그 보기
        </Link>
      </section>

      <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-white p-4 shadow-sm">
        <p className="text-sm font-extrabold text-[#1A56DB]">숏폼을 업로드하고 포인트를 받아보세요!</p>
        <p className="mt-2 text-xs leading-relaxed text-slate-600">
          유익한 콘텐츠를 공유하면 포인트와 배지를 드려요.
        </p>
        <Link
          href="/community/shortform/new"
          className="mt-4 flex min-h-[40px] w-full items-center justify-center rounded-xl text-sm font-extrabold text-white"
          style={{ backgroundColor: PRIMARY }}
        >
          숏폼 업로드
        </Link>
      </div>
    </aside>
  );
}
