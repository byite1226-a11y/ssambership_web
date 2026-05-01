"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ADMIN_CONSOLE_NAV, adminNavItemIsActive } from "@/components/admin/adminConsoleNavConfig";

function NavLinks({ layout }: { layout: "sidebar" | "top" }) {
  const pathname = usePathname() || "";

  const linkBase =
    layout === "sidebar"
      ? "block rounded-xl border border-transparent px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-200 hover:bg-slate-50"
      : "shrink-0 rounded-lg border border-transparent px-3 py-1.5 text-sm font-semibold text-slate-700 transition hover:border-slate-200 hover:bg-white";

  return (
    <>
      {ADMIN_CONSOLE_NAV.map((item) => {
        const active = adminNavItemIsActive(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={
              active
                ? `${linkBase} border-blue-100 bg-blue-50 text-blue-900 shadow-sm`
                : linkBase
            }
            aria-current={active ? "page" : undefined}
          >
            {item.label}
          </Link>
        );
      })}
    </>
  );
}

function BrandBlock({ compact }: { compact?: boolean }) {
  return (
    <div className={compact ? "min-w-0" : ""}>
      <Link href="/admin" className="block text-lg font-black tracking-tight text-blue-700">
        쌤버십 Admin
      </Link>
      {!compact ? <p className="mt-1 text-xs font-medium text-slate-500">운영 백오피스</p> : null}
    </div>
  );
}

function AdminUserRow({ compact }: { compact?: boolean }) {
  return (
    <div className={`flex items-center gap-2 ${compact ? "shrink-0" : "mt-auto flex-wrap border-t border-slate-200/80 pt-4"}`}>
      <span className="rounded-full border border-violet-200 bg-violet-50 px-2 py-0.5 text-xs font-bold text-violet-800">
        관리자
      </span>
      <a
        href="/logout"
        className="text-xs font-semibold text-slate-500 underline-offset-2 hover:text-slate-800 hover:underline"
      >
        로그아웃
      </a>
    </div>
  );
}

/** 좌측 고정 사이드바용 */
export function AdminConsoleNavSidebar() {
  return (
    <div className="flex h-full min-h-0 flex-col bg-white/95 px-3 pb-4 pt-5 shadow-sm lg:rounded-2xl lg:border lg:border-slate-200/90">
      <div className="px-2">
        <BrandBlock />
      </div>
      <nav className="mt-5 flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto px-1" aria-label="관리자 메뉴">
        <NavLinks layout="sidebar" />
      </nav>
      <div className="px-2 pt-4">
        <AdminUserRow />
      </div>
    </div>
  );
}

/** 좁은 화면: 상단 바 + 가로 스크롤 메뉴 */
export function AdminConsoleNavTop() {
  return (
    <div className="border-b border-slate-200 bg-white/95 shadow-sm">
      <div className="flex items-center justify-between gap-3 px-3 py-2.5">
        <BrandBlock compact />
        <AdminUserRow compact />
      </div>
      <nav className="flex gap-1 overflow-x-auto px-2 pb-2.5 pt-0.5" aria-label="관리자 메뉴">
        <NavLinks layout="top" />
      </nav>
    </div>
  );
}
