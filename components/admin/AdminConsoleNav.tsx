"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ADMIN_CONSOLE_NAV, adminNavItemIsActive } from "@/components/admin/adminConsoleNavConfig";

function NavLinks({ layout }: { layout: "sidebar" | "top" }) {
  const pathname = usePathname() || "";

  const linkBase =
    layout === "sidebar"
      ? "block rounded-xl px-3.5 py-2.5 text-sm font-bold text-slate-600 transition hover:bg-slate-50 hover:text-slate-900 select-none cursor-pointer"
      : "shrink-0 rounded-lg px-3 py-1.5 text-sm font-bold text-slate-600 transition hover:bg-slate-50 hover:text-slate-900 select-none cursor-pointer";

  return (
    <div className={layout === "sidebar" ? "space-y-1" : "flex gap-1"}>
      {ADMIN_CONSOLE_NAV.map((item) => {
        const active = adminNavItemIsActive(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={
              active
                ? `${linkBase} bg-blue-50/80 text-blue-600 hover:bg-blue-50 hover:text-blue-600`
                : linkBase
            }
            aria-current={active ? "page" : undefined}
          >
            {item.label}
          </Link>
        );
      })}
    </div>
  );
}

function BrandBlock({ compact }: { compact?: boolean }) {
  return (
    <div className={compact ? "min-w-0" : ""}>
      <Link href="/admin" className="block text-lg font-black tracking-tight text-blue-600 hover:text-blue-500 transition-colors">
        쌤버십 Admin
      </Link>
      {!compact ? <p className="mt-1 text-[11px] font-bold text-slate-400">운영 백오피스 콘솔</p> : null}
    </div>
  );
}

function AdminUserRow({ compact }: { compact?: boolean }) {
  return (
    <div className={`flex items-center gap-2 ${compact ? "shrink-0" : "mt-auto flex-wrap border-t border-slate-100 pt-4"}`}>
      <span className="rounded-lg bg-blue-50/50 border border-blue-100 px-2 py-0.5 text-xs font-bold text-blue-600">
        관리자
      </span>
      <a
        href="/logout"
        className="text-xs font-bold text-slate-400 underline-offset-2 hover:text-slate-600 hover:underline transition-colors"
      >
        로그아웃
      </a>
    </div>
  );
}

/** 좌측 고정 사이드바용 */
export function AdminConsoleNavSidebar() {
  return (
    <div className="flex h-full min-h-0 flex-col bg-white px-4 pb-5 pt-6 lg:rounded-2xl lg:border lg:border-slate-200/80 shadow-sm">
      <div className="px-2">
        <BrandBlock />
      </div>
      <nav className="mt-6 flex min-h-0 flex-1 flex-col overflow-y-auto" aria-label="관리자 메뉴">
        <NavLinks layout="sidebar" />
      </nav>
      <div className="px-1 pt-4">
        <AdminUserRow />
      </div>
    </div>
  );
}

/** 좁은 화면: 상단 바 + 가로 스크롤 메뉴 */
export function AdminConsoleNavTop() {
  return (
    <div className="border-b border-slate-200/80 bg-white shadow-sm">
      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <BrandBlock compact />
        <AdminUserRow compact />
      </div>
      <nav className="flex gap-1 overflow-x-auto px-3 pb-3 pt-0.5" aria-label="관리자 메뉴">
        <NavLinks layout="top" />
      </nav>
    </div>
  );
}
