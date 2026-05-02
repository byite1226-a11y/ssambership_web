import type { ReactNode } from "react";
import { ledgerAmountLabel, ledgerAt, ledgerTypeLabel } from "@/lib/cash/ledgerRowDisplay";

const BADGE: Record<string, string> = {
  topup: "bg-emerald-100 text-emerald-900",
  spend: "bg-slate-200 text-slate-900",
  refund: "bg-violet-100 text-violet-900",
  other: "bg-amber-100 text-amber-900",
};

function kindFromRow(row: Record<string, unknown>): { label: string; className: string } {
  const label = ledgerTypeLabel(row);
  const t = (typeof row.type === "string" && row.type) || (typeof row.entry_type === "string" && row.entry_type) || "";
  const low = t.toLowerCase();
  if (/charge|top|충전|credit|deposit/.test(low)) return { label, className: BADGE.topup };
  if (/refund|환불/.test(low)) return { label, className: BADGE.refund };
  if (/spend|use|debit|사용|차감/.test(low)) return { label, className: BADGE.spend };
  return { label: label === "—" ? "기타" : label, className: BADGE.other };
}

function Banner({ kind, message }: { kind: "loading" | "error" | "empty" | "info"; message: string }) {
  const skin =
    kind === "loading"
      ? "border-amber-200 bg-amber-50 text-amber-950"
      : kind === "error"
        ? "border-red-200 bg-red-50 text-red-950"
        : kind === "empty"
          ? "border-slate-200 bg-slate-50 text-slate-800"
          : "border-blue-200 bg-blue-50 text-blue-950";
  return <div className={`rounded-xl border px-3 py-2 text-sm font-semibold ${skin}`}>{message}</div>;
}

export function WalletLedgerView(props: {
  title: string;
  subtitle: string;
  filterSlot: ReactNode;
  balanceLine: string;
  balanceLoading: boolean;
  balanceError: string | null;
  recentRows: Record<string, unknown>[];
  recentError: string | null;
  allRows: Record<string, unknown>[];
  allError: string | null;
  balanceTable: string | null;
  ledgerTable: string | null;
  dataModelPoints: readonly string[];
}) {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-black text-slate-900">{props.title}</h1>
        <p className="mt-1 text-sm text-slate-600">{props.subtitle}</p>
      </header>

      {props.filterSlot}

      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-extrabold text-slate-900">현재 잔액</h2>
        {props.balanceLoading ? <Banner kind="loading" message="잔액 조회 중…" /> : null}
        {!props.balanceLoading && props.balanceError ? <Banner kind="error" message={props.balanceError} /> : null}
        {!props.balanceLoading && !props.balanceError && props.balanceLine ? <p className="mt-2 text-2xl font-black text-slate-900">{props.balanceLine}</p> : null}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-extrabold text-slate-900">최근 사용 내역</h2>
        {props.recentError ? <div className="mt-2"><Banner kind="error" message={props.recentError} /></div> : null}
        {!props.recentError && props.recentRows.length === 0 ? <Banner kind="empty" message="최근 원장이 없습니다." /> : null}
        <ul className="mt-2 space-y-2">
          {props.recentRows.map((row, i) => {
            const b = kindFromRow(row);
            return (
              <li key={typeof row.id === "string" ? row.id : `r-${i}`} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 p-2 text-sm">
                <span className="text-xs text-slate-600">
                  {ledgerAt(row)} · {ledgerAmountLabel(row)}
                </span>
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-bold ${b.className}`}>{b.label}</span>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-extrabold text-slate-900">원장 상세</h2>
        {props.allError ? <div className="mt-2"><Banner kind="error" message={props.allError} /></div> : null}
        {!props.allError && props.allRows.length === 0 ? (
          <Banner kind="empty" message="아직 표시할 사용 내역이 없습니다. 충전·이용 후 다시 확인해 주세요." />
        ) : null}
        <ul className="mt-3 space-y-2">
          {props.allRows.map((row, i) => {
            const b = kindFromRow(row);
            return (
              <li key={typeof row.id === "string" ? row.id : `a-${i}`} className="rounded-xl border border-slate-200 p-2 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${b.className}`}>{b.label}</span>
                  <span className="text-xs font-bold text-slate-700">{ledgerAmountLabel(row)}</span>
                </div>
                <p className="mt-1 text-xs text-slate-500">{ledgerAt(row)}</p>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
        <h3 className="text-sm font-extrabold text-slate-900">안내</h3>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-600">
          {props.dataModelPoints.map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}

export function CashLedgerFilterSkeleton() {
  return (
    <div className="flex flex-wrap gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm">
      {["전체", "충전", "사용", "환불"].map((tab) => (
        <span
          key={tab}
          className="cursor-not-allowed rounded-lg border border-dashed border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-500"
        >
          {tab} (필터·탭 — 연결 예정)
        </span>
      ))}
    </div>
  );
}
