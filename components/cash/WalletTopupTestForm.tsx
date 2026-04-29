"use client";

import { useState } from "react";
import { testWalletCashTopupAction } from "@/lib/cash/walletTopupActions";
import { FormSubmitButton } from "@/components/qna/FormSubmitButton";

/**
 * `idempotencyKey` 는 마운트 1회 생성 — 중복 submit 시 동일 키로 RPC가 재증가하지 않는다.
 * `WalletChargeBody` 는 `CASH_TOPUP_ALLOW_TEST_CHARGE === "true"` 일 때만 이 컴포넌트를 마운트한다(서버 env).
 */
export function WalletTopupTestForm() {
  const [idempotencyKey] = useState(() => (typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `idem_${Date.now()}`));
  return (
    <form action={testWalletCashTopupAction} className="mt-3 space-y-3 rounded-xl border border-emerald-200 bg-white p-4">
      <input type="hidden" name="idempotencyKey" value={idempotencyKey} />
      <p className="text-sm font-extrabold text-slate-900">테스트 충전(내부·스테이징)</p>
      <p className="text-xs text-slate-600">
        실제 PG 없이 <span className="font-semibold">캐시 잔액·원장</span>에만 반영됩니다. 아래는 원(정수)로 입력하세요.
      </p>
      <div>
        <label htmlFor="amountKrw" className="text-sm font-bold text-slate-800">
          충전 금액 (원)
        </label>
        <input
          id="amountKrw"
          name="amountKrw"
          type="number"
          min={1}
          max={10_000_000}
          step={1}
          inputMode="numeric"
          required
          placeholder="예: 10000"
          className="mt-1 w-full max-w-xs rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900"
        />
      </div>
      <FormSubmitButton
        idleLabel="테스트 충전 완료 처리"
        pendingLabel="처리 중…"
        className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700"
      />
    </form>
  );
}
