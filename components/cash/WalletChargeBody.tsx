import Link from "next/link";
import { formatWalletRowDisplay } from "@/lib/cash/cashQueries";
import type { WalletChargePageData } from "@/lib/cash/walletRouteData";
import { ledgerTypeLabel } from "@/lib/cash/ledgerRowDisplay";
import { WalletTopupTestForm } from "@/components/cash/WalletTopupTestForm";
import { USER_UI_LOAD_FAILED } from "@/lib/constants/userFacingMessages";

const FAQ = [
  "캐시는 멤버십 및 맞춤의뢰 이용 시 사용할 수 있으며, 충전 및 사용 내역이 시간 순으로 기록됩니다.",
  "정식 충전 기능은 현재 준비 중이며, 출시 이후 안내에 따라 진행하실 수 있습니다.",
  "캐시 잔액과 이용 내역은 상시 마이페이지 및 캐시 원장 메뉴에서 확인 가능합니다.",
] as const;

function pickFirstString(row: Record<string, unknown>, keys: string[]): string | null {
  for (const k of keys) {
    const v = row[k];
    if (typeof v === "string" && v.trim()) return v.trim().slice(0, 120);
    if (typeof v === "number") return String(v);
  }
  return null;
}

function packageCardLine(row: Record<string, unknown>): string {
  return pickFirstString(row, ["title", "name", "label", "description", "summary"]) ?? "충전 상품";
}

function paymentCardLine(r: Record<string, unknown>): string {
  const amt = pickFirstString(r, ["amount", "amount_krw", "total", "price"]);
  let status = pickFirstString(r, ["status", "state"]);
  if (status) {
    const s = status.toLowerCase().trim();
    if (s === "succeeded" || s === "paid" || s === "success") {
      status = "결제 성공";
    } else if (s === "refunded" || s === "refund") {
      status = "환불 완료";
    } else if (s === "failed") {
      status = "결제 실패";
    } else if (s === "pending") {
      status = "대기 중";
    }
  }
  const parts = [amt ? `금액: ${amt}` : null, status ? `상태: ${status}` : null].filter(Boolean) as string[];
  return parts.length ? parts.join(" · ") : "결제 내역";
}

function Banner({ kind, message }: { kind: "error" | "empty" | "info"; message: string }) {
  const skin =
    kind === "error"
      ? "border-red-200 bg-red-50 text-red-950 text-xs py-2 px-3 rounded-xl border"
      : kind === "empty"
        ? "border-slate-100 bg-slate-50/60 text-slate-500 text-xs py-5 px-4 rounded-xl border text-center font-medium"
        : "border-blue-100 bg-blue-50/40 text-blue-900 text-xs py-2 px-3 rounded-xl border";
  return <div className={`font-medium ${skin}`}>{message}</div>;
}

