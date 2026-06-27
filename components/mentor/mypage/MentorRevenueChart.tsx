"use client";

import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";

export type MonthlyRevenue = { month: string; total: number };

const PRIMARY = "#2563EB";

export type MonthlyChartUnit = "캐시" | "원";

function formatTooltipValue(v: number, unit: MonthlyChartUnit): string {
  if (!Number.isFinite(v) || v <= 0) return unit === "원" ? "0원" : "0 캐시";
  if (v >= 10000) return `${Math.round(v / 10000)}만 ${unit === "원" ? "원" : "캐시"}`;
  return unit === "원" ? `${v.toLocaleString("ko-KR")}원` : `${v.toLocaleString("ko-KR")} 캐시`;
}

type DotProps = {
  cx?: number;
  cy?: number;
  index?: number;
  payload?: unknown;
};

/**
 * 마지막 달(가장 오른쪽)만 점 표시 — 현재 달 강조.
 */
function makeLastDotRenderer(lastIndex: number) {
  return function LastDot(props: DotProps) {
    if (props.index !== lastIndex || props.cx == null || props.cy == null) {
      return <g />;
    }
    return (
      <circle
        cx={props.cx}
        cy={props.cy}
        r={4.5}
        fill="#fff"
        stroke={PRIMARY}
        strokeWidth={2}
      />
    );
  };
}

type MentorRevenueChartProps = {
  monthlyRevenue: MonthlyRevenue[];
  height?: number;
  gradientId?: string;
  valueUnit?: MonthlyChartUnit;
};

export function MentorRevenueChart(props: MentorRevenueChartProps) {
  const data = props.monthlyRevenue;
  const lastIndex = data.length - 1;
  const height = props.height ?? 130;
  const gradientId = props.gradientId ?? "mentor-revenue-grad";
  const valueUnit = props.valueUnit ?? "캐시";

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 8, right: 4, left: 4, bottom: 0 }}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={PRIMARY} stopOpacity={0.09} />
            <stop offset="100%" stopColor={PRIMARY} stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis
          dataKey="month"
          tick={{ fill: "#aab0bb", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          contentStyle={{
            background: "#1e2430",
            border: "none",
            borderRadius: 7,
            fontSize: 12,
            color: "#fff",
            padding: "6px 10px",
          }}
          labelStyle={{ color: "#cbd5e1", fontSize: 11, marginBottom: 2 }}
          itemStyle={{ color: "#fff" }}
          formatter={(value) => {
            const n = typeof value === "number" ? value : Number(value);
            return [formatTooltipValue(n, valueUnit), ""];
          }}
          separator=""
        />
        <Area
          type="monotone"
          dataKey="total"
          stroke={PRIMARY}
          strokeWidth={2}
          fill={`url(#${gradientId})`}
          dot={makeLastDotRenderer(lastIndex)}
          activeDot={{ r: 5, fill: PRIMARY, stroke: "#fff", strokeWidth: 2 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
