"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { isMainNavItemActive } from "@/lib/shell/mainNavActive";

export const LANDING_NAV_ITEMS = [
  { href: "/mentors", label: "멘토 찾기" },
  { href: "/question-room", label: "질문방" },
  { href: "/community", label: "커뮤니티" },
  { href: "/custom-request", label: "맞춤의뢰" },
  { href: "/cash", label: "캐시결제" },
] as const;

export function LandingMainNav() {
  const pathname = usePathname() || "";

  return (
    <nav className="flex flex-none items-center gap-6 lg:gap-8" aria-label="주요 메뉴">
      {LANDING_NAV_ITEMS.map((item) => {
        const active = isMainNavItemActive(pathname, item.href, "student");
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`whitespace-nowrap text-[15px] font-bold transition-colors ${
              active
                ? "text-blue-600"
                : "text-slate-700 hover:text-slate-900"
            }`}
            aria-current={active ? "page" : undefined}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
