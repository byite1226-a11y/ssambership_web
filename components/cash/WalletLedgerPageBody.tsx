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

function Banner({ kind, message }: { kind: "error" | "empty" | "info"; message: string }) {
  const skin =
    kind === "error"
      ? "border-red-200 bg-red-50 text-red-950"
      : kind === "empty"
        ? "border-slate-100 bg-slate-50/60 text-slate-500 text-xs text-center py-8"
        : "border-blue-100 bg-blue-50/40 text-blue-900";
  return <div className={`rounded-2xl border px-5 py-4 font-medium ${skin}`}>{message}</div>;
}

function cleanReasonLabel(reason: string | null | undefined): string {
  if (!reason || reason === "—") return "기타 내역";
  const r = reason.toLowerCase();
  if (r.includes("refund")) return "환불 승인";
  if (r.includes("subscription")) return "구독 결제";
  if (r.includes("topup") || r.includes("charge")) return "캐시 충전";
  if (r.includes("staging_manual")) return "캐시 충전";
  if (r.includes("staging") || r.includes("repair")) return "캐시 충전";
  return reason;
}

export function WalletLedgerPageBody(props: { data: WalletLedgerPageData }) {
  const { data } = props;
  const { balance, ledger } = data;
  const balanceText = balance.error
    ? "—"
    : balance.row
      ? formatWalletRowDisplay(balance.row)
      : "0캐시";

  return (
    <div className="space-y-6 text-slate-800">
      {/* Visual Notice for Pending Filters */}
      <div className="rounded-xl border border-slate-100 bg-slate-50 p-3.5 text-center text-xs font-medium text-slate-500 select-none">
        필터는 준비 중이에요. 지금은 최근 내역을 먼저 보여 드릴게요.
      </div>

      {/* Balance summary as a distinct white card */}
      <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm flex flex-col justify-between min-h-[112px]">
        <div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">내 지갑</p>
          {balance.error ? (
            <div className="mt-2">
              <Banner kind="error" message="잔액 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요." />
            </div>
          ) : (
            <h3 className="text-2xl font-black text-slate-900 mt-1.5">{balanceText}</h3>
          )}
        </div>
      </section>

      {/* Timeline Card */}
      <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h2 className="text-base font-bold text-slate-900">최근 이용 및 변화 내역</h2>
          <Link className="text-xs font-bold text-blue-600 hover:underline" href="/wallet/charge">
            캐시 충전 바로가기 &rarr;
          </Link>
        </div>

        {ledger.error ? (
          <Banner kind="error" message="내역을 불러오지 못했습니다." />
        ) : ledger.rows.length === 0 ? (
          <Banner kind="empty" message="아직 표시할 캐시 사용 및 충전 내역이 없습니다." />
        ) : (
          <div className="space-y-3">
            {ledger.rows.map((row, i) => {
              const r = row as Record<string, unknown>;
              const amtLabel = ledgerAmountLabel(r);
              const isNegative = amtLabel.includes("-");
              const reason = cleanReasonLabel(ledgerReasonLabel(r));

              return (
                <div
                  key={typeof r.id === "string" ? r.id : `tr-${i}`}
                  className="flex flex-col gap-3 rounded-xl border border-slate-100 bg-slate-50/60 p-4 transition hover:bg-slate-50 sm:flex-row sm:items-start sm:justify-between"
                >
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <div className="flex flex-wrap items-baseline gap-2 gap-y-1">
                      <span className="inline-flex shrink-0 select-none rounded border border-slate-100 bg-white px-2 py-0.5 text-xs font-semibold text-slate-600 whitespace-nowrap">
                        {ledgerTypeLabel(r)}
                      </span>
                      <span className="min-w-0 text-sm font-extrabold text-slate-900 break-words">{reason}</span>
                    </div>
                    <p className="min-w-0 text-xs font-medium text-slate-400 break-words">
                      <span className="whitespace-nowrap text-slate-500">{ledgerAt(r)}</span>
                      {ledgerOrderOrPaymentRef(r) !== "—" ? (
                        <>
                          <span className="mx-1 text-slate-300">·</span>
                          <span className="break-all">{ledgerOrderOrPaymentRef(r)}</span>
                        </>
                      ) : null}
                    </p>
                  </div>
                  <div className={`text-sm font-black text-right sm:text-base whitespace-nowrap flex-shrink-0 ${isNegative ? "text-red-500" : "text-blue-600"}`}>
                    {amtLabel}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <p className="text-xs text-slate-400 text-center select-none pt-2">
        맞춤의뢰 진행 중인 결제 및 환불 내역은 맞춤의뢰 관리 메뉴에서 확인하실 수 있습니다.
      </p>
    </div>
  );
}
