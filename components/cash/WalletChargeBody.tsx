import Link from "next/link";
import { formatWalletRowDisplay } from "@/lib/cash/cashQueries";
import type { WalletChargePageData } from "@/lib/cash/walletRouteData";
import { ledgerTypeLabel } from "@/lib/cash/ledgerRowDisplay";
import { WalletTopupTestForm } from "@/components/cash/WalletTopupTestForm";
import { USER_UI_LOAD_FAILED } from "@/lib/constants/userFacingMessages";

const FAQ = [
  "캐시는 멤버십·맞춤의뢰 등과 별도로, 충전·잔액·사용 내역을 관리하는 흐름입니다.",
  "충전은 결제 연동이 완료되면 안내에 따라 진행할 수 있습니다.",
  "잔액과 사용 내역은 이 화면과 원장 메뉴에서 확인할 수 있어요.",
  "맞춤의뢰 주문은 맞춤의뢰 메뉴에서 따로 확인해 주세요.",
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
  const status = pickFirstString(r, ["status", "state"]);
  const parts = [amt ? `금액: ${amt}` : null, status ? `상태: ${status}` : null].filter(Boolean) as string[];
  return parts.length ? parts.join(" · ") : "결제 내역";
}

function Banner({ kind, message }: { kind: "error" | "empty" | "info"; message: string }) {
  const skin =
    kind === "error"
      ? "border-red-200 bg-red-50 text-red-950"
      : kind === "empty"
        ? "border-slate-200 bg-slate-50 text-slate-800"
        : "border-blue-200 bg-blue-50 text-blue-950";
  return <div className={`rounded-xl border px-3 py-2 text-sm font-semibold ${skin}`}>{message}</div>;
}

export function WalletChargeBody(props: {
  data: WalletChargePageData;
  actionOk?: string | null;
  actionError?: string | null;
  /** 서버: `CASH_TOPUP_ALLOW_TEST_CHARGE === "true"` 일 때만 true */
  allowTestTopup?: boolean;
}) {
  const { data, actionOk, actionError, allowTestTopup = false } = props;
  const { balance, packages, ledgerPreview, payments } = data;

  const balanceText = balance.error
    ? ""
    : balance.row
      ? formatWalletRowDisplay(balance.row)
      : "지갑 정보를 찾을 수 없습니다.";

  const packageRows = packages.rows.slice(0, 5);
  const slots = Array.from({ length: 5 }, (_, i) => packageRows[i] ?? null);

  return (
    <div className="space-y-6 text-slate-800">
      {actionError ? <Banner kind="error" message={actionError} /> : null}
      {actionOk ? <Banner kind="info" message={actionOk} /> : null}

      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-extrabold text-slate-900">현재 잔액</h2>
        {balance.error ? <div className="mt-2"><Banner kind="error" message={USER_UI_LOAD_FAILED} /></div> : null}
        {!balance.error && balanceText ? <p className="mt-2 text-2xl font-black text-slate-900">{balanceText}</p> : null}
        {!balance.error && !balanceText ? (
          <div className="mt-2">
            <Banner kind="empty" message="잔액을 표시할 데이터가 없습니다." />
          </div>
        ) : null}
        <div id="test-topup" className="mt-4">
          {allowTestTopup ? (
            <WalletTopupTestForm />
          ) : (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
              <p className="font-extrabold text-slate-900">캐시 충전</p>
              <p className="mt-1">PG 결제 연동 준비 중입니다.</p>
            </div>
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-extrabold text-slate-900">충전 상품</h2>
        {packages.error ? <div className="mt-2"><Banner kind="error" message={USER_UI_LOAD_FAILED} /></div> : null}
        <ul className="mt-3 grid gap-2 sm:grid-cols-2">
          {slots.map((row, i) => (
            <li
              key={row && typeof row.id === "string" ? row.id : `pkg-slot-${i}`}
              className="min-h-[100px] rounded-xl border border-slate-200 p-3 text-sm"
            >
              {row ? (
                <p className="text-sm font-semibold text-slate-800">{packageCardLine(row as Record<string, unknown>)}</p>
              ) : (
                <p className="text-xs text-slate-500">표시할 상품이 없습니다.</p>
              )}
            </li>
          ))}
        </ul>
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
        {ledgerPreview.error ? <div className="mt-2"><Banner kind="error" message={USER_UI_LOAD_FAILED} /></div> : null}
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
        <p className="mt-2 text-xs">
          <Link className="font-bold text-blue-700 underline" href="/wallet/ledger">
            전체 원장·필터 →
          </Link>
        </p>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-slate-50/80 p-5">
        <h2 className="text-lg font-extrabold text-slate-900">최근 결제</h2>
        {payments.error ? <div className="mt-2"><Banner kind="error" message={USER_UI_LOAD_FAILED} /></div> : null}
        {!payments.error && payments.rows.length === 0 ? (
          <div className="mt-2">
            <Banner kind="empty" message="표시할 결제 내역이 없습니다." />
          </div>
        ) : null}
        <ul className="mt-2 space-y-1 text-xs text-slate-700">
          {payments.rows.map((r, i) => (
            <li key={i} className="rounded border border-slate-100 bg-slate-50/80 px-2 py-1.5">
              {paymentCardLine(r as Record<string, unknown>)}
            </li>
          ))}
        </ul>
      </section>

      <div className="flex flex-wrap gap-2">
        {allowTestTopup ? (
          <Link
            href="#test-topup"
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700"
          >
            테스트 충전(위 폼)
          </Link>
        ) : null}
        {!allowTestTopup ? (
          <p className="w-full text-sm text-slate-600 sm:w-auto sm:self-center">PG 결제 연동 준비 중입니다.</p>
        ) : null}
        <button type="button" disabled className="cursor-not-allowed rounded-lg bg-slate-300 px-4 py-2 text-sm font-bold text-slate-600" title="준비 중">
          결제 진행(준비 중)
        </button>
        <Link className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-800" href="/wallet/ledger">
          사용 내역
        </Link>
        <Link className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-bold text-slate-600" href="/cash">
          공개 캐시 안내
        </Link>
      </div>
    </div>
  );
}
