import { redirect } from "next/navigation";
import Link from "next/link";
import { Bell, HelpCircle, Star } from "lucide-react";
import { getServerUserWithProfile } from "@/lib/auth/getServerUserWithProfile";
import { createClient } from "@/lib/supabase/server";
import { fetchWalletBalanceByUserId } from "@/lib/cash/cashQueries";
import { parseWalletBalanceKrw } from "@/lib/cash/parseWalletBalanceKrw";
import { loadStudentMypageBundle } from "@/lib/mypage/mypageQueries";
import { loadWalletChargePageData } from "@/lib/cash/walletRouteData";
import {
  ledgerAmountLabel,
  ledgerAt,
  ledgerIsCredit,
  ledgerReasonLabel,
} from "@/lib/cash/ledgerRowDisplay";
import { countActiveSubscriptionsForStudent } from "@/lib/mypage/studentActiveSubscriptions";
import { MypageSubscriptionsCard } from "@/components/mypage/MypageSubscriptionsCard";
import { StudentDashboardShell } from "@/components/mypage/StudentDashboardShell";

export default async function StudentMyPage() {
  const { user, profile, error: profileLoadError } = await getServerUserWithProfile();
  if (!user) {
    redirect(`/login/student?next=${encodeURIComponent("/mypage")}`);
  }

  const supabase = await createClient();
  const [bundle, activeSubs, balance, walletData] = await Promise.all([
    loadStudentMypageBundle(supabase, user.id, profile, profileLoadError?.message ?? null),
    countActiveSubscriptionsForStudent(supabase, user.id),
    fetchWalletBalanceByUserId(supabase, user.id),
    loadWalletChargePageData(supabase, user.id),
  ]);
  const cashBalanceKrw = parseWalletBalanceKrw(balance.row);

  const activeMentorCount = activeSubs.error ? 0 : activeSubs.count;
  const activeMentorText = activeSubs.error ? "—" : String(activeMentorCount);
  const paymentCount = bundle.payments.valueText || "0";

  const { roomCount } = bundle;
  const roomText = roomCount.error
    ? "질문방 목록을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요."
    : roomCount.n === 0
      ? "아직 열린 질문방이 없습니다. 멘토와 맺은 방이 여기에 이어집니다."
      : `연결된 질문방 ${roomCount.n}개 · 최근 질문과 답변을 확인하세요.`;

  const ledgerPreview = (
    <>
      <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-wide text-slate-400">결제 · 캐시</p>
        <p className="mt-2 text-2xl font-black tabular-nums text-[#1A56DB]">
          {cashBalanceKrw.toLocaleString("ko-KR")}
          <span className="ml-1 text-sm font-bold text-slate-500">캐시</span>
        </p>
        <div className="mt-4 space-y-2">
          <p className="text-xs font-bold text-slate-500">최근 내역</p>
          {walletData.ledgerPreview.error ? (
            <p className="text-xs text-red-700">내역을 불러오지 못했습니다.</p>
          ) : walletData.ledgerPreview.rows.length === 0 ? (
            <p className="text-xs text-slate-500">최근 사용 내역이 없습니다.</p>
          ) : (
            <ul className="divide-y divide-slate-100 text-sm">
              {walletData.ledgerPreview.rows.slice(0, 5).map((row, i) => {
                const r = row as Record<string, unknown>;
                const credit = ledgerIsCredit(r);
                return (
                  <li
                    key={typeof r.id === "string" ? r.id : `ledger-${i}`}
                    className="flex items-center justify-between gap-2 py-2"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-medium text-slate-700">{ledgerReasonLabel(r)}</p>
                      <p className="text-[11px] text-slate-400">{ledgerAt(r)}</p>
                    </div>
                    <span
                      className={`shrink-0 text-[13px] font-bold tabular-nums ${credit ? "text-blue-600" : "text-red-600"}`}
                    >
                      {ledgerAmountLabel(r)}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
        <div className="mt-4 flex flex-col gap-2">
          <Link
            className="inline-flex w-full items-center justify-center rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700"
            href="/wallet/charge"
          >
            충전하기
          </Link>
          <Link
            className="inline-flex w-full items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50"
            href="/wallet/ledger"
          >
            사용내역 전체
          </Link>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
        <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">알림 · 지원 · 리뷰</p>
        <ul className="divide-y divide-slate-100 text-sm">
          <li className="flex items-center justify-between gap-2 py-2.5">
            <span className="inline-flex items-center gap-2 font-medium text-slate-700">
              <Bell className="h-4 w-4 text-[#1A56DB]" strokeWidth={2} aria-hidden />
              알림
            </span>
            <Link href="/notifications" className="text-xs font-bold text-blue-600 hover:underline">
              {bundle.notifications.valueText} · 센터 →
            </Link>
          </li>
          <li className="flex items-center justify-between gap-2 py-2.5">
            <span className="inline-flex items-center gap-2 font-medium text-slate-700">
              <HelpCircle className="h-4 w-4 text-[#1A56DB]" strokeWidth={2} aria-hidden />
              고객지원
            </span>
            <Link href="/support/disputes" className="text-xs font-bold text-blue-600 hover:underline">
              분쟁·환불 →
            </Link>
          </li>
          <li className="flex items-center justify-between gap-2 py-2.5">
            <span className="inline-flex items-center gap-2 font-medium text-slate-700">
              <Star className="h-4 w-4 text-amber-500" strokeWidth={2} aria-hidden />
              리뷰 · 신고
            </span>
            <span className="text-right text-xs text-slate-500">
              {bundle.reviews.valueText} · {bundle.reports.valueText}
            </span>
          </li>
        </ul>
      </section>
    </>
  );

  return (
    <StudentDashboardShell
      activeTab="home"
      user={user}
      profile={profile}
      profileLoadError={profileLoadError?.message ?? null}
      cashBalanceKrw={cashBalanceKrw}
      learningSummary={{
        roomCount: roomCount.n ?? 0,
        activeMentorCount,
        paymentCount,
      }}
      ledgerPreview={ledgerPreview}
    >
      <div className="space-y-6">
        <header>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">마이페이지</h1>
          <p className="mt-1 text-sm text-slate-500">진행 중인 질문과 구독 현황을 확인하세요.</p>
        </header>

        <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-900">진행 중인 질문</h2>
              <p className="mt-2 text-sm font-medium leading-relaxed text-slate-600">{roomText}</p>
              {roomCount.error ? (
                <p className="mt-1 text-xs text-amber-800">정보를 불러오지 못했습니다.</p>
              ) : null}
            </div>
            <p className="text-2xl font-black text-slate-900">
              {roomCount.n ?? 0}
              <span className="ml-1 text-xs font-normal text-slate-400">질문방</span>
            </p>
          </div>
          <div className="mt-4">
            <Link
              className="inline-block select-none rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700"
              href="/question-room"
            >
              질문방 바로가기
            </Link>
          </div>
        </section>

        <MypageSubscriptionsCard />

        <section className="rounded-2xl border border-slate-200/80 bg-slate-50/60 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
            <p className="font-medium text-slate-600">
              구독 멘토 <span className="font-black text-slate-900">{activeMentorText}명</span>
              <span className="mx-2 text-slate-300">·</span>
              맞춤의뢰·결제 <span className="font-black text-slate-900">{paymentCount}건</span>
            </p>
            <Link href="/custom-request/orders" className="text-xs font-bold text-blue-600 hover:underline">
              맞춤의뢰 내역 →
            </Link>
          </div>
        </section>
      </div>
    </StudentDashboardShell>
  );
}
