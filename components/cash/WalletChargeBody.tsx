import Link from "next/link";
import { formatWalletRowDisplay } from "@/lib/cash/cashQueries";
import type { WalletChargePageData } from "@/lib/cash/walletRouteData";
import { ledgerTypeLabel } from "@/lib/cash/ledgerRowDisplay";

const FAQ = [
  "캐시는 멤버십 구독·맞춤의뢰·수강 견적 결제와 별도 흐름입니다. 이 화면은 충전·잔액·원장만 다룹니다.",
  "충전은 PG/결제 intent(payments) 연동 후 ‘결제하기’가 살아납니다(이번 턴은 CTA 자리).",
  "잔액·원장은 `cash_wallets` / `cash_ledger` (또는 후보 테이블) 기준으로 표시됩니다.",
  "맞춤의뢰 주문·에스크로는 `/custom-request/…` 를 사용하며 여기에 섞지 않습니다.",
] as const;

function Banner({ kind, message }: { kind: "error" | "empty" | "info"; message: string }) {
  const skin =
    kind === "error"
      ? "border-red-200 bg-red-50 text-red-950"
      : kind === "empty"
        ? "border-slate-200 bg-slate-50 text-slate-800"
        : "border-blue-200 bg-blue-50 text-blue-950";
  return <div className={`rounded-xl border px-3 py-2 text-sm font-semibold ${skin}`}>{message}</div>;
}

export function WalletChargeBody(props: { data: WalletChargePageData; userIdShort: string }) {
  const { data, userIdShort } = props;
  const { balance, packages, ledgerPreview, payments } = data;
  const balanceText = balance.error
    ? ""
    : balance.row
      ? formatWalletRowDisplay(balance.row)
      : "지갑 행 없음(스키마·RLS)";

  const packageRows = packages.rows.slice(0, 5);
  const slots = Array.from({ length: 5 }, (_, i) => packageRows[i] ?? null);

  return (
    <div className="space-y-6 text-slate-800">
      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-extrabold text-slate-900">현재 잔액</h2>
        {balance.error ? <div className="mt-2"><Banner kind="error" message={balance.error} /></div> : null}
        {!balance.error && balanceText ? <p className="mt-2 text-2xl font-black text-slate-900">{balanceText}</p> : null}
        {!balance.error && !balanceText ? (
          <div className="mt-2">
            <Banner kind="empty" message="잔액을 표시할 데이터가 없습니다." />
          </div>
        ) : null}
        {balance.table ? <p className="mt-1 text-xs text-slate-500">source: {balance.table}</p> : null}
        <p className="mt-2 text-xs text-slate-500">user …{userIdShort}</p>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-extrabold text-slate-900">충전 패키지(최대 5슬롯)</h2>
        {packages.error ? <div className="mt-2"><Banner kind="error" message={packages.error} /></div> : null}
        <ul className="mt-3 grid gap-2 sm:grid-cols-2">
          {slots.map((row, i) => (
            <li
              key={row && typeof row.id === "string" ? row.id : `pkg-slot-${i}`}
              className="min-h-[100px] rounded-xl border border-slate-200 p-3 text-sm"
            >
              {row ? (
                <pre className="max-h-40 overflow-auto text-xs text-slate-800">{JSON.stringify(row, null, 2)}</pre>
              ) : (
                <p className="text-xs text-slate-500">슬롯 {i + 1} — `cash_topup_packages`에 행이 없으면 비어 있음(더미 금지)</p>
              )}
            </li>
          ))}
        </ul>
        {packages.table ? <p className="mt-2 text-xs text-slate-500">source: {packages.table}</p> : null}
      </section>

      <section className="rounded-2xl border border-amber-200 bg-amber-50/50 p-5 text-sm text-amber-950">
        <h2 className="text-lg font-extrabold">충전 FAQ</h2>
        <ul className="mt-2 list-inside list-decimal space-y-1">
          {FAQ.map((q, i) => (
            <li key={i}>{q}</li>
          ))}
        </ul>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-extrabold text-slate-900">최근 사용(원장 요약)</h2>
        {ledgerPreview.error ? <div className="mt-2"><Banner kind="error" message={ledgerPreview.error} /></div> : null}
        {!ledgerPreview.error && ledgerPreview.rows.length === 0 ? (
          <div className="mt-2">
            <Banner kind="empty" message="원장이 없습니다. 충전·사용이 쌓이면 표시됩니다." />
          </div>
        ) : null}
        <ul className="mt-2 space-y-1 text-sm">
          {ledgerPreview.rows.slice(0, 5).map((row, i) => (
            <li key={typeof row.id === "string" ? row.id : `l-${i}`} className="flex justify-between gap-2 border-b border-slate-100 py-1">
              <span className="text-slate-600">{ledgerTypeLabel(row as Record<string, unknown>)}</span>
              <span className="font-mono text-xs text-slate-500">{(row.id as string) ?? "—"}</span>
            </li>
          ))}
        </ul>
        {ledgerPreview.table ? <p className="mt-1 text-xs text-slate-500">source: {ledgerPreview.table}</p> : null}
        <p className="mt-2 text-xs">
          <Link className="font-bold text-blue-700 underline" href="/wallet/ledger">
            전체 원장·필터 →
          </Link>
        </p>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-slate-50/80 p-5">
        <h2 className="text-lg font-extrabold text-slate-900">최근 결제(스냅샷)</h2>
        {payments.error ? <div className="mt-2"><Banner kind="error" message={payments.error} /></div> : null}
        {!payments.error && payments.rows.length === 0 ? (
          <div className="mt-2">
            <Banner kind="empty" message="payments에서 해당 사용자 row가 없습니다." />
          </div>
        ) : null}
        <ul className="mt-2 space-y-1 text-xs text-slate-700">
          {payments.rows.map((r, i) => (
            <li key={i} className="font-mono">
              {JSON.stringify(r).slice(0, 200)}…
            </li>
          ))}
        </ul>
        {payments.table ? <p className="mt-1 text-xs text-slate-500">source: {payments.table} — {payments.probe}</p> : <p className="text-xs text-slate-500">{payments.probe}</p>}
      </section>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled
          className="cursor-not-allowed rounded-lg bg-slate-300 px-4 py-2 text-sm font-bold text-slate-600"
          title="PG·intent 연동 후"
        >
          결제·충전 진행(자리)
        </button>
        <Link className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-800" href="/wallet/ledger">
          사용 내역
        </Link>
        <Link className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-bold text-slate-600" href="/cash">
          기존 /cash (공개)
        </Link>
      </div>
    </div>
  );
}
