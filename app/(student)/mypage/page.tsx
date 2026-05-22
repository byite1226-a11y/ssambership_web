import { redirect } from "next/navigation";
import Link from "next/link";
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

  const activeMentorCount = activeSubs.error ? bundle.subscriptions.valueText : String(activeSubs.count);

  const { roomCount } = bundle;
  const roomText = roomCount.error
    ? "질문방 목록을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요."
    : roomCount.n === 0
      ? "아직 열린 질문방이 없습니다. 멘토와 맺은 방이 여기에 이어집니다."
      : `연결된 질문방 ${roomCount.n}개입니다.`;

  return (
    <StudentDashboardShell
      activeTab="home"
      user={user}
      profile={profile}
      profileLoadError={profileLoadError?.message ?? null}
      bundle={bundle}
      cashBalanceKrw={cashBalanceKrw}
    >
      <div className="space-y-6">
        <header>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">마이페이지</h1>
          <p className="mt-1 text-sm text-slate-500">
            내 프로필, 구독, 질문방, 결제, 알림 현황을 한곳에서 보세요.
          </p>
        </header>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="flex h-24 flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-slate-300">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">내 질문방</p>
            <h3 className="text-xl font-black text-slate-900">
              {roomCount.n ?? 0} <span className="text-xs font-normal text-slate-400">개</span>
            </h3>
          </div>
          <div className="flex h-24 flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-slate-300">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">구독 중인 멘토</p>
            <h3 className="text-xl font-black text-slate-900">
              {activeMentorCount || "0"} <span className="text-xs font-normal text-slate-400">명</span>
            </h3>
          </div>
          <div className="flex h-24 flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-slate-300">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">결제 및 주문</p>
            <h3 className="text-xl font-black text-slate-900">
              {bundle.payments.valueText || "0"} <span className="text-xs font-normal text-slate-400">건</span>
            </h3>
          </div>
        </div>

        <section className="flex min-h-[144px] flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
          <div>
            <h2 className="text-base font-bold text-slate-900">최근 질문 및 상담</h2>
            <p className="mt-2 text-sm font-medium leading-relaxed text-slate-600">{roomText}</p>
            {roomCount.error ? (
              <p className="mt-1 text-xs text-amber-800">
                정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.
              </p>
            ) : null}
          </div>
          <div className="mt-3">
            <Link
              className="inline-block select-none rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700"
              href="/question-room"
            >
              질문방 바로가기
            </Link>
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-2">
          <MypageSubscriptionsCard />

          <section className="flex min-h-[280px] flex-col rounded-2xl border border-slate-200/80 bg-white p-8 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">결제 · 캐시</p>
            <p className="mt-2 text-4xl font-black tabular-nums text-[#1A56DB]">
              {cashBalanceKrw.toLocaleString("ko-KR")}
              <span className="ml-2 text-base font-bold text-slate-500">캐시</span>
            </p>
            <div className="mt-6 min-h-0 flex-1 space-y-2">
              <p className="text-xs font-bold text-slate-500">최근 내역</p>
              {walletData.ledgerPreview.error ? (
                <p className="text-xs text-red-700">내역을 불러오지 못했습니다.</p>
              ) : walletData.ledgerPreview.rows.length === 0 ? (
                <p className="text-xs text-slate-500">최근 사용 내역이 없습니다.</p>
              ) : (
                <ul className="divide-y divide-slate-100 text-sm">
                  {walletData.ledgerPreview.rows.slice(0, 3).map((row, i) => {
                    const r = row as Record<string, unknown>;
                    const credit = ledgerIsCredit(r);
                    return (
                      <li key={typeof r.id === "string" ? r.id : `ledger-${i}`} className="flex items-center justify-between gap-2 py-2">
                        <div className="min-w-0">
                          <p className="truncate font-medium text-slate-700">{ledgerReasonLabel(r)}</p>
                          <p className="text-[11px] text-slate-400">{ledgerAt(r)}</p>
                        </div>
                        <span className={`shrink-0 font-bold tabular-nums ${credit ? "text-blue-600" : "text-red-600"}`}>
                          {ledgerAmountLabel(r)}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
            <div className="mt-6 flex flex-wrap gap-2">
              <Link
                className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700"
                href="/wallet/charge"
              >
                충전하기
              </Link>
              <Link
                className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50"
                href="/wallet/ledger"
              >
                사용내역
              </Link>
            </div>
          </section>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          <section className="flex min-h-[180px] flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-8 shadow-sm">
            <div>
              <p className="text-3xl" aria-hidden>
                🔔
              </p>
              <h2 className="mt-3 text-sm font-bold text-slate-500">알림</h2>
              <p className="mt-1 text-3xl font-black text-slate-900">{bundle.notifications.valueText}</p>
              <p className="mt-1 text-xs text-slate-500">{bundle.notifications.detail}</p>
            </div>
            <div className="mt-4 select-none">
              <Link
                className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:underline"
                href="/notifications"
              >
                알림 센터 &rarr;
              </Link>
            </div>
          </section>

          <section className="flex min-h-[180px] flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-8 shadow-sm">
            <div>
              <p className="text-3xl" aria-hidden>
                💬
              </p>
              <h2 className="mt-3 text-sm font-bold text-slate-500">고객지원</h2>
              <p className="mt-1 text-xs font-medium leading-relaxed text-slate-600">
                맞춤의뢰 진행 중 접수한 분쟁과 처리 상태를 확인할 수 있어요.
              </p>
            </div>
            <div className="mt-4 select-none">
              <Link
                className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:underline"
                href="/support/disputes"
              >
                분쟁·환불 현황 &rarr;
              </Link>
            </div>
          </section>

          <section className="flex min-h-[180px] flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-8 shadow-sm md:col-span-2 lg:col-span-1">
            <div>
              <p className="text-3xl" aria-hidden>
                ⭐
              </p>
              <h2 className="mt-3 text-sm font-bold text-slate-500">리뷰 · 신고</h2>
              <p className="mt-1 text-3xl font-black text-slate-900">{bundle.reviews.valueText}</p>
              <p className="mt-1 text-xs text-slate-500">{bundle.reviews.detail}</p>
              <p className="mt-3 text-2xl font-black text-slate-800">{bundle.reports.valueText}</p>
              <p className="text-xs text-slate-500">{bundle.reports.detail}</p>
            </div>
            <p className="mt-2 select-none text-[10px] leading-tight text-slate-400">
              작성한 리뷰와 제출한 신고는 운영 정책에 따라 안내됩니다.
            </p>
          </section>
        </div>
      </div>
    </StudentDashboardShell>
  );
}
