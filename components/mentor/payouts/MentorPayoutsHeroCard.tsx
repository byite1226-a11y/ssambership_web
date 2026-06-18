import {
  CUSTOM_REQUEST_PLATFORM_FEE_LABEL,
  SUBSCRIPTION_PLATFORM_FEE_LABEL,
} from "@/lib/mentor/mentorPayoutsConstants";
import { Repeat, Briefcase, Wallet } from "lucide-react";
import type { MentorPayoutScheduleInfo, MentorPayoutSummary } from "@/lib/mentor/mentorPayoutsTypes";
import { SURFACE_CARD } from "@/lib/ui/surfaceCard";
import { formatCashKrw } from "./payoutUi";

// 멘토 전용 화면 액센트(초록 #16A34A) 아이콘 타일
const MENTOR_TILE = "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#E6F7F1] text-[#16A34A]";

type Props = {
  summary: MentorPayoutSummary;
  schedule: MentorPayoutScheduleInfo;
  lifetimePaid: number;
};

export function MentorPayoutsHeroCard(props: Props) {
  const { summary, schedule, lifetimePaid } = props;

  return (
    <section className={`${SURFACE_CARD} border-l-[4px] border-l-[#16A34A]`}>
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
          <div className="flex items-center gap-2">
            <span className={MENTOR_TILE}>
              <Repeat className="h-3.5 w-3.5" aria-hidden />
            </span>
            <p className="text-[12px] font-semibold text-slate-500">구독 수익</p>
          </div>
          <p className="mt-2 text-[20px] font-bold tabular-nums text-slate-900">
            {formatCashKrw(summary.thisMonthSubscription)}
          </p>
          <p className="mt-1 text-[11px] text-slate-400">{SUBSCRIPTION_PLATFORM_FEE_LABEL}</p>
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className={MENTOR_TILE}>
              <Briefcase className="h-3.5 w-3.5" aria-hidden />
            </span>
            <p className="text-[12px] font-semibold text-slate-500">맞춤의뢰 수익</p>
          </div>
          <p className="mt-2 text-[20px] font-bold tabular-nums text-slate-900">
            {formatCashKrw(summary.thisMonthCustomRequest)}
          </p>
          <p className="mt-1 text-[11px] text-slate-400">{CUSTOM_REQUEST_PLATFORM_FEE_LABEL}</p>
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className={MENTOR_TILE}>
              <Wallet className="h-3.5 w-3.5" aria-hidden />
            </span>
            <p className="text-[12px] font-semibold text-slate-500">누적 정산</p>
          </div>
          <p className="mt-2 text-[20px] font-bold tabular-nums text-slate-900">{formatCashKrw(lifetimePaid)}</p>
          <p className="mt-1 text-[11px] text-slate-400">지급 완료 합계</p>
        </div>
      </div>
    </section>
  );
}
