import Link from "next/link";
import {
  ledgerAmountLabel,
  ledgerAt,
  ledgerBalanceAfter,
  ledgerIsCredit,
  ledgerReasonLabel,
  ledgerUiKind,
} from "@/lib/cash/ledgerRowDisplay";
import type { LedgerLineRow } from "@/lib/cash/cashQueries";

function kindIcon(kind: ReturnType<typeof ledgerUiKind>) {
  if (kind === "charge") return { emoji: "💳", label: "캐시 충전" };
  if (kind === "subscription") return { emoji: "📚", label: "구독제" };
  if (kind === "custom_request") return { emoji: "📋", label: "맞춤의뢰" };
  return { emoji: "•", label: "기타" };
}

function cleanDetail(row: Record<string, unknown>): string {
  const r = ledgerReasonLabel(row);
  if (r && r !== "—") return r;
  const k = ledgerUiKind(row);
  return kindIcon(k).label;
}

export function WalletChargeRecentSummary(props: {
  rows: LedgerLineRow[];
  error: string | null;
}) {
  const list = props.rows.slice(0, 5);

  return (
    <section className="rounded-2xl border border-[#e2e8f2] bg-white p-5 sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-base font-extrabold text-[#0f172a]">
            <span className="block h-4 w-[3px] shrink-0 rounded-sm bg-[#1A56DB]" aria-hidden />
            최근 사용 내역
          </h2>
          <p className="mt-1 text-xs font-medium leading-relaxed text-[#8a96a8]">최근 캐시 충전과 사용 흐름입니다.</p>
        </div>
        <Link href="/wallet/ledger" className="text-xs font-bold text-blue-600 hover:underline">
          사용내역 전체 &gt;
        </Link>
      </div>

      {props.error ? (
        <p className="mt-4 text-sm text-red-700">내역을 불러오지 못했습니다.</p>
      ) : list.length === 0 ? (
        <p className="mt-4 py-8 text-center text-sm text-slate-500">최근 사용 내역이 없습니다.</p>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[520px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-xs font-bold text-slate-400">
                <th className="pb-2 pr-3 w-10" />
                <th className="pb-2 pr-3">내역</th>
                <th className="pb-2 pr-3 whitespace-nowrap">일시</th>
                <th className="pb-2 pr-3 text-right whitespace-nowrap">금액</th>
                <th className="pb-2 text-right whitespace-nowrap">잔액</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {list.map((row, i) => {
                const r = row as Record<string, unknown>;
                const kind = ledgerUiKind(r);
                const icon = kindIcon(kind);
                const credit = ledgerIsCredit(r);
                const amt = ledgerAmountLabel(r);
                return (
                  <tr key={typeof r.id === "string" ? r.id : `row-${i}`}>
                    <td className="py-3 pr-3 text-lg" aria-hidden>
                      {icon.emoji}
                    </td>
                    <td className="py-3 pr-3 font-semibold text-slate-800">{cleanDetail(r)}</td>
                    <td className="py-3 pr-3 text-xs text-slate-500 whitespace-nowrap">{ledgerAt(r)}</td>
                    <td
                      className={`py-3 pr-3 text-right font-extrabold tabular-nums whitespace-nowrap ${
                        credit ? "text-[#047857]" : "text-[#dc2626]"
                      }`}
                    >
                      {credit && !amt.startsWith("+") ? `+${amt}` : amt}
                    </td>
                    <td className="py-3 text-right text-xs font-bold text-slate-500 tabular-nums whitespace-nowrap">
                      {ledgerBalanceAfter(r)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
