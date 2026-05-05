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
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex h-16 w-full max-w-7xl flex-wrap items-center justify-between gap-3 px-4 sm:px-6">
        <Link href="/" className="text-xl font-black tracking-tight text-blue-700">
          쌤버십
        </Link>
        <LandingMainNav />
        <div className="flex items-center gap-2">
          {logged ? (
            <>
              <span
                className="rounded-lg border border-dashed border-slate-300 px-2.5 py-1 text-xs font-bold text-slate-500"
                title="알림(후속)"
              >
                알림
              </span>
              <Link
                href={profileHref(props.profile)}
                className="rounded-lg bg-slate-900 px-3 py-1.5 text-sm font-bold text-white hover:bg-slate-800"
              >
                프로필
              </Link>
            </>
          ) : (
            <>
              <Link href="/login" className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-bold text-slate-800">
                로그인
              </Link>
              <Link href="/signup" className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-bold text-white hover:bg-blue-500">
                회원가입
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
