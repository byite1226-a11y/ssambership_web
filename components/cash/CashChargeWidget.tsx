"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { loadTossPayments } from "@tosspayments/tosspayments-sdk";
import { CASH_CHARGE_PACKAGES } from "@/lib/cash/chargePackages";

type PaymentMethod = "card" | "easy" | "bank";

type Props = {
  userId: string;
  currentBalance: number;
  isAuthenticated?: boolean;
};

export function CashChargeWidget({ userId, currentBalance }: Props) {
  const [selectedPayKrw, setSelectedPayKrw] = useState<number>(CASH_CHARGE_PACKAGES[0].payKrw);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("card");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selected = CASH_CHARGE_PACKAGES.find((p) => p.payKrw === selectedPayKrw) ?? CASH_CHARGE_PACKAGES[0];
  const projectedBalance = currentBalance + selected.cashKrw;

  async function handleCharge() {
    if (paymentMethod !== "card") {
      setError("해당 결제 수단은 준비 중입니다. 신용/체크카드를 선택해 주세요.");
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

  const payMethods: { id: PaymentMethod; label: string; ready: boolean }[] = [
    { id: "card", label: "신용/체크카드", ready: true },
    { id: "easy", label: "간편결제", ready: false },
    { id: "bank", label: "무통장입금", ready: false },
  ];

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <h3 className="text-sm font-extrabold text-slate-900">
          <span className="text-[#1A56DB]">①</span> 충전 금액 선택
        </h3>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
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
                  className={`relative flex w-full min-h-[100px] flex-col items-start rounded-xl border-2 p-4 text-left transition ${
                    active
                      ? "border-[#1A56DB] bg-blue-50/60 ring-2 ring-[#1A56DB]/20"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  {active ? (
                    <span className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-[#1A56DB] text-white">
                      <Check className="h-4 w-4" strokeWidth={3} aria-hidden />
                    </span>
                  ) : null}
                  <span className="text-base font-black text-slate-900">
                    {pkg.payKrw.toLocaleString("ko-KR")}원
                  </span>
                  <span className="mt-1 text-sm font-bold text-slate-700">
                    → {pkg.cashKrw.toLocaleString("ko-KR")}캐시
                  </span>
                  {pkg.bonusKrw > 0 ? (
                    <span className="mt-1 text-xs font-extrabold text-emerald-700">
                      보너스 +{pkg.bonusKrw.toLocaleString("ko-KR")}캐시
                      {pkg.bonusPercentLabel ? ` (${pkg.bonusPercentLabel})` : ""}
                    </span>
                  ) : null}
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <h3 className="text-sm font-extrabold text-slate-900">
          <span className="text-[#1A56DB]">②</span> 결제 수단 선택
        </h3>
        <div className="mt-4 flex flex-wrap gap-2">
          {payMethods.map((m) => {
            const active = paymentMethod === m.id;
            return (
              <button
                key={m.id}
                type="button"
                disabled={loading || !m.ready}
                onClick={() => m.ready && setPaymentMethod(m.id)}
                className={[
                  "rounded-xl border-2 px-4 py-3 text-sm font-bold transition",
                  active && m.ready
                    ? "border-[#1A56DB] bg-[#1A56DB] text-white"
                    : "border-slate-200 bg-white text-slate-700",
                  !m.ready ? "cursor-not-allowed opacity-50" : "hover:border-slate-300",
                ].join(" ")}
              >
                {m.label}
                {!m.ready ? <span className="ml-1 text-[10px] font-medium">(준비 중)</span> : null}
              </button>
            );
          })}
        </div>
      </section>

      <section className="rounded-2xl border border-blue-100 bg-blue-50/40 p-5 sm:p-6">
        <h3 className="text-sm font-extrabold text-slate-900">
          <span className="text-[#1A56DB]">③</span> 충전 후 예상 잔액
        </h3>
        <p className="mt-3 text-sm text-slate-600">
          {selected.payKrw.toLocaleString("ko-KR")}원 결제
          {selected.bonusKrw > 0 ? (
            <>
              {" "}
              + 보너스 <span className="font-bold">{selected.bonusKrw.toLocaleString("ko-KR")}캐시</span>
            </>
          ) : null}{" "}
          = 지급 <span className="font-bold">{selected.cashKrw.toLocaleString("ko-KR")}캐시</span>
        </p>
        <p className="mt-2 text-3xl font-black tabular-nums text-[#1A56DB]">
          {projectedBalance.toLocaleString("ko-KR")}캐시
        </p>
      </section>

      {error ? <p className="text-sm font-medium text-red-700">{error}</p> : null}

      <button
        type="button"
        disabled={loading}
        onClick={() => void handleCharge()}
        className="min-h-[52px] w-full rounded-xl bg-[#1A56DB] px-5 py-3.5 text-base font-extrabold text-white shadow-md hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? "결제창 여는 중…" : "캐시 충전하기"}
      </button>
    </div>
  );
}
