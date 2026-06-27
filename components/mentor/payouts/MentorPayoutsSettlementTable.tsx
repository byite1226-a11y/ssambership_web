"use client";

import { CalendarX } from "lucide-react";
import { EmptyState } from "@/components/common/EmptyState";
import type { MentorPayoutSettlementTableRow } from "@/lib/mentor/mentorPayoutsTypes";
import {
  formatCashKrw,
  formatPayoutTableDate,
  settlementStatusBadge,
  typeBadgeClass,
  typeBadgeLabel,
} from "./payoutUi";

export function MentorPayoutsSettlementTable(props: {
  rows: MentorPayoutSettlementTableRow[];
  /** detail 페이지: 결제금액·순수령액 라벨 */
  variant?: "summary" | "detail";
}) {
  const grossLabel = props.variant === "detail" ? "결제금액" : "총액";
  const netLabel = props.variant === "detail" ? "순수령액" : "정산액";
  if (!props.rows.length) {
    return (
      <EmptyState
        compact
        iconTone="neutral"
        icon={<CalendarX className="h-5 w-5" strokeWidth={1.8} aria-hidden />}
        title="선택한 기간에 정산 내역이 없어요"
        description="해당 기간에 완료된 구독 또는 맞춤의뢰가 없습니다."
      />
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
      <table className="w-full min-w-[880px] text-left text-sm">
        <thead>
          <tr className="border-b border-slate-100 bg-slate-50/90 text-xs font-bold text-slate-500">
            <th className="px-4 py-3">일자</th>
            <th className="px-4 py-3">유형</th>
            <th className="px-4 py-3">내용</th>
            <th className="px-4 py-3 text-right">{grossLabel}</th>
            <th className="px-4 py-3 text-right">수수료</th>
            <th className="px-4 py-3 text-right">{netLabel}</th>
            <th className="px-4 py-3">상태</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {props.rows.map((row) => {
            const st = settlementStatusBadge(row.uiStatus);
            return (
              <tr key={row.id} className="hover:bg-slate-50/50">
                <td className="whitespace-nowrap px-4 py-3 text-slate-600">{formatPayoutTableDate(row.date)}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-extrabold ${typeBadgeClass(row.type)}`}>
                    {typeBadgeLabel(row.type)}
                  </span>
                </td>
                <td className="max-w-[220px] truncate px-4 py-3 font-medium text-slate-800" title={row.description}>
                  {row.description}
                </td>
                <td
                  className={`px-4 py-3 text-right tabular-nums font-semibold ${
                    row.isCancelled ? "text-red-600" : "text-slate-900"
                  }`}
                >
                  {row.isCancelled ? `-${formatCashKrw(Math.abs(row.grossAmount))}` : formatCashKrw(row.grossAmount)}
                </td>
                <td
                  className={`px-4 py-3 text-right tabular-nums font-semibold ${
                    row.isCancelled ? "text-emerald-600" : "text-slate-500"
                  }`}
                >
                  {row.isCancelled ? `+${formatCashKrw(row.feeAmount)}` : formatCashKrw(row.feeAmount)}
                </td>
                <td className="px-4 py-3 text-right tabular-nums font-black text-[#2563EB]">
                  {formatCashKrw(row.netAmount)}
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
