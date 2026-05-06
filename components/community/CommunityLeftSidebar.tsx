import Link from "next/link";
import type { CommunityNavActive } from "@/components/community/CommunityNavTypes";

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
        "block shrink-0 rounded-xl px-3 py-2 text-sm font-bold transition lg:w-full lg:whitespace-normal",
        active ? "bg-blue-600 text-white shadow-sm" : "text-slate-700 hover:bg-slate-100",
      ].join(" ")}
    >
      {label}
    </Link>
  );
}

export function CommunityLeftSidebar(props: { active: CommunityNavActive }) {
  const a = props.active;
  return (
    <nav
      className={[
        "rounded-2xl border border-slate-200 bg-white p-3 shadow-sm",
        "flex flex-nowrap gap-1 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] lg:flex-col lg:flex-nowrap lg:gap-0 lg:space-y-1 lg:overflow-visible lg:pb-0 [&::-webkit-scrollbar]:hidden",
      ].join(" ")}
      aria-label="커뮤니티 메뉴"
    >
      <NavLink href="/community" label="홈" active={a === "home"} />
      <NavLink href="/community/shortform" label="숏폼" active={a === "shortform"} />
      <NavLink href="/community/board" label="게시판" active={a === "board"} />
      <NavLink href="/community/me" label="내 활동" active={a === "me"} />
    </nav>
  );
}
