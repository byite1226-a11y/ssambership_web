"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ADMIN_CONSOLE_NAV, adminNavItemIsActive } from "@/components/admin/adminConsoleNavConfig";

function NavLinks({ collapsed }: { collapsed: boolean }) {
  const pathname = usePathname() || "";

  return (
    <div className="space-y-0.5">
      {ADMIN_CONSOLE_NAV.map((item) => {
        const active = adminNavItemIsActive(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            title={collapsed ? item.label : undefined}
            className={[
              "flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-bold transition select-none",
              active ? "bg-[#1A56DB] text-white shadow-sm" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
              collapsed ? "justify-center px-2" : "",
            ].join(" ")}
            aria-current={active ? "page" : undefined}
          >
            <span className="h-2 w-2 shrink-0 rounded-full bg-current opacity-60" aria-hidden />
            {!collapsed ? <span className="truncate">{item.label}</span> : null}
          </Link>
        );
      })}
    </div>
  );
}

function BrandBlock({ collapsed }: { collapsed: boolean }) {
  return (
    <Link href="/admin/dashboard" className="block">
      <p className={["font-black tracking-tight text-[#1A56DB]", collapsed ? "text-center text-sm" : "text-lg"].join(" ")}>
        {collapsed ? "S" : "쌤버십 Admin"}
      </p>
      {!collapsed ? <p className="mt-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">운영 백오피스</p> : null}
    </Link>
  );
}

export function AdminConsoleNavSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const w = collapsed ? "w-[72px]" : "w-[240px]";

  return (
    <aside className={`flex h-full min-h-0 shrink-0 flex-col border-r border-slate-200 bg-white ${w} transition-[width]`}>
      <div className="flex min-h-0 flex-1 flex-col px-3 py-5">
        <div className={collapsed ? "px-0" : "px-1"}>
          <BrandBlock collapsed={collapsed} />
        </div>
        <nav className="mt-6 flex-1 overflow-y-auto" aria-label="관리자 메뉴">
          <NavLinks collapsed={collapsed} />
        </nav>
        <div className="mt-4 space-y-2 border-t border-slate-100 pt-4">
          {!collapsed ? (
            <a href="/logout" className="block text-center text-xs font-bold text-slate-400 hover:text-slate-600">
              로그아웃
            </a>
          ) : null}
          <button
            type="button"
            onClick={() => setCollapsed((c) => !c)}
            className="flex w-full items-center justify-center gap-1 rounded-xl border border-slate-200 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"
            aria-label={collapsed ? "메뉴 펼치기" : "메뉴 접기"}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            {!collapsed ? <span>메뉴 접기</span> : null}
          </button>
        </div>
      </div>
    </aside>
  );
}

export function AdminConsoleNavTop() {
  return (
    <div className="border-b border-slate-200 bg-white lg:hidden">
      <div className="flex items-center justify-between px-4 py-3">
        <BrandBlock collapsed={false} />
        <a href="/logout" className="text-xs font-bold text-slate-500 underline">
          로그아웃
        </a>
      </div>
      <nav className="flex gap-1 overflow-x-auto px-3 pb-3" aria-label="관리자 메뉴">
        <NavLinks collapsed={false} />
      </nav>
    </div>
  );
}
