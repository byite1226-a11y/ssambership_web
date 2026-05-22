"use client";

import Link from "next/link";
import type { MentorPayoutScheduleInfo, MentorPayoutSummary } from "@/lib/mentor/mentorPayoutsService";
import { MentorPayoutsDonutChart } from "./MentorPayoutsCharts";
import { formatCashKrw } from "./payoutUi";
import { Info } from "lucide-react";

type Props = {
  summary: MentorPayoutSummary;
  schedule: MentorPayoutScheduleInfo;
  revenueShare: {
    subscription: number;
    customRequest: number;
    total: number;
    subscriptionPct: number;
    customRequestPct: number;
  };
};

export function MentorPayoutsLeftSidebar(props: Props) {
  const { summary, schedule, revenueShare } = props;

  return (
    <aside className="w-full space-y-4 lg:w-[240px] lg:shrink-0 lg:sticky lg:top-24 lg:self-start">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">이번 달 예상 정산</p>
        <p className="mt-2 text-3xl font-black tabular-nums text-slate-900">
          {formatCashKrw(summary.thisMonthScheduledPayout)}
        </p>
        <dl className="mt-4 space-y-2 text-xs text-slate-600">
          <div className="flex justify-between gap-2">
            <dt className="font-semibold text-slate-500">지급 예정일</dt>
            <dd className="font-bold text-slate-800">{schedule.nextPayoutLabel}</dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt className="font-semibold text-slate-500">지급 상태</dt>
            <dd>
              <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-extrabold text-amber-900">
                정산 예정
              </span>
            </dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt className="font-semibold text-slate-500">수수료 반영</dt>
            <dd className="font-bold text-slate-800">적용됨 (플랫폼)</dd>
          </div>
        </dl>
        <Link
          href="/mentor/payouts/detail"
          className="mt-4 inline-flex text-xs font-bold text-[#1A56DB] hover:underline"
        >
          상세 내역 보기 &gt;
        </Link>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-sm font-extrabold text-slate-900">수익 비중</h3>
        <div className="mt-3">
          <MentorPayoutsDonutChart
            subscription={revenueShare.subscription}
            customRequest={revenueShare.customRequest}
            subscriptionPct={revenueShare.subscriptionPct}
            customRequestPct={revenueShare.customRequestPct}
          />
        </div>
        <p className="mt-3 border-t border-slate-100 pt-3 text-center text-xs font-bold text-slate-700">
          총 수익 {formatCashKrw(revenueShare.total)}
        </p>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-slate-50/80 p-5">
        <div className="flex items-center gap-2">
          <Info className="h-4 w-4 text-[#1A56DB]" />
          <h3 className="text-sm font-extrabold text-slate-900">정산 안내</h3>
        </div>
        <ul className="mt-3 space-y-2.5 text-xs leading-relaxed text-slate-600">
          <li>정산은 매월 10일에 진행됩니다.</li>
          <li>수수료는 유형별로 상이하며, 정산 시 차감됩니다.</li>
          <li>환불/취소 건은 익월 정산에 반영될 수 있습니다.</li>
        </ul>
        <p className="mt-3 text-[10px] text-slate-500">구독 멘토 몫 70% · 맞춤의뢰 멘토 몫 80%</p>
        <Link href="/support/faq" className="mt-3 inline-flex text-xs font-bold text-[#1A56DB] hover:underline">
          정산 가이드 보기 &gt;
        </Link>
      </section>
    </aside>
  );
}
