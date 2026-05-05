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
    <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/95 backdrop-blur-md transition-colors">
      {menuOpen && typeof window !== "undefined"
        ? createPortal(
            <div
              className="fixed inset-0 z-[45] bg-slate-900/25 lg:hidden"
              aria-hidden
              onClick={closeMenu}
            />,
            document.body,
          )
        : null}
      <div className="mx-auto flex h-16 max-w-[1480px] items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* 로고 영역 */}
        <div className="flex shrink-0 items-center">
          <Link
            href="/"
            className="flex min-w-fit shrink-0 items-center gap-2 whitespace-nowrap"
            onClick={closeMenu}
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#142d61] text-white">
              <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current">
                <path d="M3 10 12 4l9 6-9 6-9-6Zm2.5 2.8L12 17l6.5-4.2V16L12 20l-6.5-4v-3.2Z" />
              </svg>
            </div>
            <span className="text-[18px] font-black tracking-tight text-[#142d61] sm:text-[20px]">
              쌤버십
            </span>
          </Link>
        </div>

        {/* 데스크톱 네비게이션 (중앙) */}
        <div className="hidden flex-1 justify-center lg:flex">
          <LandingMainNav />
        </div>

        {/* 액션 버튼 영역 (우측) */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* 공통 검색 아이콘 (모바일/데스크톱 모두 노출) */}
          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-800"
            aria-label="검색"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              className="h-5 w-5"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
          </button>

          {/* 데스크톱 전용: 로그인/회원가입 또는 프로필 */}
          <div className="hidden lg:flex lg:items-center lg:gap-3">
            {logged ? (
              <Link
                href={profileHref(props.profile)}
                className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 p-0.5 pr-3 transition-colors hover:bg-slate-100"
                onClick={closeMenu}
              >
                <div className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-200 text-slate-500">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                  </svg>
                </div>
                <span className="text-sm font-bold text-slate-800">
                  {props.profile?.full_name || props.profile?.nickname || "사용자"} 님
                </span>
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="rounded-lg border border-slate-200 px-4 py-1.5 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-50"
                >
                  로그인
                </Link>
                <Link
                  href="/signup"
                  className="rounded-lg bg-[#3b66f5] px-4 py-1.5 text-sm font-bold text-white transition-colors hover:bg-[#2d52d1]"
                >
                  회원가입
                </Link>
              </>
            )}
          </div>

          {/* 모바일/태블릿 전용: 햄버거 버튼 */}
          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-50 lg:hidden"
            aria-expanded={menuOpen}
            aria-controls="landing-mobile-nav"
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

      {/* 모바일 드로어 (lg 미만) */}
      {menuOpen ? (
        <nav
          id="landing-mobile-nav"
          className="relative z-[60] border-t border-slate-100 bg-white px-4 py-4 lg:hidden"
          aria-label="모바일 메뉴"
        >
          <ul className="grid grid-cols-1 gap-1">
            {LANDING_NAV_ITEMS.map((item) => {
              const active = isMainNavItemActive(pathname, item.href, "student");
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`flex h-12 items-center rounded-xl px-4 text-[16px] font-bold transition-colors ${
                      active
                        ? "bg-blue-50 text-blue-600"
                        : "text-slate-800 hover:bg-slate-50"
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

          <div className="mt-4 border-t border-slate-100 pt-4">
            {!logged ? (
              <div className="grid grid-cols-2 gap-3">
                <Link
                  href="/login"
                  className="flex h-12 items-center justify-center rounded-xl border border-slate-200 text-[15px] font-bold text-slate-700 hover:bg-slate-50"
                  onClick={closeMenu}
                >
                  로그인
                </Link>
                <Link
                  href="/signup"
                  className="flex h-12 items-center justify-center rounded-xl bg-[#3b66f5] text-[15px] font-bold text-white hover:bg-[#2d52d1]"
                  onClick={closeMenu}
                >
                  회원가입
                </Link>
              </div>
            ) : (
              <Link
                href="/logout"
                className="flex h-12 items-center justify-center rounded-xl border border-slate-100 text-[15px] font-bold text-slate-500"
                onClick={closeMenu}
              >
                로그아웃
              </Link>
            )}
          </div>
        </nav>
      ) : null}
    </header>
  );
}