export function WalletChargeBody(props: {
  data: WalletChargePageData;
  actionOk?: string | null;
  actionError?: string | null;
  allowTestTopup?: boolean;
}) {
  const { data, actionOk, actionError, allowTestTopup = false } = props;
  const { balance, packages, ledgerPreview, payments } = data;

  const balanceText = balance.error
    ? "—"
    : balance.row
      ? formatWalletRowDisplay(balance.row)
      : "0캐시";

  const packageRows = packages.rows.slice(0, 5);

  return (
    <div className="space-y-6 text-slate-800">
      {actionError ? <Banner kind="error" message={actionError} /> : null}
      {actionOk ? <Banner kind="info" message={actionOk} /> : null}

      {/* Current Balance Card */}
      <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm flex flex-col justify-between min-h-[112px]">
        <div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">현재 잔액</p>
          {balance.error ? (
            <div className="mt-2">
              <Banner kind="error" message={USER_UI_LOAD_FAILED} />
            </div>
          ) : (
            <h3 className="text-3xl font-black text-slate-900 mt-1.5">{balanceText}</h3>
          )}
        </div>

        <div id="test-topup" className="mt-4">
          {allowTestTopup ? (
            <WalletTopupTestForm />
          ) : (
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 text-xs text-slate-600 font-medium">
              <p className="font-bold text-slate-800 mb-0.5">캐시 충전</p>
              <p>정식 충전 기능은 현재 준비 중입니다.</p>
            </div>
          )}
        </div>
      </section>

      {/* Packages Area */}
      <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
        <h2 className="text-base font-bold text-slate-900">충전 상품</h2>
        {packages.error ? (
          <div className="mt-2">
            <Banner kind="error" message={USER_UI_LOAD_FAILED} />
          </div>
        ) : packageRows.length === 0 ? (
          <div className="mt-3">
            <Banner kind="empty" message="아직 선택 가능한 충전 상품이 없어요. 충전 상품이 준비되면 이곳에서 바로 확인하실 수 있습니다." />
          </div>
        ) : (
          <ul className="mt-3 grid gap-3 sm:grid-cols-2">
            {packageRows.map((row) => (
              <li
                key={row && typeof row.id === "string" ? row.id : `pkg-slot`}
                className="min-h-[80px] rounded-xl border border-slate-100 bg-slate-50/40 p-4 text-sm flex flex-col justify-between"
              >
                <p className="text-sm font-bold text-slate-800">
                  {packageCardLine(row as Record<string, unknown>)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* FAQ Card: visually soft and clear */}
      <section className="rounded-2xl border border-slate-100 bg-slate-50/50 p-5 space-y-3">
        <h2 className="text-sm font-extrabold text-slate-800">💡 자주 묻는 질문</h2>
        <ul className="list-decimal space-y-1 pl-4 text-xs text-slate-500 font-medium leading-relaxed">
          {FAQ.map((q, i) => (
            <li key={i}>{q}</li>
          ))}
        </ul>
      </section>

      {/* Ledger Preview Card */}
      <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h2 className="text-base font-bold text-slate-900">최근 사용 내역 (요약)</h2>
          <Link className="text-xs font-bold text-blue-600 hover:underline" href="/wallet/ledger">
            전체 원장·필터 &rarr;
          </Link>
        </div>

        {ledgerPreview.error ? (
          <div className="mt-2">
            <Banner kind="error" message={USER_UI_LOAD_FAILED} />
          </div>
        ) : ledgerPreview.rows.length === 0 ? (
          <div className="mt-2">
            <Banner kind="empty" message="최근 표시할 사용 내역이 없습니다." />
          </div>
        ) : (
          <ul className="mt-3 space-y-2 text-sm">
            {ledgerPreview.rows.slice(0, 5).map((row, i) => {
              const r = row as Record<string, unknown>;
              return (
                <li
                  key={typeof r.id === "string" ? r.id : `l-${i}`}
                  className="flex justify-between items-center bg-slate-50/60 p-3 rounded-xl border border-slate-100"
                >
                  <span className="text-xs font-bold text-slate-700">
                    {ledgerTypeLabel(r)}
                  </span>
                  <span className="text-xs font-medium text-slate-400">
                    내역 번호: {typeof r.id === "string" ? r.id.slice(0, 8) : "—"}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* Payments Card */}
      <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
        <h2 className="text-base font-bold text-slate-900">최근 결제 내역</h2>
        {payments.error ? (
          <div className="mt-2">
            <Banner kind="error" message={USER_UI_LOAD_FAILED} />
          </div>
        ) : payments.rows.length === 0 ? (
          <div className="mt-2">
            <Banner kind="empty" message="표시할 결제 내역이 없습니다." />
          </div>
        ) : (
          <ul className="mt-3 space-y-2 text-xs text-slate-700">
            {payments.rows.map((r, i) => (
              <li key={i} className="rounded-xl border border-slate-100 bg-slate-50/60 p-3 font-medium">
                {paymentCardLine(r as Record<string, unknown>)}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
