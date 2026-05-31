import Link from "next/link";
import type { ReactNode } from "react";
import { ChevronDown, MessageCircle, User } from "lucide-react";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { ShellHeaderInner } from "@/components/shell/ShellHeaderInner";
import { getMainNavForRole } from "@/lib/shell/mainNavItems";
import { shellUserHeaderDisplay } from "@/lib/shell/userHeaderDisplay";
import type { NotificationBellItem } from "@/lib/notifications/notificationBellQueries";
import type { AppRole, UserRow } from "@/lib/types/user";

type ShellArea = "public" | "student" | "mentor" | "admin";

type AppShellProps = {
  area: ShellArea;
  children: ReactNode;
  sessionRole?: AppRole | null;
  userProfile?: UserRow | null;
  notificationBell?: {
    userId: string;
    role: AppRole;
    unreadCount: number;
    items: NotificationBellItem[];
  } | null;
};

const iconActionClass =
  "inline-flex h-9 w-9 shrink-0 items-center justify-center text-slate-500 transition hover:text-slate-800";

type HeaderActionsProps = {
  sessionRole: AppRole | null;
  userProfile?: UserRow | null;
  notificationBell?: AppShellProps["notificationBell"];
};

function ShellNotificationBell(props: { bell: NonNullable<AppShellProps["notificationBell"]> }) {
  return (
    <NotificationBell
      userId={props.bell.userId}
      role={props.bell.role}
      initialUnreadCount={props.bell.unreadCount}
      initialItems={props.bell.items}
      iconClassName={iconActionClass}
    />
  );
}

function HeaderActionsMobile({ sessionRole, userProfile, notificationBell }: HeaderActionsProps) {
  if (sessionRole == null || sessionRole === "admin") {
    return null;
  }

  const display = shellUserHeaderDisplay(userProfile ?? null, sessionRole);
  // 멘토는 상단 종(알림)·챗(메시지) 아이콘을 숨긴다. 질문방은 메인 네비 텍스트로 접근.
  const showInboxIcons = sessionRole !== "mentor";

  return (
    <>
      {showInboxIcons && notificationBell ? <ShellNotificationBell bell={notificationBell} /> : null}
      {showInboxIcons ? (
        <Link href="/question-room" className={iconActionClass} aria-label="메시지" title="메시지">
          <MessageCircle className="h-[18px] w-[18px] shrink-0" strokeWidth={2} />
        </Link>
      ) : null}
      <Link
        href={display.profileHref}
        className="inline-flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-slate-50 text-slate-500 transition hover:bg-slate-100"
        aria-label={display.primary}
        title={display.primary}
      >
        <User className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
      </Link>
    </>
  );
}

function HeaderActionsDesktop({ sessionRole, userProfile, notificationBell }: HeaderActionsProps) {
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

  const display = shellUserHeaderDisplay(userProfile ?? null, sessionRole);
  // 멘토는 상단 종(알림)·챗(메시지) 아이콘을 숨긴다. 질문방은 메인 네비 텍스트로 접근.
  const showInboxIcons = sessionRole !== "mentor";

  return (
    <div className="flex min-w-0 max-w-full items-center gap-3 sm:gap-4">
      {showInboxIcons && notificationBell ? <ShellNotificationBell bell={notificationBell} /> : null}
      {showInboxIcons ? (
        <Link href="/question-room" className={iconActionClass} aria-label="메시지" title="메시지">
          <MessageCircle className="h-[18px] w-[18px] shrink-0" strokeWidth={2} />
        </Link>
      ) : null}
      <Link
        href={display.profileHref}
        className="group flex min-w-0 max-w-full items-center gap-2 rounded-full border border-slate-200 bg-slate-50/80 py-0.5 pl-0.5 pr-2.5 transition hover:bg-slate-100 sm:pr-3"
      >
        <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-white text-slate-500 group-hover:border-slate-300">
          <User className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
        </span>
        <span className="hidden min-w-0 truncate text-sm font-bold text-slate-900 sm:inline">
          {sessionRole === "mentor" ? (
            <>
              {display.primary} {display.roleBadge}
            </>
          ) : (
            display.primary
          )}
        </span>
        {sessionRole !== "mentor" ? (
          <span className="shrink-0 rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-extrabold text-slate-600">
            {display.roleBadge}
          </span>
        ) : (
          <ChevronDown className="hidden h-4 w-4 shrink-0 text-slate-400 sm:block" aria-hidden />
        )}
      </Link>
      <a
        href="/logout"
        className="shrink-0 text-xs font-medium text-slate-500 underline-offset-2 hover:text-slate-800 hover:underline"
      >
        로그아웃
      </a>
    </div>
  );
}

export function AppShell({
  area,
  children,
  sessionRole = null,
  userProfile = null,
  notificationBell = null,
}: AppShellProps) {
  const mainNav = getMainNavForRole(sessionRole);
  const role = sessionRole ?? null;

  return (
    <div className="min-h-screen bg-white text-slate-900" data-shell-area={area}>
      <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/95 backdrop-blur-md">
        <div className="mx-auto w-full max-w-[1480px] px-4 sm:px-6 lg:px-8">
          <ShellHeaderInner
            items={mainNav}
            sessionRole={role}
            logo={<BrandLogo variant="shell" href="/" />}
            actions={<HeaderActionsDesktop sessionRole={role} userProfile={userProfile} notificationBell={notificationBell} />}
            mobileActions={<HeaderActionsMobile sessionRole={role} userProfile={userProfile} notificationBell={notificationBell} />}
          />
        </div>
      </header>
      <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}
