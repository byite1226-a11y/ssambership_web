"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { getLandingNavForProfile } from "@/lib/shell/mainNavItems";
import { isMainNavItemActive, mainNavAudience } from "@/lib/shell/mainNavActive";
import type { AppRole } from "@/lib/types/user";

/** @deprecated `getLandingNavForProfile` 사용 — 하위 호환 export */
export { landingGuestNav as LANDING_NAV_ITEMS } from "@/lib/shell/mainNavItems";

export function LandingMainNav(props: { isMentor?: boolean; role?: AppRole | null }) {
  const pathname = usePathname() || "";
  const role: AppRole | null = props.role ?? (props.isMentor ? "mentor" : null);
  const items = getLandingNavForProfile(role);

  return (
    <nav className="flex flex-none items-center gap-6 lg:gap-8" aria-label="주요 메뉴">
      {items.map((item) => {
        const href = role === "mentor" && item.href === "/question-room" ? "/mentor/question-room" : item.href;
        const active = isMainNavItemActive(pathname, href, mainNavAudience(role));
        return (
          <Link
            key={item.href}
            href={href}
            className={`whitespace-nowrap text-[15px] font-bold transition-colors ${
              active ? "text-blue-600" : "text-slate-700 hover:text-slate-900"
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
