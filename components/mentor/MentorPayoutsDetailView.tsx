"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { MentorPayoutDetailLine, PayoutLineType } from "@/lib/mentor/mentorPayoutsService";
import { formatYearMonthLabel } from "@/lib/mentor/mentorPayoutsService";
import { MentorPayoutsSettlementTable } from "@/components/mentor/payouts/MentorPayoutsSettlementTable";
import { detailLineToSettlementRow } from "@/lib/mentor/mentorPayoutsService";
import { Download } from "lucide-react";
import {
  formatCashKrw,
  formatPayoutTableDate,
  settlementStatusBadge,
  typeBadgeLabel,
} from "@/components/mentor/payouts/payoutUi";

type DetailResponse = {
  ok: boolean;
  lines?: MentorPayoutDetailLine[];
  totals?: { paymentAmount: number; feeAmount: number; netAmount: number };
  error?: string;
};

function monthOptions(count = 12): { value: string; label: string }[] {
  const out: { value: string; label: string }[] = [];
  const now = new Date();
  for (let i = 0; i < count; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    out.push({ value: ym, label: formatYearMonthLabel(ym) });
  }
  return out;
}

export function MentorPayoutsDetailView() {
  const months = useMemo(() => monthOptions(), []);
  const [month, setMonth] = useState(months[0]?.value ?? "");
  const [type, setType] = useState<"all" | PayoutLineType>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lines, setLines] = useState<MentorPayoutDetailLine[]>([]);
  const [totals, setTotals] = useState({ paymentAmount: 0, feeAmount: 0, netAmount: 0 });

  const tableRows = useMemo(() => lines.map(detailLineToSettlementRow), [lines]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams();
    if (month) params.set("month", month);
    if (type !== "all") params.set("type", type);
    try {
      const res = await fetch(`/api/mentor/payouts/detail?${params.toString()}`);
      const json = (await res.json()) as DetailResponse;
      if (!json.ok || !json.lines) {
        setError(json.error ?? "내역을 불러오지 못했습니다.");
        setLines([]);
        return;
      }
      setLines(json.lines);
      setTotals(json.totals ?? { paymentAmount: 0, feeAmount: 0, netAmount: 0 });
    } catch {
      setError("내역을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }, [month, type]);

  useEffect(() => {
    void load();
  }, [load]);

  async function exportExcel() {
    const XLSX = await import("xlsx");
    const rows = tableRows.map((r) => {
      const st = settlementStatusBadge(r.uiStatus);
      return {
        날짜: formatPayoutTableDate(r.date),
        유형: typeBadgeLabel(r.type),
        내용: r.description,
        결제금액: r.grossAmount,
        수수료: r.feeAmount,
        순수령액: r.netAmount,
        상태: st.label,
      };
    });
    rows.push({
      날짜: "합계",
      유형: "",
      내용: "",
      결제금액: totals.paymentAmount,
      수수료: totals.feeAmount,
      순수령액: totals.netAmount,
      상태: "",
    });
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "정산상세");
    XLSX.writeFile(wb, `mentor-payouts-${month || "all"}.xlsx`);
  }

  return (
    <div className="mx-auto max-w-6xl px-4 pb-16 pt-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-2">
          <Link href="/mentor/payouts" className="inline-flex text-sm font-bold text-[#1A56DB] hover:underline">
            ← 정산 요약으로
          </Link>
          <div>
            <h1 className="text-2xl font-black text-slate-900">정산 상세</h1>
            <p className="mt-1 text-sm text-slate-600">기간·유형별 수익 내역과 합계를 확인합니다.</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => void exportExcel()}
          disabled={!lines.length}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-800 hover:bg-slate-50 disabled:opacity-50"
        >
          <Download className="h-4 w-4" />
          엑셀 다운로드
        </button>
      </div>

      <div className="mb-4 flex flex-wrap gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <label className="text-xs font-semibold text-slate-600">
          기간
          <select
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="mt-1 block rounded-lg border border-slate-200 px-3 py-2 text-sm font-bold"
          >
            {months.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs font-semibold text-slate-600">
          유형
          <select
            value={type}
            onChange={(e) => setType(e.target.value as "all" | PayoutLineType)}
            className="mt-1 block rounded-lg border border-slate-200 px-3 py-2 text-sm font-bold"
          >
            <option value="all">전체</option>
            <option value="subscription">구독</option>
            <option value="custom_request">맞춤의뢰</option>
          </select>
        </label>
      </div>

      {error ? (
        <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-900">
          {error}
        </p>
      ) : null}

      {loading ? (
        <p className="py-16 text-center text-sm text-slate-500">불러오는 중…</p>
      ) : (
        <>
          <MentorPayoutsSettlementTable rows={tableRows} variant="detail" />
          <div className="mt-4 flex flex-wrap justify-end gap-6 rounded-2xl border border-slate-200 bg-slate-50/80 px-5 py-4 text-sm font-bold">
            <span className="text-slate-600">
              결제금액 합계 <span className="text-slate-900">{formatCashKrw(totals.paymentAmount)}</span>
            </span>
            <span className="text-slate-600">
              수수료 합계 <span className="text-slate-900">{formatCashKrw(totals.feeAmount)}</span>
            </span>
            <span className="text-[#1A56DB]">
              순수령액 합계 <span className="font-black">{formatCashKrw(totals.netAmount)}</span>
            </span>
          </div>
        </>
      )}
    </div>
  );
}
