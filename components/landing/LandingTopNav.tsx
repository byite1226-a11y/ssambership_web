"use client";

import Link from "next/link";
import type { UserRow } from "@/lib/types/user";
import type { User } from "@supabase/supabase-js";
import { LandingMainNav } from "@/components/landing/LandingMainNav";

function profileHref(profile: UserRow | null): string {
  if (!profile) return "/login/student";
  if (profile.role === "mentor") return "/mentor/profile";
  if (profile.role === "admin") return "/admin";
  return "/mypage";
}

export function LandingTopNav(props: { user: User | null; profile: UserRow | null }) {
  const logged = Boolean(props.user);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-100 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-[72px] w-full max-w-[1280px] items-center justify-between px-6">
        <div className="flex items-center gap-12">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#142d61] text-white">
              <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current">
                <path d="M3 10 12 4l9 6-9 6-9-6Zm2.5 2.8L12 17l6.5-4.2V16L12 20l-6.5-4v-3.2Z" />
              </svg>
            </div>
            <span className="text-[20px] font-black tracking-tight text-[#142d61]">쌤버십</span>
          </Link>
          <LandingMainNav />
        </div>

        <div className="flex items-center gap-5">
          <button className="text-slate-400 hover:text-slate-600 transition-colors">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-5 w-5">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
          </button>

          {logged ? (
            <div className="flex items-center gap-4">
              <button className="relative text-slate-400 hover:text-slate-600 transition-colors">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="h-6 w-6">
                  <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
                  <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
                </svg>
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">3</span>
              </button>
              <button className="relative text-slate-400 hover:text-slate-600 transition-colors">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="h-6 w-6">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">5</span>
              </button>
              <Link href={profileHref(props.profile)} className="flex items-center gap-2 rounded-full hover:bg-slate-50 p-0.5 pr-3 transition-colors">
                <div className="h-8 w-8 overflow-hidden rounded-full border border-slate-100 bg-slate-100 flex items-center justify-center text-slate-400">
                  {/* Neutral fallback icon instead of random dicebear */}
                  <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                  </svg>
                </div>
                <span className="text-[14px] font-bold text-slate-800">{props.profile?.full_name || props.profile?.nickname || "사용자"} 님</span>
                <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 text-slate-400">
                  <path fillRule="evenodd" d="M5.22 8.22a.75.75 0 011.06 0L10 11.94l3.72-3.72a.75.75 0 111.06 1.06l-4.25 4.25a.75.75 0 01-1.06 0L5.22 9.28a.75.75 0 010-1.06z" clipRule="evenodd" />
                </svg>
              </Link>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link 
                href="/login" 
                className="rounded-[10px] border border-slate-200 px-5 py-2 text-[14px] font-bold text-slate-600 hover:bg-slate-50 transition-colors"
              >
                로그인
              </Link>
              <Link 
                href="/signup" 
                className="rounded-[10px] bg-[#3b66f5] px-5 py-2 text-[14px] font-bold text-white hover:bg-[#2d52d1] transition-shadow hover:shadow-lg transition-colors"
              >
                회원가입
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
