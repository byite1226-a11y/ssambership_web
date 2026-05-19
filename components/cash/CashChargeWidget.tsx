"use client";

import { useState } from "react";
import { loadTossPayments } from "@tosspayments/tosspayments-sdk";
import { CASH_CHARGE_PACKAGES } from "@/lib/cash/chargePackages";

type Props = {
  userId: string;
  currentBalance: number;
};

export function CashChargeWidget({ userId, currentBalance }: Props) {
  const [selectedPayKrw, setSelectedPayKrw] = useState<number>(CASH_CHARGE_PACKAGES[0].payKrw);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selected = CASH_CHARGE_PACKAGES.find((p) => p.payKrw === selectedPayKrw) ?? CASH_CHARGE_PACKAGES[0];
  const projectedBalance = currentBalance + selected.cashKrw;

  async function handleCharge() {
    const clientKey = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY;
    if (!clientKey) {
      setError("결제 설정이 준비되지 않았습니다. 잠시 후 다시 시도해 주세요.");
      return;
    }

    setError(null);
    setLoading(true);
    try {
      const tossPayments = await loadTossPayments(clientKey);
      const payment = tossPayments.payment({ customerKey: userId });
      await payment.requestPayment({
        method: "CARD",
        amount: { currency: "KRW", value: selected.payKrw },
        orderId: `cash-${userId}-${Date.now()}`,
        orderName: `쌤버십 캐시 ${selected.cashKrw.toLocaleString("ko-KR")}캐시 충전`,
        successUrl: `${window.location.origin}/wallet/charge/success`,
        failUrl: `${window.location.origin}/wallet/charge/fail`,
        card: {
          useEscrow: false,
          flowMode: "DEFAULT",
          useCardPoint: false,
          useAppCardOnly: false,
        },
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (!/cancel|취소|USER_CANCEL/i.test(msg)) {
        setError("결제창을 열지 못했습니다. 잠시 후 다시 시도해 주세요.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-sm font-bold text-slate-800">충전 패키지 선택</p>
      <ul className="grid gap-3 sm:grid-cols-2">
        {CASH_CHARGE_PACKAGES.map((pkg) => {
          const active = selectedPayKrw === pkg.payKrw;
          return (
            <li key={pkg.payKrw}>
              <button
                type="button"
                disabled={loading}
                onClick={() => {
                  setSelectedPayKrw(pkg.payKrw);
                  setError(null);
                }}
                className={`flex w-full min-h-[88px] flex-col items-start rounded-xl border p-4 text-left transition-colors ${
                  active
                    ? "border-blue-600 bg-blue-50 ring-1 ring-blue-600"
                    : "border-slate-200 bg-white hover:border-slate-300"
                }`}
              >
                <span className="text-base font-black text-slate-900">
                  {pkg.payKrw.toLocaleString("ko-KR")}원
                </span>
                <span className="mt-1 text-sm font-bold text-blue-700">
                  → {pkg.cashKrw.toLocaleString("ko-KR")}캐시 지급
                </span>
                {pkg.bonusKrw > 0 ? (
                  <span className="mt-1 text-xs font-semibold text-emerald-700">
                    보너스 +{pkg.bonusKrw.toLocaleString("ko-KR")}캐시
                    {pkg.bonusPercentLabel ? ` (${pkg.bonusPercentLabel})` : ""}
                  </span>
                ) : (
                  <span className="mt-1 text-xs text-slate-500">보너스 없음</span>
                )}
              </button>
            </li>
          );
        })}
      </ul>

      <p className="text-sm text-slate-600">
        <span className="font-bold text-slate-900">{selected.payKrw.toLocaleString("ko-KR")}원</span> 결제 시{" "}
        <span className="font-bold text-slate-900">{selected.cashKrw.toLocaleString("ko-KR")}캐시</span> 지급 → 잔액{" "}
        <span className="font-bold text-slate-900">{projectedBalance.toLocaleString("ko-KR")}캐시</span> 예정
      </p>

      {error ? <p className="text-xs font-medium text-red-700">{error}</p> : null}

      <button
        type="button"
        disabled={loading}
        onClick={() => void handleCharge()}
        className="min-h-[48px] w-full max-w-sm rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? "결제창 열기 중..." : "충전하기"}
      </button>
    </div>
  );
}
