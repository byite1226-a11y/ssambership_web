# 변경 후 소스 스냅샷 (Claude 첨부용)

`fix/mobile-landing-responsive` 브랜치 기준.

## `app/globals.css`

```css
@import "tailwindcss";

@custom-variant dark (&:where(.dark, .dark *));

:root {
  --background: #ffffff;
  --foreground: #171717;
}

html {
  color-scheme: light;
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --font-sans: var(--font-geist-sans);
  --font-mono: var(--font-geist-mono);
}

body {
  background: var(--background);
  color: var(--foreground);
  font-family: Arial, Helvetica, sans-serif;
}
```

## `app/layout.tsx`

```tsx
import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "쌤버십 웹",
  description: "학생-멘토 질문/구독/커뮤니티 플랫폼",
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
  colorScheme: "light",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased scheme-light`}
      style={{ colorScheme: "light" }}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
```

## `components/landing/LandingLayout.tsx`

```tsx
import { LandingTopNav } from "@/components/landing/LandingTopNav";
import { NoticeBanner } from "@/components/landing/NoticeBanner";
import type { User } from "@supabase/supabase-js";
import type { UserRow } from "@/lib/types/user";
import type { ReactNode } from "react";

export function LandingLayout(props: { user: User | null; profile: UserRow | null; children: ReactNode }) {
  return (
    <div className="min-h-screen max-w-full bg-white text-slate-900 scheme-light">
      <NoticeBanner />
      <LandingTopNav user={props.user} profile={props.profile} />
      {/* overflow-x only under header so sticky TopNav is not inside an overflow-x clip ancestor */}
      <main className="mx-auto w-full min-w-0 max-w-[1280px] overflow-x-hidden px-4 sm:px-6">{props.children}</main>
    </div>
  );
}
```

## `components/landing/LandingTopNav.tsx`

```tsx
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
```

## `components/landing/HeroSection.tsx`

```tsx
"use client";

import Link from "next/link";
import Image from "next/image";

