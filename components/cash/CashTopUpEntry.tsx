import type { ReactNode } from "react";
import Link from "next/link";
import {
  USER_UI_CASH_BALANCE_LOAD_FAILED,
  USER_UI_CASH_PACKAGES_EMPTY_PRIMARY,
  USER_UI_CASH_PACKAGES_EMPTY_SECONDARY,
  USER_UI_CASH_PACKAGES_LOAD_FAILED,
} from "@/lib/constants/userFacingMessages";

function pickFirstString(row: Record<string, unknown>, keys: string[]): string | null {
  for (const k of keys) {
    const v = row[k];
    if (typeof v === "string" && v.trim()) return v.trim().slice(0, 120);
    if (typeof v === "number" && Number.isFinite(v)) return String(v);
  }
  return null;
}

function packageCardTitle(row: Record<string, unknown>): string {
  return pickFirstString(row, ["title", "name", "label", "description", "summary"]) ?? "충전 상품";
}

function packageCardExtra(row: Record<string, unknown>): string | null {
  const amt = pickFirstString(row, ["amount", "amount_krw", "price", "total", "price_krw"]);
  const bonus = pickFirstString(row, ["bonus", "bonus_credits", "extra"]);
  const parts = [amt ? `${amt}원` : null, bonus ? `보너스 ${bonus}` : null].filter(Boolean) as string[];
  return parts.length ? parts.join(" · ") : null;
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

export function CashTopUpEntry(props: {
  balanceLine: string;
  balanceLoading: boolean;
  balanceError: string | null;
  packageRows: Record<string, unknown>[];
  packageError: string | null;
  notices: ReactNode;
  primaryCta: { href: string; label: string };
  secondaryCta?: { href: string; label: string };
}) {
  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-extrabold text-slate-900">현재 잔액</h2>
        {props.balanceLoading ? <Banner kind="loading" message="잔액 조회 중…" /> : null}
        {!props.balanceLoading && props.balanceError ? (
          <div className="mt-2">
            <Banner kind="error" message={USER_UI_CASH_BALANCE_LOAD_FAILED} />
          </div>
        ) : null}
        {!props.balanceLoading && !props.balanceError && !props.balanceLine ? (
          <Banner kind="empty" message="로그인 후 학생 지갑에서 잔액이 표시됩니다(캐시 전용)." />
        ) : null}
        {!props.balanceLoading && !props.balanceError && props.balanceLine ? (
          <p className="mt-2 text-2xl font-black text-slate-900">{props.balanceLine}</p>
        ) : null}
        <p className="mt-2 text-xs font-semibold text-slate-500">맞춤의뢰·주문과 섞지 않는 충전/잔액 흐름 전용.</p>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-extrabold text-slate-900">충전 패키지</h2>
        {props.packageError ? (
          <div className="mt-2">
            <Banner kind="error" message={USER_UI_CASH_PACKAGES_LOAD_FAILED} />
          </div>
        ) : null}
        {props.packageRows.length === 0 && !props.packageError ? (
          <div className="mt-2 space-y-2">
            <Banner kind="empty" message={USER_UI_CASH_PACKAGES_EMPTY_PRIMARY} />
            <p className="text-sm text-slate-600">{USER_UI_CASH_PACKAGES_EMPTY_SECONDARY}</p>
          </div>
        ) : null}
        <ul className="mt-3 space-y-2">
          {props.packageRows.map((row, i) => {
            const extra = packageCardExtra(row);
            return (
              <li key={typeof row.id === "string" ? row.id : `pkg-${i}`} className="rounded-xl border border-slate-200 p-3 text-sm text-slate-800">
                <p className="font-extrabold text-slate-900">{packageCardTitle(row)}</p>
                {extra ? <p className="mt-1 text-xs text-slate-600">{extra}</p> : null}
              </li>
            );
          })}
        </ul>
      </section>

      <section className="rounded-2xl border border-amber-200 bg-amber-50/50 p-6">
        <h2 className="text-lg font-extrabold text-amber-950">구매 전 유의사항</h2>
        <div className="mt-2 space-y-2 text-sm text-amber-950/90">{props.notices}</div>
      </section>

      <section className="flex flex-wrap gap-2">
        <Link href={props.primaryCta.href} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white">
          {props.primaryCta.label}
        </Link>
        {props.secondaryCta ? (
          <Link href={props.secondaryCta.href} className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-800">
            {props.secondaryCta.label}
          </Link>
        ) : null}
      </section>
    </div>
  );
}
