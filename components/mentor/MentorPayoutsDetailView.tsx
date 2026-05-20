"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { formatCashKrw } from "@/lib/mentor/mentorPayoutsConstants";
import type { MentorPayoutDetailLine, PayoutLineType } from "@/lib/mentor/mentorPayoutsService";
import { Download, ChevronLeft } from "lucide-react";

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
    out.push({ value: ym, label: `${d.getFullYear()}년 ${d.getMonth() + 1}월` });
  }
  return out;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat("ko-KR", { dateStyle: "medium" }).format(d);
}

function typeLabel(t: PayoutLineType): string {
  return t === "subscription" ? "구독" : "맞춤의뢰";
}

export function MentorPayoutsDetailView() {
  const months = useMemo(() => monthOptions(), []);
  const [month, setMonth] = useState(months[0]?.value ?? "");
  const [type, setType] = useState<"all" | PayoutLineType>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lines, setLines] = useState<MentorPayoutDetailLine[]>([]);
  const [totals, setTotals] = useState({ paymentAmount: 0, feeAmount: 0, netAmount: 0 });

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
    const rows = lines.map((l) => ({
      날짜: formatDate(l.date),
      유형: typeLabel(l.type),
      내용: l.description,
      결제금액: l.paymentAmount,
      수수료: l.feeAmount,
      순수령액: l.netAmount,
      상태: l.status,
    }));
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
    <div className="mx-auto max-w-6xl pb-12">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link href="/mentor/payouts" className="rounded-lg border border-slate-200 p-2 hover:bg-slate-50">
            <ChevronLeft className="h-4 w-4" />
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

      <div className="mb-4 flex flex-wrap gap-3 rounded-2xl border border-slate-200 bg-white p-4">
        <label className="text-xs font-semibold text-slate-600">
          기간
          <select
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="mt-1 block rounded-lg border px-3 py-2 text-sm"
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
            className="mt-1 block rounded-lg border px-3 py-2 text-sm"
          >
            <option value="all">전체</option>
            <option value="subscription">구독</option>
            <option value="custom_request">맞춤의뢰</option>
          </select>
        </label>
      </div>

      {error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-900">{error}</p>
      ) : null}

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50 text-xs font-bold text-slate-600">
              <th className="px-4 py-3">날짜</th>
              <th className="px-4 py-3">유형</th>
              <th className="px-4 py-3">내용</th>
              <th className="px-4 py-3">결제금액</th>
              <th className="px-4 py-3">수수료</th>
              <th className="px-4 py-3">순수령액</th>
              <th className="px-4 py-3">상태</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-slate-500">
                  불러오는 중…
                </td>
              </tr>
            ) : !lines.length ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-slate-500">
                  표시할 내역이 없습니다.
                </td>
              </tr>
            ) : (
              lines.map((l) => (
                <tr key={l.id} className="hover:bg-slate-50/40">
                  <td className="whitespace-nowrap px-4 py-3 text-slate-600">{formatDate(l.date)}</td>
                  <td className="px-4 py-3 text-xs font-bold text-slate-700">{typeLabel(l.type)}</td>
                  <td className="max-w-xs truncate px-4 py-3 text-slate-800" title={l.description}>
                    {l.description}
                  </td>
                  <td className="px-4 py-3 tabular-nums font-semibold">{formatCashKrw(l.paymentAmount)}</td>
                  <td className="px-4 py-3 tabular-nums text-slate-500">{formatCashKrw(l.feeAmount)}</td>
                  <td className="px-4 py-3 tabular-nums font-black text-[#1A56DB]">{formatCashKrw(l.netAmount)}</td>
                  <td className="px-4 py-3 text-xs font-bold text-slate-600">{l.status}</td>
                </tr>
              ))
            )}
          </tbody>
          <tfoot>
            <tr className="border-t border-slate-200 bg-slate-50/80 font-bold">
              <td colSpan={3} className="px-4 py-3 text-slate-800">
                합계
              </td>
              <td className="px-4 py-3 tabular-nums">{formatCashKrw(totals.paymentAmount)}</td>
              <td className="px-4 py-3 tabular-nums text-slate-600">{formatCashKrw(totals.feeAmount)}</td>
              <td className="px-4 py-3 tabular-nums text-[#1A56DB]">{formatCashKrw(totals.netAmount)}</td>
              <td />
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
