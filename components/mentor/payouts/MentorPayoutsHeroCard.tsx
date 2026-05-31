import {
  CUSTOM_REQUEST_PLATFORM_FEE_LABEL,
  SUBSCRIPTION_PLATFORM_FEE_LABEL,
} from "@/lib/mentor/mentorPayoutsConstants";
import type { MentorPayoutScheduleInfo, MentorPayoutSummary } from "@/lib/mentor/mentorPayoutsTypes";
import { formatCashKrw } from "./payoutUi";

type Props = {
  summary: MentorPayoutSummary;
  schedule: MentorPayoutScheduleInfo;
  lifetimePaid: number;
};

export function MentorPayoutsHeroCard(props: Props) {
  const { summary, schedule, lifetimePaid } = props;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[13px] font-medium text-slate-500">이번 달 예상 정산 · {schedule.monthLabel}</p>
          <p className="mt-2 text-[38px] font-bold leading-none tabular-nums tracking-tight text-slate-900">
            {formatCashKrw(summary.thisMonthScheduledPayout)}
          </p>
        </div>
        <div className="sm:text-right">
          <p className="text-[12px] font-semibold text-slate-500">지급 예정일</p>
          <p className="mt-1 text-base font-bold text-slate-900">{schedule.nextPayoutLabel}</p>
          <span className="mt-2 inline-flex rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-[11px] font-extrabold text-amber-900">
            정산 예정
          </span>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 border-t border-slate-100 pt-6 sm:grid-cols-3">
        <div>
          <p className="text-[12px] font-semibold text-slate-500">구독 수익</p>
          <p className="mt-1 text-[20px] font-bold tabular-nums text-slate-900">
            {formatCashKrw(summary.thisMonthSubscription)}
          </p>
          <p className="mt-1 text-[11px] text-slate-400">{SUBSCRIPTION_PLATFORM_FEE_LABEL}</p>
        </div>
        <div>
          <p className="text-[12px] font-semibold text-slate-500">맞춤의뢰 수익</p>
          <p className="mt-1 text-[20px] font-bold tabular-nums text-slate-900">
            {formatCashKrw(summary.thisMonthCustomRequest)}
          </p>
          <p className="mt-1 text-[11px] text-slate-400">{CUSTOM_REQUEST_PLATFORM_FEE_LABEL}</p>
        </div>
        <div>
          <p className="text-[12px] font-semibold text-slate-500">누적 정산</p>
          <p className="mt-1 text-[20px] font-bold tabular-nums text-slate-900">{formatCashKrw(lifetimePaid)}</p>
          <p className="mt-1 text-[11px] text-slate-400">지급 완료 합계</p>
        </div>
      </div>
    </section>
  );
}
