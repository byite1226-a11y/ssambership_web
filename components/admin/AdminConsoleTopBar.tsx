"use client";

import Link from "next/link";
import { Bell, Search } from "lucide-react";
import { UserNameWithRoleBadge } from "@/components/shell/UserNameWithRoleBadge";
import type { UserRow } from "@/lib/types/user";

export function AdminConsoleTopBar(props: { profile?: UserRow | null }) {
  return (
    <header className="hidden border-b border-slate-200 bg-white lg:block">
      <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-3">
        <div className="flex min-w-0 items-center gap-3">
          <Link href="/admin/dashboard" className="text-lg font-black text-[#1A56DB]">
            쌤버십 Admin
          </Link>
          <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-extrabold text-amber-800">
            운영
          </span>
        </div>
        <div className="flex flex-1 flex-wrap items-center justify-end gap-2 sm:max-w-2xl">
          <div className="relative min-w-[200px] flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              placeholder="이름, ID, 제목 검색"
              className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm"
            />
          </div>
          <input type="date" className="h-9 rounded-xl border border-slate-200 px-2 text-xs" aria-label="시작일" />
          <span className="text-slate-400">~</span>
          <input type="date" className="h-9 rounded-xl border border-slate-200 px-2 text-xs" aria-label="종료일" />
          <Link
            href="/notifications"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
            aria-label="알림"
          >
            <Bell className="h-4 w-4" />
          </Link>
          <UserNameWithRoleBadge profile={props.profile ?? null} role="admin" />
          <a
            href="/logout"
            className="shrink-0 text-xs font-medium text-slate-500 underline-offset-2 hover:text-slate-800 hover:underline"
          >
            로그아웃
          </a>
        </div>
      </div>
    </header>
  );
}
