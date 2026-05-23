"use client";

import { useMemo, useState } from "react";
import type { MentorPayoutsPageData } from "@/lib/mentor/mentorPayoutsTypes";
import { formatYearMonthLabel } from "@/lib/mentor/mentorPayoutsDisplay";
import { Download } from "lucide-react";
import { MentorPayoutsKpiCards } from "./MentorPayoutsKpiCards";
import { MentorPayoutsPerformanceTable } from "./MentorPayoutsPerformanceTable";
import { MentorPayoutsSettlementTable } from "./MentorPayoutsSettlementTable";
import { formatPayoutTableDate, settlementStatusBadge, typeBadgeLabel } from "./payoutUi";

type TabId = "settlement" | "performance";

function monthOptions(defaultMonth: string, count = 12): { value: string; label: string }[] {
  const out: { value: string; label: string }[] = [];
  const now = new Date();
  for (let i = 0; i < count; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    out.push({ value: ym, label: formatYearMonthLabel(ym) });
  }
  if (!out.some((o) => o.value === defaultMonth)) {
    out.unshift({ value: defaultMonth, label: formatYearMonthLabel(defaultMonth) });
  }
  return out;
}

function inMonth(iso: string, ym: string): boolean {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return false;
  const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  return key === ym;
}

export function MentorPayoutsMain(props: { data: MentorPayoutsPageData }) {
  const [tab, setTab] = useState<TabId>("settlement");
  const [month, setMonth] = useState(props.data.defaultMonth);
  const [showAllSettlement, setShowAllSettlement] = useState(false);

  const monthChoices = useMemo(() => monthOptions(props.data.defaultMonth), [props.data.defaultMonth]);

  const filteredSettlement = useMemo(
    () => props.data.settlementLines.filter((r) => inMonth(r.date, month)),
    [props.data.settlementLines, month]
  );

  const visibleSettlement = showAllSettlement ? filteredSettlement : filteredSettlement.slice(0, 12);

  async function downloadSettlement() {
    const XLSX = await import("xlsx");
    const rows = filteredSettlement.map((r) => {
      const st = settlementStatusBadge(r.uiStatus);
      return {
        일자: formatPayoutTableDate(r.date),
        유형: typeBadgeLabel(r.type),
        내용: r.description,
        총액: r.grossAmount,
        수수료: r.feeAmount,
        정산액: r.netAmount,
        상태: st.label,
      };
    });
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "정산내역");
    XLSX.writeFile(wb, `mentor-settlement-${month}.xlsx`);
  }

  return (
    <main className="min-w-0 flex-1 space-y-6">
      <header>
        <h1 className="text-2xl font-black text-slate-900">멘토 정산</h1>
        <p className="mt-1 text-sm text-slate-600">예상 정산 금액과 서비스 수익을 확인하세요.</p>
      </header>

      <MentorPayoutsKpiCards
        subscription={props.data.kpis.subscription}
        customRequest={props.data.kpis.customRequest}
        total={props.data.kpis.total}
        lifetimePaid={props.data.kpis.lifetimePaid}
      />

      <div className="border-b border-slate-200">
        <nav className="flex gap-1">
          {(
            [
              ["settlement", "정산 내역"],
              ["performance", "수행 내역"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={[
                "rounded-t-lg px-4 py-2.5 text-sm font-extrabold transition",
                tab === id
                  ? "border border-b-0 border-slate-200 bg-white text-[#1A56DB]"
                  : "text-slate-500 hover:text-slate-800",
              ].join(" ")}
            >
              {label}
            </button>
          ))}
        </nav>
      </div>

      {tab === "settlement" ? (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs font-medium text-slate-500">
              {formatYearMonthLabel(month)} 기준 {filteredSettlement.length}건
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={month}
                onChange={(e) => {
                  setMonth(e.target.value);
                  setShowAllSettlement(false);
                }}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-800"
              >
                {monthChoices.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => void downloadSettlement()}
                disabled={!filteredSettlement.length}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-800 hover:bg-slate-50 disabled:opacity-50"
              >
                <Download className="h-4 w-4" />
                다운로드
              </button>
            </div>
          </div>

          <MentorPayoutsSettlementTable rows={visibleSettlement} />

          {filteredSettlement.length > 12 ? (
            <div className="flex justify-center">
              <button
                type="button"
                onClick={() => setShowAllSettlement((v) => !v)}
                className="rounded-full border border-slate-200 bg-white px-5 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"
              >
                {showAllSettlement ? "접기 ∧" : "더 많은 정산 내역 보기 ∨"}
              </button>
            </div>
          ) : null}
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-xs font-medium text-slate-500">최근 수행 {props.data.performanceLines.length}건</p>
          <MentorPayoutsPerformanceTable rows={props.data.performanceLines.slice(0, 30)} />
        </div>
      )}
    </main>
  );
}
