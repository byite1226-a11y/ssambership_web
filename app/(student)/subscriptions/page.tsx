import { redirect } from "next/navigation";
import Link from "next/link";
import { getServerUserWithProfile } from "@/lib/auth/getServerUserWithProfile";
import { createClient } from "@/lib/supabase/server";
import { fetchWalletBalanceByUserId } from "@/lib/cash/cashQueries";
import { parseWalletBalanceKrw } from "@/lib/cash/parseWalletBalanceKrw";
import {
  requestSubscriptionCancelAtPeriodEndAction,
  undoSubscriptionCancelAtPeriodEndAction,
} from "@/lib/subscribe/subscriptionCancelActions";
import { loadStudentSubscriptionManagementList } from "@/lib/subscribe/studentSubscriptionManagement";
import { StudentDashboardShell } from "@/components/mypage/StudentDashboardShell";
import { FormSubmitButton } from "@/components/qna/FormSubmitButton";

type PageProps = { searchParams?: Promise<Record<string, string | string[] | undefined>> };

function firstParam(value: string | string[] | undefined): string | null {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value[0] ?? null;
  return null;
}

function subscriptionStatusBadgeClass(tone: string): string {
  switch (tone) {
    case "active":
      return "border-blue-100 bg-blue-50 text-blue-700";
    case "scheduled":
    case "pastDue":
      return "border-amber-100 bg-amber-50 text-amber-700";
    case "expired":
    case "refunded":
    case "neutral":
    default:
      return "border-slate-200 bg-slate-50 text-slate-600";
  }
}

