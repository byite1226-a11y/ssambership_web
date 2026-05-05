"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import type { AppRole } from "@/lib/types/user";
import { isMainNavItemActive, mainNavAudience } from "@/lib/shell/mainNavActive";

export type ShellMainNavItem = { href: string; label: string };

type ShellHeaderInnerProps = {
  items: ShellMainNavItem[];
  sessionRole: AppRole | null;
  logo: ReactNode;
  actions: ReactNode;
};

function desktopLinkClass(active: boolean): string {
  return [
    "relative flex h-16 shrink-0 items-center px-0.5 text-sm transition-colors",
    active
      ? "font-extrabold text-blue-700 after:pointer-events-none after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:rounded-full after:bg-blue-600"
      : "font-semibold text-slate-600 hover:text-slate-900",
  ].join(" ");
}

export function ShellHeaderInner({ items, sessionRole, logo, actions }: ShellHeaderInnerProps) {
  const pathname = usePathname() || "";
  const audience = mainNavAudience(sessionRole);

  return (
    <>
      <div className="flex h-16 w-full items-center justify-between gap-4">
        {logo}
        <nav
          className="hidden min-h-0 min-w-0 flex-1 items-stretch justify-center gap-8 lg:gap-10 sm:flex"
          aria-label="주요 메뉴"
        >
          {items.map((item) => {
            const active = isMainNavItemActive(pathname, item.href, audience);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={desktopLinkClass(active)}
                aria-current={active ? "page" : undefined}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        {actions}
      </div>
      <div className="border-t border-slate-100 py-2 sm:hidden">
        <nav className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-0.5" aria-label="주요 메뉴">
          {items.map((item) => {
            const active = isMainNavItemActive(pathname, item.href, audience);
            return (
              <Link
                key={`mob-${item.href}`}
                href={item.href}
                className={
                  active
                    ? "shrink-0 rounded-full bg-blue-50/90 px-3 py-1.5 text-xs font-extrabold text-blue-700 ring-1 ring-inset ring-blue-100"
                    : "shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }
                aria-current={active ? "page" : undefined}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </>
  );
}
