"use client";

import { useMemo, useState } from "react";
import { loadTossPayments } from "@tosspayments/tosspayments-sdk";

const PRESET_AMOUNTS = [10_000, 30_000, 50_000, 100_000, 200_000] as const;
const MIN_CUSTOM_AMOUNT = 1_000;

type Props = {
  userId: string;
  currentBalance: number;
};

export function CashChargeWidget({ userId, currentBalance }: Props) {
  const [preset, setPreset] = useState<number | "custom">(10_000);
  const [customInput, setCustomInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedAmount = useMemo(() => {
    if (preset === "custom") {
      const n = Number(customInput.replace(/[^\d]/g, ""));
      return Number.isFinite(n) && n >= MIN_CUSTOM_AMOUNT ? Math.floor(n) : 0;
    }
    return preset;
  }, [preset, customInput]);

  const projectedBalance = currentBalance + (selectedAmount > 0 ? selectedAmount : 0);

  async function handleCharge() {
    if (selectedAmount < MIN_CUSTOM_AMOUNT) {
      setError(`충전 금액은 ${MIN_CUSTOM_AMOUNT.toLocaleString("ko-KR")}원 이상이어야 합니다.`);
      return;
    }

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
        amount: { currency: "KRW", value: selectedAmount },
        orderId: `cash-${userId}-${Date.now()}`,
        orderName: `쌤버십 캐시 ${selectedAmount.toLocaleString("ko-KR")}원 충전`,
        successUrl: `${window.location.origin}/wallet/charge/success`,
        failUrl: `${window.location.origin}/wallet/charge/fail`,
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
      <p className="text-sm font-bold text-slate-800">충전 금액 선택</p>
      <div className="flex flex-wrap gap-2">
        {PRESET_AMOUNTS.map((amt) => {
          const active = preset === amt;
          return (
            <button
              key={amt}
              type="button"
              disabled={loading}
              onClick={() => {
                setPreset(amt);
                setError(null);
              }}
              className={`min-h-[44px] rounded-xl border px-4 py-2 text-sm font-bold transition-colors ${
                active
                  ? "border-blue-600 bg-blue-50 text-blue-800 ring-1 ring-blue-600"
                  : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
              }`}
            >
              {amt.toLocaleString("ko-KR")}원
            </button>
          );
        })}
        <button
          type="button"
          disabled={loading}
          onClick={() => {
            setPreset("custom");
            setError(null);
          }}
          className={`min-h-[44px] rounded-xl border px-4 py-2 text-sm font-bold transition-colors ${
            preset === "custom"
              ? "border-blue-600 bg-blue-50 text-blue-800 ring-1 ring-blue-600"
              : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
          }`}
        >
          직접 입력
        </button>
      </div>

      {preset === "custom" ? (
        <div>
          <label htmlFor="cash-charge-custom" className="text-xs font-bold text-slate-600">
            충전 금액 (원)
          </label>
          <input
            id="cash-charge-custom"
            type="number"
            min={MIN_CUSTOM_AMOUNT}
            step={1000}
            inputMode="numeric"
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
            placeholder={`최소 ${MIN_CUSTOM_AMOUNT.toLocaleString("ko-KR")}원`}
            className="mt-1 w-full max-w-xs rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900"
            disabled={loading}
          />
        </div>
      ) : null}

      <p className="text-sm text-slate-600">
        {selectedAmount > 0 ? (
          <>
            <span className="font-bold text-slate-900">{selectedAmount.toLocaleString("ko-KR")}원</span> 충전 시
            → 잔액{" "}
            <span className="font-bold text-slate-900">{projectedBalance.toLocaleString("ko-KR")}원</span> 예정
          </>
        ) : (
          <>충전 금액을 선택하거나 입력해 주세요.</>
        )}
      </p>

      {error ? <p className="text-xs font-medium text-red-700">{error}</p> : null}

      <button
        type="button"
        disabled={loading || selectedAmount < MIN_CUSTOM_AMOUNT}
        onClick={() => void handleCharge()}
        className="min-h-[48px] w-full max-w-sm rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? "결제창 열기 중..." : "충전하기"}
      </button>
    </div>
  );
}
