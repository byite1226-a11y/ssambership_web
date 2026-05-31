import Link from "next/link";
import React from "react";

interface UserLike {
  email?: string | null;
}
interface ProfileLike {
  full_name?: string | null;
  nickname?: string | null;
  email?: string | null;
  grade_level?: string | null;
  student_status?: string | null;
}

type Props = {
  activeTab: "home" | "subscriptions" | "wallet" | "questions" | "custom" | "notifications" | "support";
  user: UserLike | null;
  profile: ProfileLike | null;
  profileLoadError: string | null;
  cashBalanceKrw?: number;
  children: React.ReactNode;
};

const NAV_ITEMS: { tab: Props["activeTab"]; href: string; label: string; icon: string }[] = [
  { tab: "home", href: "/mypage", label: "마이페이지", icon: "📑" },
  { tab: "subscriptions", href: "/subscriptions", label: "구독 현황", icon: "📅" },
  { tab: "wallet", href: "/wallet/charge", label: "내 캐시", icon: "💰" },
  { tab: "questions", href: "/question-room", label: "내 질문 & 답변", icon: "💬" },
  { tab: "custom", href: "/custom-request/orders", label: "맞춤의뢰 내역", icon: "📋" },
  { tab: "notifications", href: "/notifications", label: "알림", icon: "🔔" },
  { tab: "support", href: "/support/disputes", label: "분쟁·환불 현황", icon: "⚠️" },
];

export function StudentDashboardShell({
  activeTab,
  user,
  profile,
  profileLoadError,
  cashBalanceKrw = 0,
  children,
}: Props) {
  const name = profile?.full_name?.trim() || profile?.nickname?.trim() || user?.email || "—";
  const emailLine = profile?.email?.trim() || user?.email || "";
  const schoolLine = profile?.grade_level?.trim() || "";

  return (
    <div className="mx-auto max-w-[1320px] px-4 py-8 antialiased">
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-4">
        <aside className="space-y-5 lg:col-span-1">
          <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
            <p className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-400">마이페이지</p>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-blue-100 bg-blue-50 text-xl font-bold text-blue-600">
                {name.charAt(0)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <h3 className="truncate text-base font-extrabold leading-tight text-slate-900">{name}</h3>
                  <span className="shrink-0 rounded border border-blue-100 bg-blue-50 px-1.5 py-0.5 text-[10px] font-bold text-blue-600">
                    학생
                  </span>
                </div>
                {emailLine ? (
                  <p className="mt-1 truncate text-xs font-medium leading-tight text-slate-500">{emailLine}</p>
                ) : null}
                {schoolLine ? (
                  <p className="truncate text-xs font-medium leading-tight text-slate-500">{schoolLine}</p>
                ) : null}
              </div>
            </div>
            {profileLoadError ? (
              <p className="mt-2 text-xs font-semibold leading-tight text-amber-600">{profileLoadError}</p>
            ) : null}
          </section>

          <nav className="space-y-1 rounded-2xl border border-slate-200/80 bg-white p-3 shadow-sm">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-bold transition duration-150 ${
                  activeTab === item.tab
                    ? "bg-blue-50 font-extrabold text-blue-700"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <span aria-hidden>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>
        </aside>

        <div className="min-w-0 lg:col-span-2">{children}</div>

        <aside className="space-y-4 lg:col-span-1">
          <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">내 캐시</p>
            <h3 className="mt-2 text-3xl font-black text-[#1A56DB]">
              {cashBalanceKrw.toLocaleString("ko-KR")}
              <span className="ml-1 text-sm font-bold text-slate-500">캐시</span>
            </h3>
            <div className="mt-4 flex flex-col gap-2">
              <Link
                href="/wallet/charge"
                className="inline-flex w-full items-center justify-center rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700"
              >
                충전하기
              </Link>
              <Link
                href="/wallet/ledger"
                className="inline-flex w-full items-center justify-center rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50"
              >
                사용내역
              </Link>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
