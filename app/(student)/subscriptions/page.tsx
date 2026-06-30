import { redirect } from "next/navigation";
import Link from "next/link";
import { FileText, Lightbulb } from "lucide-react";
import { getServerUserWithProfile } from "@/lib/auth/getServerUserWithProfile";
import { createClient } from "@/lib/supabase/server";
import { fetchWalletBalanceByUserId } from "@/lib/cash/cashQueries";
import { parseWalletBalanceKrw } from "@/lib/cash/parseWalletBalanceKrw";
import { loadStudentSubscriptionManagementList } from "@/lib/subscribe/studentSubscriptionManagement";
import { StudentDashboardShell } from "@/components/mypage/StudentDashboardShell";
import { StudentSubscriptionsList } from "@/components/subscribe/StudentSubscriptionsList";

type PageProps = { searchParams?: Promise<Record<string, string | string[] | undefined>> };

function firstParam(value: string | string[] | undefined): string | null {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value[0] ?? null;
  return null;
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
  // "구독 중" = 현재 이용 가능한 구독(해지 예약=cancel_at_period_end 여도 기간까진 이용 중이므로 포함).
  // 만료 예정 건은 아래 scheduledCancelCount 에도 잡혀 양쪽에 표시됨(이용 중 + 갱신 중단 예정 두 사실 반영).
  // past_due(결제 실패 유예)는 혼란 방지 위해 제외 — active 기준만.
  const activeCount = subscriptionList.items.filter((item) => item.status === "active").length;
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
          <p className="mt-1 text-sm text-slate-500">
            <span className="md:hidden">구독 플랜과 갱신·해지 상태를 확인하세요.</span>
            <span className="hidden md:inline">이용 중인 멘토 플랜과 다음 갱신, 해지·환불 상태를 확인하세요.</span>
          </p>
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

        {/* Top Summary — 3등분 균등 통계 바(각 칸 중앙 정렬 + 칸 사이 0.5px 구분선, 양끝 없음) */}
        <div className="grid grid-cols-3 divide-x-[0.5px] divide-slate-200 rounded-2xl border border-slate-200 bg-white px-2 py-3.5 shadow-sm">
          <div className="flex items-baseline justify-center gap-1 px-1.5 sm:gap-1.5 sm:px-3">
            <span className="text-[11px] font-bold text-slate-500 sm:text-xs">구독 중</span>
            <span className="text-base font-black tabular-nums text-slate-900 sm:text-lg">{activeCount}</span>
            <span className="text-[11px] font-medium text-slate-400 sm:text-xs">명</span>
          </div>
          <div className="flex items-baseline justify-center gap-1 px-1.5 sm:gap-1.5 sm:px-3">
            <span className="text-[11px] font-bold text-slate-500 sm:text-xs">전체 기록</span>
            <span className="text-base font-black tabular-nums text-slate-900 sm:text-lg">{subscriptionList.items.length}</span>
            <span className="text-[11px] font-medium text-slate-400 sm:text-xs">건</span>
          </div>
          <div className="flex items-baseline justify-center gap-1 px-1.5 sm:gap-1.5 sm:px-3">
            <span className="text-[11px] font-bold text-slate-500 sm:text-xs">만료 예정</span>
            <span className="text-base font-black tabular-nums text-slate-900 sm:text-lg">{scheduledCancelCount}</span>
            <span className="text-[11px] font-medium text-slate-400 sm:text-xs">건</span>
          </div>
        </div>

        {subscriptionList.error ? (
          <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900">
            구독 목록을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.
          </p>
        ) : null}

        {subscriptionList.items.length > 0 ? (
          <StudentSubscriptionsList items={subscriptionList.items} />
        ) : null}

        {/* Empty State / Subscription Content card */}
        {subscriptionList.items.length === 0 ? (
        <section className="rounded-2xl border border-slate-200/80 bg-white p-8 shadow-sm text-center space-y-4">
          <div className="mb-1 flex justify-center text-slate-300"><FileText className="h-12 w-12" strokeWidth={1.5} aria-hidden /></div>
          <h3 className="text-base font-bold text-slate-900">이용 중인 정기 구독이 없습니다</h3>
          <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
            <span className="md:hidden">나에게 맞는 멘토 플랜을 시작해 보세요.</span>
            <span className="hidden md:inline">아직 구독 중인 멘토의 플랜이 없습니다. 내 상황과 목표에 딱 맞는 멘토 플랜을 시작해 보세요.</span>
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
          <h4 className="flex items-center gap-1.5 text-xs font-bold text-slate-800"><Lightbulb className="h-4 w-4 text-slate-400" aria-hidden /> 구독 시 유의 사항</h4>
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
