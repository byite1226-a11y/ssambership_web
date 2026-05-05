"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import type { UserRow } from "@/lib/types/user";
import type { User } from "@supabase/supabase-js";
import { LandingMainNav, LANDING_NAV_ITEMS } from "@/components/landing/LandingMainNav";
import { isMainNavItemActive } from "@/lib/shell/mainNavActive";

function profileHref(profile: UserRow | null): string {
  if (!profile) return "/login/student";
  if (profile.role === "mentor") return "/mentor/profile";
  if (profile.role === "admin") return "/admin";
  return "/mypage";
}

export function LandingTopNav(props: { user: User | null; profile: UserRow | null }) {
  const logged = Boolean(props.user);
  const pathname = usePathname() || "";
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
    <header className="sticky top-0 z-50 w-full max-w-full border-b border-slate-100 bg-white/95 backdrop-blur-md scheme-light">
      {menuOpen && typeof window !== "undefined"
        ? createPortal(
            <div
              className="fixed inset-0 z-[45] bg-slate-900/25 md:hidden"
              aria-hidden
              onClick={closeMenu}
            />,
            document.body,
          )
        : null}
      <div className="relative z-[60] mx-auto flex h-16 w-full min-w-0 max-w-[1280px] items-center justify-between gap-2 px-4 sm:h-[72px] sm:gap-3 sm:px-6">
        <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-8 md:gap-12">
          <Link href="/" className="flex min-w-0 shrink-0 items-center gap-2" onClick={closeMenu}>
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#142d61] text-white">
              <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current">
                <path d="M3 10 12 4l9 6-9 6-9-6Zm2.5 2.8L12 17l6.5-4.2V16L12 20l-6.5-4v-3.2Z" />
              </svg>
            </div>
            <span className="truncate text-[17px] font-black tracking-tight text-[#142d61] sm:text-[20px]">쌤버십</span>
          </Link>
          <div className="hidden min-w-0 md:block">
            <LandingMainNav />
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-3 md:gap-5">
          <button
            type="button"
            className={`inline-flex h-11 min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-50 hover:text-slate-600 md:h-auto md:min-h-0 md:min-w-0 md:rounded-none md:hover:bg-transparent ${logged ? "" : "hidden md:inline-flex"}`}
            aria-label="검색"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-5 w-5">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
          </button>

          {logged ? (
            <div className="flex items-center gap-2 sm:gap-4">
              <button
                type="button"
                className="relative hidden text-slate-400 transition-colors hover:text-slate-600 sm:block"
                aria-label="알림"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="h-6 w-6">
                  <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
                  <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
                </svg>
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                  3
                </span>
              </button>
              <button
                type="button"
                className="relative hidden text-slate-400 transition-colors hover:text-slate-600 md:block"
                aria-label="메시지"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="h-6 w-6">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                  5
                </span>
              </button>
              <Link
                href={profileHref(props.profile)}
                className="flex min-w-0 max-w-[140px] items-center gap-2 rounded-full p-0.5 transition-colors hover:bg-slate-50 sm:max-w-none sm:pr-3"
                onClick={closeMenu}
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full border border-slate-100 bg-slate-100 text-slate-400">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                  </svg>
                </div>
                <span className="hidden min-w-0 truncate text-[14px] font-bold text-slate-800 sm:inline">
                  {props.profile?.full_name || props.profile?.nickname || "사용자"} 님
                </span>
                <svg viewBox="0 0 20 20" fill="currentColor" className="hidden h-4 w-4 shrink-0 text-slate-400 sm:block">
                  <path
                    fillRule="evenodd"
                    d="M5.22 8.22a.75.75 0 011.06 0L10 11.94l3.72-3.72a.75.75 0 111.06 1.06l-4.25 4.25a.75.75 0 01-1.06 0L5.22 9.28a.75.75 0 010-1.06z"
                    clipRule="evenodd"
                  />
                </svg>
              </Link>
            </div>
          ) : (
            <div className="hidden items-center gap-2 sm:gap-3 md:flex">
              <Link
                href="/login"
                className="rounded-[10px] border border-slate-200 px-5 py-2 text-[14px] font-bold text-slate-600 transition-colors hover:bg-slate-50"
              >
                로그인
              </Link>
              <Link
                href="/signup"
                className="rounded-[10px] bg-[#3b66f5] px-5 py-2 text-[14px] font-bold text-white transition-colors hover:bg-[#2d52d1] hover:shadow-lg"
              >
                회원가입
              </Link>
            </div>
          )}

          <button
            type="button"
            className="inline-flex h-11 min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-700 md:hidden"
            aria-expanded={menuOpen}
            aria-controls="landing-mobile-nav"
            aria-label={menuOpen ? "메뉴 닫기" : "메뉴 열기"}
            onClick={() => setMenuOpen((v) => !v)}
          >
            {menuOpen ? <X className="h-6 w-6" strokeWidth={2} /> : <Menu className="h-6 w-6" strokeWidth={2} />}
          </button>
        </div>
      </div>

      {menuOpen ? (
        <nav
          id="landing-mobile-nav"
          className="relative z-[60] border-t border-slate-100 bg-white px-4 py-3 md:hidden"
          aria-label="모바일 메뉴"
        >
          <ul className="flex flex-col gap-0">
            {LANDING_NAV_ITEMS.map((item) => {
              const active = isMainNavItemActive(pathname, item.href, "student");
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`block min-h-[44px] py-3 text-[15px] font-bold leading-snug ${
                      active ? "text-blue-600" : "text-slate-800 hover:text-slate-900"
                    }`}
                    aria-current={active ? "page" : undefined}
                    onClick={closeMenu}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>

          {!logged ? (
            <div className="mt-4 border-t border-slate-100 pt-4">
              <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-slate-400">계정</p>
              <button
                type="button"
                className="mb-2 flex min-h-[44px] w-full items-center gap-2 rounded-lg px-1 text-left text-[15px] font-semibold text-slate-700 hover:bg-slate-50"
                aria-label="검색 (준비 중)"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="h-5 w-5 shrink-0 text-slate-400">
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.3-4.3" />
                </svg>
                검색
              </button>
              <Link
                href="/login"
                className="mb-2 flex min-h-[44px] w-full items-center justify-center rounded-[10px] border border-slate-200 py-2.5 text-[14px] font-bold text-slate-600 hover:bg-slate-50"
                onClick={closeMenu}
              >
                로그인
              </Link>
              <Link
                href="/signup"
                className="flex min-h-[44px] w-full items-center justify-center rounded-[10px] bg-[#3b66f5] py-2.5 text-[14px] font-bold text-white hover:bg-[#2d52d1]"
                onClick={closeMenu}
              >
                회원가입
              </Link>
            </div>
          ) : null}
        </nav>
      ) : null}
    </header>
  );
}
