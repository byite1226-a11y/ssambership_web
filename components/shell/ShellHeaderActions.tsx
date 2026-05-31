"use client";

import Link from "next/link";
import { ChevronDown, MessageCircle, User } from "lucide-react";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { shellUserHeaderDisplay, resolveShellUserDisplayName } from "@/lib/shell/userHeaderDisplay";
import type { NotificationBellItem } from "@/lib/notifications/notificationBellQueries";
import type { AppRole, UserRow } from "@/lib/types/user";

const iconActionClass =
  "inline-flex h-9 w-9 shrink-0 items-center justify-center text-slate-500 transition hover:text-slate-800";

type BellProps = {
  userId: string;
  role: AppRole;
  unreadCount: number;
  items: NotificationBellItem[];
};

type HeaderActionsProps = {
  sessionRole: AppRole;
  userProfile?: UserRow | null;
  notificationBell?: BellProps | null;
};

function ShellNotificationBell(props: { bell: BellProps }) {
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

export function ShellHeaderActionsMobile({ sessionRole, userProfile, notificationBell }: HeaderActionsProps) {
  if (sessionRole === "admin") return null;

  const display = shellUserHeaderDisplay(userProfile ?? null, sessionRole);
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

export function ShellHeaderActionsDesktop({ sessionRole, userProfile, notificationBell }: HeaderActionsProps) {
  const display = shellUserHeaderDisplay(userProfile ?? null, sessionRole);
  const displayName = resolveShellUserDisplayName(userProfile ?? null, sessionRole);
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
          {displayName} {display.roleBadge}
        </span>
        {sessionRole === "mentor" ? (
          <ChevronDown className="hidden h-4 w-4 shrink-0 text-slate-400 sm:block" aria-hidden />
        ) : null}
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

export function ShellHeaderGuestActions() {
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

export function ShellHeaderAdminActions() {
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
