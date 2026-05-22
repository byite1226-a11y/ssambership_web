"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { formatWalletRowDisplay } from "@/lib/cash/cashQueries";
import type { WalletLedgerPageData } from "@/lib/cash/walletRouteData";
import {
  ledgerAmountLabel,
  ledgerAt,
  ledgerBalanceAfter,
  ledgerIsCredit,
  ledgerReasonLabel,
  ledgerUiKind,
  type LedgerUiKind,
} from "@/lib/cash/ledgerRowDisplay";

const PAGE_SIZE = 15;

type PeriodKey = "1m" | "3m" | "6m" | "custom";
type KindFilter = "all" | LedgerUiKind;

function periodStart(key: PeriodKey): Date | null {
  const now = new Date();
  if (key === "1m") return new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
  if (key === "3m") return new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
  if (key === "6m") return new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
  return null;
}

function rowDate(row: Record<string, unknown>): Date | null {
  const raw = row.created_at ?? row.inserted_at;
  if (typeof raw !== "string") return null;
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? null : d;
}

function detailLabel(row: Record<string, unknown>): string {
  const r = ledgerReasonLabel(row);
  if (r && r !== "—") return r;
  const k = ledgerUiKind(row);
  if (k === "charge") return "캐시 충전";
  if (k === "subscription") return "구독제 결제";
  if (k === "custom_request") return "맞춤의뢰 결제";
  return "기타";
}

function kindBadge(kind: LedgerUiKind): string {
  if (kind === "charge") return "충전";
  if (kind === "subscription") return "구독";
  if (kind === "custom_request") return "맞춤의뢰";
  return "기타";
}