export function HeroSection(props: { loggedIn?: boolean }) {
  return (
    <section className="relative max-w-full pt-8 pb-12 sm:pt-10 sm:pb-16 lg:pt-12 lg:pb-20">
      <div className="flex flex-col items-center justify-between gap-8 lg:flex-row lg:items-center lg:gap-12">
        <div className="z-10 w-full min-w-0 flex-1 text-left">
          <h1 className="text-3xl font-black leading-[1.2] tracking-[-0.03em] text-slate-900 sm:text-5xl lg:text-[56px] lg:leading-[1.1] lg:tracking-[-0.04em]">
            {props.loggedIn ? (
              <>
                공부의 해답을,<br />
                <span className="text-[#3b66f5]">쌤버십 멘토에게</span>
              </>
            ) : (
              <>
                공부는 혼자,<br />
                <span className="text-[#3b66f5]">성장은 함께</span>
              </>
            )}
          </h1>
          <p className="mt-4 max-w-[480px] text-[15px] font-medium leading-relaxed text-slate-500 sm:mt-6 sm:text-[17px] lg:text-[18px]">
            검증된 대학생 멘토와 1:1로 연결되어
            <br />
            질문하고, 배우고, 함께 성장하세요.
          </p>
          <div className="mt-8 flex w-full min-w-0 flex-col gap-3 sm:mt-10 sm:flex-row sm:flex-wrap sm:gap-4">
            <Link
              href={props.loggedIn ? "/question-room" : "/mentors"}
              className="inline-flex w-full items-center justify-center rounded-[12px] bg-[#3b66f5] px-6 py-3.5 text-[15px] font-bold text-white shadow-xl shadow-blue-200 transition-all hover:-translate-y-0.5 hover:bg-[#2d52d1] sm:w-auto sm:px-10 sm:py-4 sm:text-[17px]"
            >
              {props.loggedIn ? "질문방 바로가기" : "멘토 찾기"}
            </Link>
            <Link
              href={props.loggedIn ? "/mentors" : "/signup"}
              className="inline-flex w-full items-center justify-center rounded-[12px] border border-[#3b66f5] px-6 py-3.5 text-[15px] font-bold text-[#3b66f5] transition-all hover:bg-blue-50 sm:w-auto sm:px-10 sm:py-4 sm:text-[17px]"
            >
              {props.loggedIn ? "멘토 찾기" : "무료 체험 시작하기"}
            </Link>
          </div>
        </div>

        <div className="relative z-20 flex w-full min-w-0 flex-1 justify-center lg:justify-end">
          <div className="relative aspect-[5/4] w-full max-w-[480px] sm:max-w-[540px] lg:aspect-auto lg:h-[440px]">
            <div className="absolute inset-0 overflow-hidden rounded-[24px] border border-slate-100 bg-white shadow-2xl sm:rounded-[36px] lg:rounded-[40px]">
              <Image
                src="/landing/hero-student-mentoring.png"
                alt="Korean student studying for mentoring"
                fill
                priority
                className="object-cover object-center"
                sizes="(max-width: 768px) 100vw, 540px"
              />
              <div className="absolute inset-0 bg-gradient-to-tr from-[#3b66f5]/5 to-transparent pointer-events-none" />
            </div>

            <div className="absolute -top-6 left-[10%] z-30 hidden w-fit min-w-[160px] animate-bounce-slow items-center gap-3 rounded-2xl border border-blue-50 bg-white p-3 shadow-xl sm:flex">
              <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-full border-2 border-white shadow-sm bg-blue-100 flex items-center justify-center">
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6 text-blue-500">
                  <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm0 18c-4.411 0-8-3.589-8-8s3.589-8 8-8 8 3.589 8 8-3.589 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z" />
                </svg>
              </div>
              <div className="whitespace-nowrap overflow-hidden">
                <p className="text-[12px] font-bold text-slate-800">대학생 멘토</p>
                <p className="text-[11px] font-medium text-slate-500">질문 답변 완료</p>
              </div>
            </div>

            <div className="absolute top-[15%] right-2 z-30 hidden w-fit min-w-[150px] animate-float-delayed items-center gap-3 rounded-2xl border border-orange-50 bg-white p-4 shadow-xl sm:flex lg:right-4">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-orange-100 text-orange-600">
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6">
                  <path d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zM12.75 6a.75.75 0 00-1.5 0v6c0 .414.336.75.75.75h4.5a.75.75 0 000-1.5h-3.75V6z" />
                </svg>
              </div>
              <div className="whitespace-nowrap overflow-hidden pr-2">
                <p className="text-[13px] font-bold text-slate-800">새 답변 도착</p>
              </div>
            </div>

            <div className="absolute bottom-[20%] left-2 z-30 hidden w-fit min-w-[170px] animate-float items-center gap-3 rounded-2xl border border-indigo-50 bg-white p-3 shadow-xl sm:flex lg:left-4">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600">
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                  <path d="M5.625 1.5c-1.036 0-1.875.84-1.875 1.875v17.25c0 1.035.84 1.875 1.875 1.875h12.75c1.035 0 1.875-.84 1.875-1.875V12.75A3.75 3.75 0 0016.5 9h-1.875V1.5H5.625z" />
                </svg>
              </div>
              <div className="whitespace-nowrap overflow-hidden pr-2">
                <p className="text-[12px] font-bold text-slate-800">학습 노트 업데이트</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        @keyframes float-delayed {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-15px); }
        }
        .animate-float { animation: float 4s ease-in-out infinite; }
        .animate-float-delayed { animation: float-delayed 5s ease-in-out infinite; animation-delay: 1s; }
        .animate-bounce-slow { animation: bounce-slow 6s ease-in-out infinite; }
      `}</style>
    </section>
  );
}
```
