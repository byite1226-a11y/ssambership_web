"use client";

import dynamic from "next/dynamic";
import type { MentorPayoutMonthlyCard } from "@/lib/mentor/mentorPayoutsTypes";

const MentorPayoutsMonthlyBarChartInner = dynamic(
  () => import("./MentorPayoutsCharts").then((m) => m.MentorPayoutsMonthlyBarChart),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-48 items-center justify-center text-xs text-slate-400">차트 불러오는 중…</div>
    ),
  }
);

export function MentorPayoutsMonthlyBarChartLazy(props: { months: MentorPayoutMonthlyCard[] }) {
  return <MentorPayoutsMonthlyBarChartInner months={props.months} />;
}
