"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { isMainNavItemActive } from "@/lib/shell/mainNavActive";

const ITEMS = [
  { href: "/mentors", label: "멘토 찾기" },
  { href: "/question-room", label: "질문방" },
  { href: "/community", label: "커뮤니티" },
  { href: "/custom-request", label: "맞춤의뢰" },
  { href: "/cash", label: "캐시결제" },
  { href: "/mypage", label: "마이페이지" },
] as const;

/**
 * 랜딩 상단 링크는 학생 앱과 동일한 href 집합 → active 규칙은 `student` audience 사용.
 */
export function LandingMainNav() {
  const pathname = usePathname() || "";

  return (
    <nav className="flex flex-wrap items-center gap-3 text-sm sm:gap-4" aria-label="주요 메뉴">
      {ITEMS.map((item) => {
        const active = isMainNavItemActive(pathname, item.href, "student");
        return (
          <Link
            key={item.href}
            href={item.href}
            className={
              active
                ? "relative rounded-full bg-blue-50 px-2.5 py-1 font-extrabold text-blue-700 ring-1 ring-inset ring-blue-100 hover:text-blue-800"
                : "rounded-full px-2.5 py-1 font-bold text-slate-700 hover:text-slate-900"
            }
            aria-current={active ? "page" : undefined}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
