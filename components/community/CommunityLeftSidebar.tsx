import Link from "next/link";
import type { CommunityNavActive } from "@/components/community/CommunityNavTypes";

const PRIMARY = "#1A56DB";

const DEFAULT_HASHTAGS = ["학습루틴", "면접", "포트폴리오", "자격증", "취업"] as const;

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

export function CommunityLeftSidebar(props: { active: CommunityNavActive }) {
  const a = props.active;

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
        <h3 className="text-xs font-extrabold uppercase tracking-wide text-slate-400">인기 해시태그</h3>
        <ul className="mt-2 flex flex-wrap gap-2">
          {DEFAULT_HASHTAGS.map((tag) => (
            <li key={tag}>
              <Link
                href={`/community/board?tag=${encodeURIComponent(tag)}`}
                className="inline-block rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-700 hover:bg-blue-50 hover:text-[#1A56DB]"
              >
                #{tag}
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
        <p className="text-sm font-extrabold text-[#1A56DB]">짧고 유익한 학습 영상을 공유해보세요!</p>
        <p className="mt-2 text-xs leading-relaxed text-slate-600">숏폼으로 학습 팁과 노하우를 나눠 보세요.</p>
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
