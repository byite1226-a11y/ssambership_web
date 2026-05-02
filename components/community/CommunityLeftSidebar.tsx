import Link from "next/link";
import type { CommunityNavActive } from "@/components/community/CommunityNavTypes";
import type { CommunityMeTab } from "@/lib/community/communityMeTab";
import { communityMePath } from "@/lib/community/communityMeTab";

const HASHTAGS = ["#학습루틴", "#면접", "#포트폴리오", "#자격증", "#취업"];

function NavLink({
  href,
  label,
  active,
}: {
  href: string;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={[
        "block rounded-xl px-3 py-2 text-sm font-bold transition",
        active ? "bg-blue-600 text-white shadow-sm" : "text-slate-700 hover:bg-slate-100",
      ].join(" ")}
    >
      {label}
    </Link>
  );
}

export function CommunityLeftSidebar(props: { active: CommunityNavActive; meTab?: CommunityMeTab }) {
  const a = props.active;
  const mt = props.meTab ?? "overview";
  const onMe = a === "me";
  return (
    <nav className="space-y-1 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm" aria-label="커뮤니티 메뉴">
      <NavLink href="/community" label="홈" active={a === "home"} />
      <NavLink href="/community/shortform" label="숏폼" active={a === "shortform"} />
      <NavLink href="/community/board" label="게시판" active={a === "board"} />
      <div className="my-2 border-t border-slate-100" />
      <NavLink href={communityMePath("overview")} label="내 활동" active={onMe && mt === "overview"} />
      <NavLink href={communityMePath("posts")} label="내 게시글" active={onMe && mt === "posts"} />
      <NavLink href={communityMePath("scraps")} label="스크랩" active={onMe && mt === "scraps"} />
      <NavLink href={communityMePath("follows")} label="팔로우" active={onMe && mt === "follows"} />
      <div className="my-2 border-t border-slate-100" />
      <p className="px-2 pb-1 text-xs font-extrabold uppercase tracking-wide text-slate-400">인기 해시태그</p>
      <ul className="space-y-1">
        {HASHTAGS.map((tag) => (
          <li key={tag}>
            <span className="block rounded-lg px-2 py-1 text-xs font-semibold text-slate-600">{tag}</span>
          </li>
        ))}
      </ul>
    </nav>
  );
}
