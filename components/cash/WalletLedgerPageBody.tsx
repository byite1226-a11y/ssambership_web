import Link from "next/link";
import { formatWalletRowDisplay } from "@/lib/cash/cashQueries";
import {
  ledgerAmountLabel,
  ledgerAt,
  ledgerOrderOrPaymentRef,
  ledgerReasonLabel,
  ledgerTypeLabel,
} from "@/lib/cash/ledgerRowDisplay";
import type { WalletLedgerPageData } from "@/lib/cash/walletRouteData";
import { CashLedgerFilterSkeleton } from "@/components/cash/WalletLedgerView";

function Banner({ kind, message }: { kind: "error" | "empty" | "info"; message: string }) {
  const skin =
    kind === "error"
      ? "border-red-200 bg-red-50 text-red-950"
      : kind === "empty"
        ? "border-slate-200 bg-slate-50 text-slate-800"
        : "border-amber-200 bg-amber-50 text-amber-950";
  return <div className={`rounded-xl border px-3 py-2 text-sm font-semibold ${skin}`}>{message}</div>;
}

export function WalletPeriodFilterSlot(props: { from: string | null; to: string | null }) {
  return (
    <div className="flex flex-wrap items-end gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
      <span className="text-xs font-bold text-slate-500">기간(자리)</span>
      <input
        type="text"
        readOnly
        disabled
        className="w-32 cursor-not-allowed rounded border border-dashed border-slate-300 bg-white px-2 py-1 text-xs"
        placeholder="from (query 후속)"
        value={props.from ?? ""}
      />
      <span>~</span>
      <input
        type="text"
        readOnly
        disabled
        className="w-32 cursor-not-allowed rounded border border-dashed border-slate-300 bg-white px-2 py-1 text-xs"
        placeholder="to (query 후속)"
        value={props.to ?? ""}
      />
      <span className="text-xs">URL: `?from=&to=&kind=` — 서버 필터는 후속</span>
    </div>
  );
}

export function WalletKindFilterSlot(props: { kind: string | null }) {
  return (
    <div className="flex flex-wrap gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm">
      <span className="text-xs font-bold text-slate-500">유형(자리)</span>
      <span className="cursor-not-allowed rounded-lg border border-dashed border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-500">
        전체 (필터 연동 예정) {props.kind ? `· 현재 kind=${props.kind}` : ""}
      </span>
    </div>
  );
}

export function WalletLedgerPageBody(props: { data: WalletLedgerPageData; userIdShort: string }) {
  const { data, userIdShort } = props;
  const { balance, ledger, filter } = data;
  const balanceText = balance.error
    ? ""
    : balance.row
      ? formatWalletRowDisplay(balance.row)
      : "지갑 행 없음";

  return (
    <div className="space-y-5 text-slate-800">
      <WalletPeriodFilterSlot from={filter.from} to={filter.to} />
      <WalletKindFilterSlot kind={filter.kind} />
      <CashLedgerFilterSkeleton />

      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-extrabold text-slate-900">잔액(참고)</h2>
        {balance.error ? <div className="mt-2"><Banner kind="error" message={balance.error} /></div> : null}
        {!balance.error ? <p className="mt-1 text-xl font-bold">{balanceText}</p> : null}
        {balance.table ? <p className="text-xs text-slate-500">source: {balance.table}</p> : null}
        <p className="text-xs text-slate-500">user …{userIdShort}</p>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
        <h2 className="text-sm font-extrabold text-slate-900">잔액 변화 타임라인(자리)</h2>
        {ledger.error ? <div className="mt-2"><Banner kind="error" message={ledger.error} /></div> : null}
        {!ledger.error && ledger.rows.length === 0 ? <div className="mt-2"><Banner kind="empty" message="원장이 비어 있음" /></div> : null}
        <ol className="mt-2 space-y-1 border-l-2 border-slate-300 pl-3 text-xs text-slate-700">
          {ledger.rows.slice(0, 12).map((row, i) => {
            const r = row as Record<string, unknown>;
            return (
              <li key={typeof r.id === "string" ? r.id : `t-${i}`} className="pl-0">
                <span className="text-slate-500">{ledgerAt(r)}</span> · {ledgerTypeLabel(r)} · {ledgerAmountLabel(r)}
              </li>
            );
          })}
        </ol>
        {ledger.table ? <p className="mt-1 text-xs text-slate-500">source: {ledger.table}</p> : null}
      </section>

      <section className="overflow-x-auto rounded-2xl border border-slate-200 bg-white p-4">
        <h2 className="text-lg font-extrabold text-slate-900">원장 테이블</h2>
        {ledger.error ? <div className="mt-2"><Banner kind="error" message={ledger.error} /></div> : null}
        {!ledger.error && ledger.rows.length === 0 ? <div className="mt-2"><Banner kind="empty" message="행 없음" /></div> : null}
        <table className="mt-3 w-full min-w-[640px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-xs text-slate-500">
              <th className="p-2">일시</th>
              <th className="p-2">유형</th>
              <th className="p-2">금액</th>
              <th className="p-2">사유</th>
              <th className="p-2">주문/결제 참조</th>
            </tr>
          </thead>
          <tbody>
            {ledger.rows.map((row, i) => {
              const r = row as Record<string, unknown>;
              return (
                <tr key={typeof r.id === "string" ? r.id : `tr-${i}`} className="border-b border-slate-100">
                  <td className="p-2 font-mono text-xs">{ledgerAt(r)}</td>
                  <td className="p-2">{ledgerTypeLabel(r)}</td>
                  <td className="p-2 font-mono">{ledgerAmountLabel(r)}</td>
                  <td className="p-2 text-slate-700">{ledgerReasonLabel(r)}</td>
                  <td className="p-2 font-mono text-xs">{ledgerOrderOrPaymentRef(r)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <p className="mt-2 text-xs text-amber-800">맞춤의뢰 거래·에스크로는 이 테이블에 섞지 않습니다(별도 주문/결제 흐름).</p>
      </section>

      <p className="text-sm">
        <Link className="font-bold text-blue-700 underline" href="/wallet/charge">
          ← 캐시 충전
        </Link>
      </p>
    </div>
  );
}
