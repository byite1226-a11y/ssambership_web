import Link from "next/link";
import type { LedgerLineRow } from "@/lib/cash/cashQueries";
import { ledgerAmountLabel, ledgerIsCredit, ledgerUiKind } from "@/lib/cash/ledgerRowDisplay";

function parseAmountCash(label: string): number {
  const n = Number(label.replace(/[^\d-]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

function monthUsageStats(rows: LedgerLineRow[]) {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  let custom = 0;
  let subscription = 0;
  let other = 0;

  for (const row of rows) {
    const r = row as Record<string, unknown>;
    const created = r.created_at;
    if (typeof created !== "string") continue;
    const d = new Date(created);
    if (Number.isNaN(d.getTime()) || d < monthStart) continue;
    if (ledgerIsCredit(r)) continue;
    const amt = Math.abs(parseAmountCash(ledgerAmountLabel(r)));
    const kind = ledgerUiKind(r);
    if (kind === "custom_request") custom += amt;
    else if (kind === "subscription") subscription += amt;
    else other += amt;
  }

  const total = custom + subscription + other;
  return { total, custom, subscription, other };
}

export function WalletChargeRightSidebar(props: { ledgerRows: LedgerLineRow[] }) {
  const stats = monthUsageStats(props.ledgerRows);
  const max = Math.max(stats.custom, stats.subscription, stats.other, 1);

  return (
    <aside className="space-y-4 lg:sticky lg:top-8">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-extrabold text-slate-900">충전 안내</h2>
        <ul className="mt-3 space-y-2.5 text-xs leading-relaxed text-slate-600">
          <li className="flex gap-2">
            <span className="text-blue-600" aria-hidden>
              •
            </span>
            충전한 캐시는 즉시 사용 가능해요
          </li>
          <li className="flex gap-2">
            <span className="text-blue-600" aria-hidden>
              •
            </span>
            보너스 캐시는 이벤트 조건에 따라 지급됩니다
          </li>
          <li className="flex gap-2">
            <span className="text-blue-600" aria-hidden>
              •
            </span>
            안전한 결제를 위해 SSL 보안 시스템을 적용하여 보호합니다
          </li>
        </ul>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-extrabold text-slate-900">이번 달 사용 요약</h2>
          <Link href="/wallet/ledger" className="text-xs font-bold text-blue-600 hover:underline">
            전체 보기 &gt;
          </Link>
        </div>
        <p className="mt-2 text-2xl font-black tabular-nums text-slate-900">
          {stats.total.toLocaleString("ko-KR")}
          <span className="ml-1 text-sm font-bold text-slate-500">캐시</span>
        </p>
        <p className="text-xs text-slate-500">총 사용 금액 (차감 합계)</p>
        <div className="mt-4 space-y-3">
          {[
            { label: "맞춤의뢰", value: stats.custom, color: "bg-red-400" },
            { label: "구독제", value: stats.subscription, color: "bg-violet-400" },
            { label: "기타", value: stats.other, color: "bg-slate-300" },
          ].map((item) => (
            <div key={item.label}>
              <div className="flex justify-between text-xs font-semibold text-slate-600">
                <span>{item.label}</span>
                <span>{item.value.toLocaleString("ko-KR")}캐시</span>
              </div>
              <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  className={`h-full rounded-full ${item.color}`}
                  style={{ width: `${Math.round((item.value / max) * 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-amber-100 bg-amber-50/40 p-5">
        <h2 className="text-sm font-extrabold text-amber-950">안내 및 유의사항</h2>
        <ul className="mt-3 space-y-2 text-xs leading-relaxed text-amber-950/90">
          <li>충전한 캐시는 환불이 불가합니다</li>
          <li>현금 영수증은 결제 수단에 따라 자동 발급됩니다</li>
          <li>문의사항은 고객센터를 이용해 주세요</li>
        </ul>
        <Link
          href="/notifications"
          className="mt-3 inline-block text-xs font-bold text-blue-700 hover:underline"
        >
          고객센터 바로가기 &gt;
        </Link>
      </section>
    </aside>
  );
}