export function WalletLedgerPageBody(props: { data: WalletLedgerPageData }) {
  const { data } = props;
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [period, setPeriod] = useState<PeriodKey>(
    (searchParams.get("period") as PeriodKey) || "1m",
  );
  const [kind, setKind] = useState<KindFilter>(
    (searchParams.get("kind") as KindFilter) || "all",
  );
  const [page, setPage] = useState(1);
  const [customFrom, setCustomFrom] = useState(searchParams.get("from") ?? "");
  const [customTo, setCustomTo] = useState(searchParams.get("to") ?? "");

  const balanceText = data.balance.error
    ? "—"
    : data.balance.row
      ? formatWalletRowDisplay(data.balance.row)
      : "0캐시";

  const filtered = useMemo(() => {
    let rows = (data.ledger.rows ?? []) as Record<string, unknown>[];
    if (period !== "custom") {
      const start = periodStart(period);
      if (start) {
        rows = rows.filter((r) => {
          const d = rowDate(r);
          return d != null && d >= start;
        });
      }
    } else if (customFrom || customTo) {
      const fromD = customFrom ? new Date(customFrom) : null;
      const toD = customTo ? new Date(`${customTo}T23:59:59`) : null;
      rows = rows.filter((r) => {
        const d = rowDate(r);
        if (!d) return false;
        if (fromD && !Number.isNaN(fromD.getTime()) && d < fromD) return false;
        if (toD && !Number.isNaN(toD.getTime()) && d > toD) return false;
        return true;
      });
    }
    if (kind !== "all") {
      rows = rows.filter((r) => ledgerUiKind(r) === kind);
    }
    return rows;
  }, [data.ledger.rows, period, kind, customFrom, customTo]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function applyCustomPeriod() {
    const p = new URLSearchParams();
    p.set("period", "custom");
    if (customFrom) p.set("from", customFrom);
    if (customTo) p.set("to", customTo);
    if (kind !== "all") p.set("kind", kind);
    router.push(`${pathname}?${p.toString()}`);
    setPeriod("custom");
    setPage(1);
  }

  const onLedgerTab = pathname?.startsWith("/wallet/ledger");

  return (
    <div className="space-y-6 text-slate-800">
      <nav className="flex gap-1 border-b border-slate-200">
        <Link
          href="/wallet/charge"
          className="rounded-t-lg px-4 py-2.5 text-sm font-extrabold text-slate-500 hover:text-slate-800"
        >
          충전하기
        </Link>
        <Link
          href="/wallet/ledger"
          className={[
            "rounded-t-lg px-4 py-2.5 text-sm font-extrabold",
            onLedgerTab
              ? "border border-b-0 border-slate-200 bg-white text-[#1A56DB]"
              : "text-slate-500 hover:text-slate-800",
          ].join(" ")}
          aria-current={onLedgerTab ? "page" : undefined}
        >
          사용내역
        </Link>
      </nav>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-wide text-slate-400">현재 잔액</p>
        <p className="mt-1 text-2xl font-black text-slate-900">{balanceText}</p>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
        <div className="flex flex-wrap gap-2">
          <span className="w-full text-xs font-bold text-slate-500">기간</span>
          {(
            [
              ["1m", "1개월"],
              ["3m", "3개월"],
              ["6m", "6개월"],
              ["custom", "직접설정"],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => {
                setPeriod(key);
                setPage(1);
              }}
              className={[
                "rounded-full px-3.5 py-1.5 text-xs font-bold",
                period === key ? "bg-[#1A56DB] text-white" : "border border-slate-200 bg-white text-slate-700",
              ].join(" ")}
            >
              {label}
            </button>
          ))}
        </div>
        {period === "custom" ? (
          <div className="flex flex-wrap items-end gap-2">
            <label className="text-xs font-bold text-slate-600">
              시작
              <input
                type="date"
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
                className="mt-1 block rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
              />
            </label>
            <label className="text-xs font-bold text-slate-600">
              종료
              <input
                type="date"
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
                className="mt-1 block rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
              />
            </label>
            <button
              type="button"
              onClick={applyCustomPeriod}
              className="rounded-lg bg-slate-800 px-3 py-2 text-xs font-bold text-white"
            >
              적용
            </button>
          </div>
        ) : null}

        <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-4">
          <span className="w-full text-xs font-bold text-slate-500">유형</span>
          {(
            [
              ["all", "전체"],
              ["charge", "충전"],
              ["subscription", "구독"],
              ["custom_request", "맞춤의뢰"],
              ["other", "기타"],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => {
                setKind(key);
                setPage(1);
              }}
              className={[
                "rounded-full px-3.5 py-1.5 text-xs font-bold",
                kind === key ? "bg-[#1A56DB] text-white" : "border border-slate-200 bg-white text-slate-700",
              ].join(" ")}
            >
              {label}
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        {data.ledger.error ? (
          <p className="text-sm text-red-700">사용 내역을 불러오지 못했습니다.</p>
        ) : filtered.length === 0 ? (
          <p className="py-12 text-center text-sm font-bold text-slate-500">사용 내역이 없어요</p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-xs font-bold text-slate-400">
                    <th className="pb-2 pr-3 text-left">날짜</th>
                    <th className="pb-2 pr-3 text-left">구분</th>
                    <th className="pb-2 pr-3 text-left">내역</th>
                    <th className="pb-2 pr-3 text-right">금액</th>
                    <th className="pb-2 text-right">잔액</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {pageRows.map((row, i) => {
                    const k = ledgerUiKind(row);
                    const credit = ledgerIsCredit(row);
                    const amt = ledgerAmountLabel(row);
                    return (
                      <tr key={typeof row.id === "string" ? row.id : `p-${i}`}>
                        <td className="py-3 pr-3 text-xs text-slate-500 whitespace-nowrap">{ledgerAt(row)}</td>
                        <td className="py-3 pr-3">
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-700">
                            {kindBadge(k)}
                          </span>
                        </td>
                        <td className="py-3 pr-3 font-semibold text-slate-800">{detailLabel(row)}</td>
                        <td
                          className={`py-3 pr-3 text-right font-extrabold tabular-nums ${
                            credit ? "text-blue-600" : "text-red-600"
                          }`}
                        >
                          {credit && !amt.startsWith("+") && !amt.startsWith("-") ? `+${amt}` : amt}
                        </td>
                        <td className="py-3 text-right text-xs font-bold text-slate-500 tabular-nums">
                          {ledgerBalanceAfter(row)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {totalPages > 1 ? (
              <div className="mt-4 flex items-center justify-center gap-2">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold disabled:opacity-40"
                >
                  이전
                </button>
                <span className="text-xs font-bold text-slate-600">
                  {page} / {totalPages}
                </span>
                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold disabled:opacity-40"
                >
                  다음
                </button>
              </div>
            ) : null}
          </>
        )}
      </section>

      <Link href="/wallet/charge" className="inline-block text-sm font-bold text-blue-600 hover:underline">
        캐시 충전하러 가기 →
      </Link>
    </div>
  );
}
