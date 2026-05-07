import Link from "next/link";
import type { ReactNode } from "react";
import { Bell, MessageCircle, Search, User } from "lucide-react";
import type { AppRole } from "@/lib/types/user";
import { ShellHeaderInner } from "@/components/shell/ShellHeaderInner";

type ShellArea = "public" | "student" | "mentor" | "admin";

type AppShellProps = {
  area: ShellArea;
  children: ReactNode;
  sessionRole?: AppRole | null;
};

type NavItem = { href: string; label: string };

const publicNav: NavItem[] = [
  { href: "/mentors", label: "멘토 찾기" },
  { href: "/question-room", label: "질문방" },
  { href: "/community", label: "커뮤니티" },
  { href: "/custom-request", label: "맞춤의뢰" },
  { href: "/cash", label: "캐시결제" },
];

const studentNav: NavItem[] = [
  { href: "/mentors", label: "멘토 찾기" },
  { href: "/question-room", label: "질문방" },
  { href: "/community", label: "커뮤니티" },
  { href: "/custom-request", label: "맞춤의뢰" },
  { href: "/cash", label: "캐시결제" },
  { href: "/mypage", label: "마이페이지" },
];

const mentorNav: NavItem[] = [
  { href: "/mentors", label: "멘토 찾기" },
  { href: "/mentor/question-room", label: "질문방" },
  { href: "/community", label: "커뮤니티" },
  { href: "/custom-request", label: "맞춤의뢰" },
  { href: "/mentor/payouts", label: "정산" },
  { href: "/mentor/profile", label: "프로필" },
];

const adminNav: NavItem[] = [
  { href: "/mentors", label: "멘토 찾기" },
  { href: "/question-room", label: "질문방" },
  { href: "/community", label: "커뮤니티" },
  { href: "/custom-request", label: "맞춤의뢰" },
  { href: "/cash", label: "캐시결제" },
  { href: "/admin", label: "관리" },
];

const iconActionClass =
  "inline-flex h-9 w-9 shrink-0 items-center justify-center text-slate-500 transition hover:text-slate-800";

function getMainNav(sessionRole: AppRole | null | undefined): NavItem[] {
  if (sessionRole == null) return publicNav;
  if (sessionRole === "mentor") return mentorNav;
  if (sessionRole === "admin") return adminNav;
  return studentNav;
}

type HeaderActionsProps = { sessionRole: AppRole | null };

function HeaderActions({ sessionRole }: HeaderActionsProps) {
  if (sessionRole == null) {
    return (
      <div className="flex items-center gap-4">
        <Link
          href="/login"
          className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-bold text-slate-700 hover:bg-slate-50"
        >
          로그인
        </Link>
        <Link
          href="/signup"
          className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-bold text-white hover:bg-blue-700"
        >
          회원가입
        </Link>
      </div>
    );
  }

  if (sessionRole === "admin") {
    return (
      <div className="flex items-center gap-4">
        <span className="rounded-full border border-violet-200 bg-violet-50 px-2 py-0.5 text-xs font-bold text-violet-800">
          Admin
        </span>
        <span className="text-sm font-bold text-slate-900">관리자</span>
        <a
          href="/logout"
          className="shrink-0 text-xs font-medium text-slate-500 underline-offset-2 hover:text-slate-800 hover:underline"
        >
          로그아웃
        </a>
      </div>
    );
  }

  const messageHref = sessionRole === "mentor" ? "/mentor/question-room" : "/question-room";

  return (
    <div className="flex min-w-0 max-w-full items-center gap-4">
      <Link href="/mentors" className={iconActionClass} aria-label="멘토 찾기" title="멘토 찾기">
        <Search className="h-[18px] w-[18px] shrink-0" strokeWidth={2} />
      </Link>
      <Link href="/notifications" className={iconActionClass} aria-label="알림" title="알림">
        <Bell className="h-[18px] w-[18px] shrink-0" strokeWidth={2} />
      </Link>
      <Link href={messageHref} className={iconActionClass} aria-label="메시지" title="메시지">
        <MessageCircle className="h-[18px] w-[18px] shrink-0" strokeWidth={2} />
      </Link>
      {sessionRole === "mentor" ? (
        <span className="shrink-0 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-bold text-emerald-800">
          Mentor
        </span>
      ) : null}
      {sessionRole === "student" ? (
        <Link
          href="/mypage"
          className="group flex min-w-0 max-w-full items-center gap-1.5 text-sm font-bold text-slate-900"
        >
          <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-slate-100 text-slate-600 group-hover:border-slate-300">
            <User className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
          </span>
          <span>학생</span>
        </Link>
      ) : null}
      {sessionRole === "mentor" ? (
        <Link
          href="/mentor/profile"
          className="shrink-0 text-sm font-bold text-slate-900 hover:underline"
        >
          멘토
        </Link>
      ) : null}
      <a
        href="/logout"
        className="shrink-0 text-xs font-medium text-slate-500 underline-offset-2 hover:text-slate-800 hover:underline"
      >
        로그아웃
      </a>
    </div>
  );
}

export function AppShell({ area, children, sessionRole = null }: AppShellProps) {
  const mainNav = getMainNav(sessionRole);
  return (
    <div className="min-h-screen bg-white text-slate-900" data-shell-area={area}>
      <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/95 backdrop-blur-md">
        <div className="mx-auto w-full max-w-[1480px] px-4 sm:px-6 lg:px-8">
          <ShellHeaderInner
            items={mainNav}
            sessionRole={sessionRole ?? null}
            logo={
              <Link
                href="/"
                className="shrink-0 text-lg font-black tracking-tight text-blue-700 sm:text-xl"
              >
                쌤버십
              </Link>
            }
            actions={
              <div className="flex min-w-0 shrink-0 items-center">
                <HeaderActions sessionRole={sessionRole ?? null} />
              </div>
            }
          />
        </div>
      </header>
      <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}
