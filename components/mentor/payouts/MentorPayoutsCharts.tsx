"use client";

import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { formatChartMonthLabel } from "@/lib/mentor/mentorPayoutsDisplay";
import type { MentorPayoutMonthlyCard } from "@/lib/mentor/mentorPayoutsTypes";
import { MentorRevenueChart } from "@/components/mentor/mypage/MentorRevenueChart";
import { formatCashKrw } from "./payoutUi";

const PRIMARY = "#059669";
const CUSTOM_GREEN = "#059669";

type DonutProps = {
  subscription: number;
  customRequest: number;
  subscriptionPct: number;
  customRequestPct: number;
};

export function MentorPayoutsDonutChart(props: DonutProps) {
  const data = [
    { name: "구독", value: props.subscription, color: PRIMARY },
    { name: "맞춤의뢰", value: props.customRequest, color: CUSTOM_GREEN },
  ].filter((d) => d.value > 0);

  if (data.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center text-xs font-medium text-slate-400">
        이번 달 수익 데이터가 없습니다
      </div>
    );
  }

  return (
    <div className="h-44">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={48} outerRadius={68} paddingAngle={2}>
            {data.map((entry) => (
              <Cell key={entry.name} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip formatter={(v) => formatCashKrw(Number(v ?? 0))} />
        </PieChart>
      </ResponsiveContainer>
      <ul className="mt-2 space-y-1.5 text-xs font-semibold text-slate-700">
        <li className="flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: PRIMARY }} />
            구독 {props.subscriptionPct}%
          </span>
          <span className="tabular-nums text-slate-600">{formatCashKrw(props.subscription)}</span>
        </li>
        <li className="flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: CUSTOM_GREEN }} />
            맞춤의뢰 {props.customRequestPct}%
          </span>
          <span className="tabular-nums text-slate-600">{formatCashKrw(props.customRequest)}</span>
        </li>
      </ul>
    </div>
  );
}

export function MentorPayoutsMonthlyAreaChart(props: { months: MentorPayoutMonthlyCard[] }) {
  const chartData = [...props.months]
    .reverse()
    .map((m) => ({
      month: formatChartMonthLabel(m.yearMonth),
      total: m.revenue,
    }));

  if (!chartData.length) {
    return (
      <div className="flex h-48 items-center justify-center text-xs text-slate-400">표시할 추이가 없습니다</div>
    );
  }

  return (
    <div className="h-48">
      <MentorRevenueChart
        monthlyRevenue={chartData}
        height={192}
        gradientId="mentor-payout-trend-grad"
        valueUnit="캐시"
      />
    </div>
  );
}
