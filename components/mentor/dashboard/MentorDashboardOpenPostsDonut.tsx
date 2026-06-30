"use client";

import Link from "next/link";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import type { MentorHubCategorySlice } from "@/lib/mentor/dashboard/mentorHubDashboardTypes";

type Props = {
  total: number;
  categories: MentorHubCategorySlice[];
};

export function MentorDashboardOpenPostsDonut(props: Props) {
  const { total, categories } = props;
  const chartData = categories.filter((c) => c.count > 0).map((c) => ({
    name: c.label,
    value: c.count,
    color: c.color,
    pct: c.pct,
  }));

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-2">
        <h3 className="text-sm font-extrabold text-slate-900">새 의뢰 현황</h3>
        <Link href="/mentor/custom-request/posts" className="text-[12px] font-bold text-[#059669] hover:underline">
          전체 보기 &gt;
        </Link>
      </div>

      {total === 0 ? (
        <p className="py-8 text-center text-[13px] text-slate-400">새 의뢰가 없습니다</p>
      ) : (
        <>
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
            <div className="relative h-40 w-40 shrink-0">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={52}
                      outerRadius={72}
                      paddingAngle={2}
                    >
                      {chartData.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v) => `${v}건`} />
                  </PieChart>
                </ResponsiveContainer>
              ) : null}
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-black text-slate-900">{total}</span>
                <span className="text-[10px] font-semibold text-slate-500">전체</span>
              </div>
            </div>
            <ul className="w-full flex-1 space-y-2 text-[12px]">
              {categories.map((slice) => (
                <li key={slice.id} className="flex items-center justify-between gap-2">
                  <span className="flex min-w-0 items-center gap-2">
                    <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: slice.color }} />
                    <span className="truncate font-semibold text-slate-700">{slice.label}</span>
                  </span>
                  <span className="shrink-0 tabular-nums font-bold text-slate-600">
                    {slice.count}건 ({slice.pct}%)
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <p className="mt-4 border-t border-slate-100 pt-3 text-center text-xs font-bold text-slate-700">
            총 {total}건 전체
          </p>
        </>
      )}
    </section>
  );
}
