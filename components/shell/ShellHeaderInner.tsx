"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import type { AppRole } from "@/lib/types/user";
import { isMainNavItemActive, mainNavAudience } from "@/lib/shell/mainNavActive";
import { ShellMobileNavMenu } from "@/components/shell/ShellMobileNavMenu";

export type ShellMainNavItem = { href: string; label: string };

type ShellHeaderInnerProps = {
  items: ShellMainNavItem[];
  sessionRole: AppRole | null;
  logo: ReactNode;
  /** lg 이상 데스크톱 우측 액션 */
  actions: ReactNode;
  /** lg 미만: 햄버거 왼쪽 아이콘 등 (선택) */
  mobileActions?: ReactNode;
};

function desktopLinkClass(active: boolean): string {
  return [
    "relative flex h-16 shrink-0 items-center px-0.5 text-sm transition-colors",
    active
      ? "font-extrabold text-accent after:pointer-events-none after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:rounded-full after:bg-accent"
      : "font-semibold text-slate-600 hover:text-slate-900",
  ].join(" ");
}

export function ShellHeaderInner({
  items,
  sessionRole,
  logo,
  actions,
  mobileActions,
}: ShellHeaderInnerProps) {
  const pathname = usePathname() || "";
  const audience = mainNavAudience(sessionRole);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  const closeMenu = () => setMenuOpen(false);

  return (
    <>
      <div className="flex h-16 w-full items-center justify-between gap-4">
        {logo}
        <nav
          className="hidden min-h-0 min-w-0 flex-1 items-stretch justify-center gap-8 lg:flex lg:gap-10"
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
        <div className="flex shrink-0 items-center gap-2">
          {mobileActions ? <div className="flex items-center gap-1 lg:hidden">{mobileActions}</div> : null}
          <div className="hidden lg:flex lg:items-center">{actions}</div>
          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-800 lg:hidden"
            aria-expanded={menuOpen}
            aria-controls="shell-mobile-nav"
            aria-label={menuOpen ? "메뉴 닫기" : "메뉴 열기"}
            onClick={() => setMenuOpen((v) => !v)}
          >
            {menuOpen ? (
              <X className="h-6 w-6" strokeWidth={2.5} />
            ) : (
              <Menu className="h-6 w-6" strokeWidth={2.5} />
            )}
          </button>
        </div>
      </div>
      {menuOpen ? (
        <ShellMobileNavMenu items={items} sessionRole={sessionRole} onClose={closeMenu} />
      ) : null}
    </>
  );
}
