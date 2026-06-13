"use client";

import type { MentorPayoutPerformanceRow } from "@/lib/mentor/mentorPayoutsTypes";
import {
  formatCashKrw,
  formatPayoutTableDate,
  performanceStatusBadge,
  typeBadgeClass,
  typeBadgeLabel,
} from "./payoutUi";

export function MentorPayoutsPerformanceTable(props: { rows: MentorPayoutPerformanceRow[] }) {
  if (!props.rows.length) {
    return (
      <p className="rounded-xl border border-dashed border-slate-200 py-16 text-center text-sm text-slate-500">
        최근 수행 내역이 없습니다.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
      <table className="w-full min-w-[760px] text-left text-sm">
        <thead>
          <tr className="border-b border-slate-100 bg-slate-50/90 text-xs font-bold text-slate-500">
            <th className="px-4 py-3">일자</th>
            <th className="px-4 py-3">유형</th>
            <th className="px-4 py-3">제목</th>
            <th className="px-4 py-3">학생</th>
            <th className="px-4 py-3 text-right">금액</th>
            <th className="px-4 py-3">상태</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {props.rows.map((row) => {
            const st = performanceStatusBadge(row.uiStatus);
            return (
              <tr key={row.id} className="hover:bg-slate-50/50">
                <td className="whitespace-nowrap px-4 py-3 text-slate-600">{formatPayoutTableDate(row.date)}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-extrabold ${typeBadgeClass(row.type)}`}>
                    {typeBadgeLabel(row.type)}
                  </span>
                </td>
                <td className="max-w-[200px] truncate px-4 py-3 font-medium text-slate-800" title={row.title}>
                  {row.title}
                </td>
                <td className="px-4 py-3 text-slate-700">{row.studentName}</td>
                <td className="px-4 py-3 text-right tabular-nums font-bold text-slate-900">
                  {formatCashKrw(row.amount)}
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-extrabold ${st.className}`}>
                    {st.label}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