export default async function StudentSubscriptionsPage(props: PageProps) {
  const sp = (await props.searchParams) ?? {};
  const flashOk = firstParam(sp.ok);
  const flashError = firstParam(sp.error);
  const { user, profile, error: profileLoadError } = await getServerUserWithProfile();
  if (!user) {
    redirect(`/login/student?next=${encodeURIComponent("/subscriptions")}`);
  }

  const supabase = await createClient();
  const [balance, subscriptionList] = await Promise.all([
    fetchWalletBalanceByUserId(supabase, user.id),
    loadStudentSubscriptionManagementList(supabase, user.id),
  ]);
  const cashBalanceKrw = parseWalletBalanceKrw(balance.row);
  const activeCount = subscriptionList.items.filter((item) => item.status === "active" && !item.cancelAtPeriodEnd).length;
  const scheduledCancelCount = subscriptionList.items.filter((item) => item.statusTone === "scheduled").length;

  return (
    <StudentDashboardShell
      activeTab="subscriptions"
      user={user}
      profile={profile}
      profileLoadError={profileLoadError?.message ?? null}
      cashBalanceKrw={cashBalanceKrw}
    >
      <div className="space-y-6">
        <header>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">구독 현황</h1>
          <p className="mt-1 text-sm text-slate-500">이용 중인 멘토 플랜과 다음 갱신, 해지·환불 상태를 확인하세요.</p>
        </header>

        {flashOk ? (
          <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-900">
            {flashOk}
          </p>
        ) : null}
        {flashError ? (
          <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-900">
            {flashError}
          </p>
        ) : null}

        {/* Top Summary Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm flex flex-col justify-between h-24">
            <p className="text-xs font-bold text-slate-500 uppercase">구독 중인 멘토</p>
            <h3 className="text-xl font-black text-slate-900">{activeCount} <span className="text-xs font-normal text-slate-400">명</span></h3>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm flex flex-col justify-between h-24">
            <p className="text-xs font-bold text-slate-500 uppercase">전체 구독 기록</p>
            <h3 className="text-xl font-black text-slate-900">{subscriptionList.items.length} <span className="text-xs font-normal text-slate-400">건</span></h3>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm flex flex-col justify-between h-24">
            <p className="text-xs font-bold text-slate-500 uppercase">해지 예약</p>
            <h3 className="text-xl font-black text-slate-900">{scheduledCancelCount} <span className="text-xs font-normal text-slate-400">건</span></h3>
          </div>
        </div>

        {/* Tab Menu */}
        <div className="border-b border-slate-200 flex gap-1 select-none">
          <button
            type="button"
            disabled
            title="필터 API 연결 후 활성화됩니다."
            className="px-4 py-2 text-sm font-extrabold border-b-2 border-blue-600 text-blue-600 cursor-default"
          >
            전체
          </button>
          <button
            type="button"
            disabled
            title="필터 API 연결 후 활성화됩니다."
            className="px-4 py-2 text-sm font-semibold text-slate-400 cursor-not-allowed"
          >
            구독 중
          </button>
          <button
            type="button"
            disabled
            title="필터 API 연결 후 활성화됩니다."
            className="px-4 py-2 text-sm font-semibold text-slate-400 cursor-not-allowed"
          >
            만료 예정
          </button>
          <button
            type="button"
            disabled
            title="필터 API 연결 후 활성화됩니다."
            className="px-4 py-2 text-sm font-semibold text-slate-400 cursor-not-allowed"
          >
            만료됨
          </button>
        </div>

        {subscriptionList.error ? (
          <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900">
            구독 목록을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.
          </p>
        ) : null}

        {subscriptionList.items.length > 0 ? (
          <section className="space-y-4">
            {subscriptionList.items.map((item) => (
              <article key={item.subscriptionId} className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-lg font-black text-slate-900">{item.mentorName}</h2>
                      <span className="rounded-full border border-blue-100 bg-blue-50 px-2.5 py-1 text-xs font-extrabold text-blue-700">
                        {item.planLabel}
                      </span>
                      <span
                        className={`rounded-full border px-2.5 py-1 text-xs font-extrabold ${subscriptionStatusBadgeClass(item.statusTone)}`}
                      >
                        {item.statusLabel}
                      </span>
                    </div>
                    <dl className="grid gap-3 text-sm sm:grid-cols-2 xl:grid-cols-4">
                      <div className="rounded-xl bg-slate-50 px-4 py-3">
                        <dt className="text-xs font-bold text-slate-500">현재 기간</dt>
                        <dd className="mt-1 font-extrabold text-slate-900">{item.currentPeriodLabel}</dd>
                      </div>
                      <div className="rounded-xl bg-slate-50 px-4 py-3">
                        <dt className="text-xs font-bold text-slate-500">다음 결제일</dt>
                        <dd className="mt-1 font-extrabold text-slate-900">{item.nextBillingDisplayLabel}</dd>
                      </div>
                      <div className="rounded-xl bg-slate-50 px-4 py-3">
                        <dt className="text-xs font-bold text-slate-500">주간 질문 한도</dt>
                        <dd className="mt-1 font-extrabold text-slate-900">{item.weeklyQuestionLimitLabel}</dd>
                      </div>
                      <div className="rounded-xl bg-slate-50 px-4 py-3">
                        <dt className="text-xs font-bold text-slate-500">질문 리셋</dt>
                        <dd className="mt-1 font-extrabold text-slate-900">{item.weeklyResetLabel}</dd>
                      </div>
                      <div className="rounded-xl bg-slate-50 px-4 py-3 sm:col-span-2 xl:col-span-4">
                        <dt className="text-xs font-bold text-slate-500">예상 잔여 환불액</dt>
                        <dd className="mt-1 font-extrabold text-slate-900">{item.refundEstimateLabel}</dd>
                      </div>
                    </dl>
                    {item.cancelAtPeriodEnd ? (
                      <p className="text-xs font-semibold text-amber-700">
                        현재 기간({item.currentPeriodEndLabel})까지 이용 가능하며 이후 자동 만료됩니다.
                      </p>
                    ) : null}
                    {item.pendingRefundId ? (
                      <p className="text-xs font-semibold text-blue-700">
                        잔여기간 환불 신청이 관리자 검토 대기 중입니다.
                      </p>
                    ) : null}
                  </div>

                  <div className="flex flex-col gap-2 sm:flex-row lg:min-w-[360px] lg:justify-end">
                    {item.canCancel ? (
                      <form action={requestSubscriptionCancelAtPeriodEndAction}>
                        <input type="hidden" name="subscriptionId" value={item.subscriptionId} />
                        <FormSubmitButton
                          idleLabel="해지 예약"
                          pendingLabel="저장 중..."
                          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-extrabold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                        />
                      </form>
                    ) : null}
                    {item.canUndoCancel ? (
                      <form action={undoSubscriptionCancelAtPeriodEndAction}>
                        <input type="hidden" name="subscriptionId" value={item.subscriptionId} />
                        <FormSubmitButton
                          idleLabel="해지 예약 취소"
                          pendingLabel="저장 중..."
                          className="w-full rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-extrabold text-blue-700 hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
                        />
                      </form>
                    ) : null}
                    {item.statusTone === "expired" || item.statusTone === "refunded" ? (
                      <Link
                        href={item.resubscribeHref}
                        className="rounded-xl bg-blue-600 px-4 py-2 text-center text-sm font-extrabold text-white hover:bg-blue-700"
                      >
                        재구독
                      </Link>
                    ) : (
                      <Link
                        href={`/support/refunds?subscriptionId=${encodeURIComponent(item.subscriptionId)}`}
                        className={`rounded-xl px-4 py-2 text-center text-sm font-extrabold ${
                          item.canRequestRefund
                            ? "bg-blue-600 text-white hover:bg-blue-700"
                            : "bg-slate-100 text-slate-400 pointer-events-none"
                        }`}
                        aria-disabled={!item.canRequestRefund}
                      >
                        환불 신청
                      </Link>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </section>
        ) : null}

        {/* Empty State / Subscription Content card */}
        {subscriptionList.items.length === 0 ? (
        <section className="rounded-2xl border border-slate-200/80 bg-white p-8 shadow-sm text-center space-y-4">
          <div className="flex justify-center text-slate-200 text-5xl mb-1">📄</div>
          <h3 className="text-base font-bold text-slate-900">이용 중인 정기 구독이 없습니다</h3>
          <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
            아직 구독 중인 멘토의 플랜이 없습니다. 내 상황과 목표에 딱 맞는 멘토 플랜을 시작해 보세요.
          </p>
          <div className="pt-3">
            <Link href="/mentors" className="inline-block rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-blue-700 transition shadow-sm">
              멘토 찾기 및 구독
            </Link>
          </div>
        </section>
        ) : null}

        {/* Bottom Details Card */}
        <section className="rounded-xl border border-slate-100 bg-slate-50/60 p-4">
          <h4 className="text-xs font-bold text-slate-800">💡 구독 시 유의 사항</h4>
          <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-slate-500 leading-relaxed">
            <li>정기 구독은 이용 기간 만료 시 자동 결제가 진행됩니다.</li>
            <li>구독 해지는 만료일 24시간 전까지 신청할 수 있습니다.</li>
            <li>환불 규정은 서비스 이용약관 및 운영 정책에 따릅니다.</li>
          </ul>
        </section>
      </div>
    </StudentDashboardShell>
  );
}
