"use client";

import Link from "next/link";
import type { MentorPayoutMonthlyCard, MentorPayoutScheduleInfo } from "@/lib/mentor/mentorPayoutsService";
import { MentorPayoutsMonthlyBarChart } from "./MentorPayoutsCharts";
import { formatCashKrw } from "./payoutUi";

type Props = {
  schedule: MentorPayoutScheduleInfo;
  months: MentorPayoutMonthlyCard[];
};

export function MentorPayoutsRightPanel(props: Props) {
  const { schedule } = props;

  return (
    <aside className="w-full space-y-4 lg:w-[280px] lg:shrink-0 lg:sticky lg:top-24 lg:self-start">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-sm font-extrabold text-slate-900">지급 일정</h3>
        <p className="mt-3 text-xs font-semibold text-slate-500">다음 지급 예정일</p>
        <p className="mt-1 text-lg font-black text-slate-900">{schedule.nextPayoutLabel}</p>
        <div className="mt-4">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-600">
            <span>{schedule.monthLabel} 정산 진행 현황</span>
            <span>{schedule.monthProgressPct}%</span>
          </div>
          <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-[#1A56DB] transition-all"
              style={{ width: `${schedule.monthProgressPct}%` }}
            />
          </div>
        </div>
        <dl className="mt-4 space-y-2 border-t border-slate-100 pt-4 text-xs">
          <div className="flex justify-between gap-2">
            <dt className="font-semibold text-slate-500">정산 완료 금액</dt>
            <dd className="font-bold tabular-nums text-slate-800">{formatCashKrw(schedule.completedPayoutAmount)}</dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt className="font-semibold text-slate-500">예상 정산 금액</dt>
            <dd className="font-black tabular-nums text-[#1A56DB]">
              {formatCashKrw(schedule.expectedPayoutAmount)}
            </dd>
          </div>
        </dl>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-extrabold text-slate-900">월간 추이</h3>
          <span className="rounded-lg border border-slate-200 px-2 py-0.5 text-[10px] font-bold text-slate-600">
            최근 6개월 ∨
          </span>
        </div>
        <div className="mt-3">
          <MentorPayoutsMonthlyBarChart months={props.months} />
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-slate-50/80 p-5">
        <h3 className="text-sm font-extrabold text-slate-900">안내</h3>
        <ul className="mt-3 space-y-2 text-xs leading-relaxed text-slate-600">
          <li>정산은 매월 10일에 등록된 계좌로 지급됩니다.</li>
          <li>수수료는 구독 플랫폼 30%, 맞춤의뢰 플랫폼 20%가 기본 적용됩니다.</li>
          <li>환불/취소 발생 시 익월 정산에 반영될 수 있습니다.</li>
        </ul>
        <Link href="/support/disputes" className="mt-3 inline-flex text-xs font-bold text-[#1A56DB] hover:underline">
          1:1 문의하기 &gt;
        </Link>
      </section>
    </aside>
  );
}
