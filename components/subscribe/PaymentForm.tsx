"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import type { SubscribePlanTier } from "@/lib/subscribe/subscribePageQueries";

type ApiErr = { ok: false; error?: string; code?: string };
type IntentOk = {
  ok: true;
  paymentId: string;
  intentKey: string;
  message?: string;
  /** 서버 SUBSCRIBE_CHECKOUT_ALLOW_PENDING=true 일 때만 intent 직후 complete 허용 */
  allowImmediateComplete?: boolean;
};
type CompleteOk = {
  ok: true;
  paymentId: string;
  subscriptionId: string | null;
  roomId: string | null;
  message: string;
};

type Phase = "idle" | "intent" | "complete" | "error";

/**
 * 구독 전용: /api/subscribe/intent → (PG 자리) → /api/subscribe/complete. 캐시·wallet 흐름과 분리.
 */
export function PaymentForm(props: {
  mentorId: string;
  selectedTier: SubscribePlanTier;
  /** DB에 해당 티어 플랜 행이 있을 때만 intent 허용 */
  hasPlanForTier: boolean;
  disabledReason?: string;
}) {
  const router = useRouter();
  const { mentorId, selectedTier, hasPlanForTier, disabledReason } = props;
  const [phase, setPhase] = useState<Phase>("idle");
  const [err, setErr] = useState<string | null>(null);
  const [code, setCode] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [lastIntent, setLastIntent] = useState<{ paymentId: string; intentKey: string } | null>(null);

  const blocked = Boolean(disabledReason) || !hasPlanForTier;
  const busy = phase === "intent" || phase === "complete";

  const runComplete = useCallback(
    async (paymentId: string) => {
      setPhase("complete");
      setErr(null);
      setCode(null);
      setInfo(null);
      const res = await fetch("/api/subscribe/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentId, mentorId, planTier: selectedTier }),
        credentials: "same-origin",
      });
      const j = (await res.json().catch(() => ({}))) as CompleteOk & ApiErr;
      if (!res.ok || !j || (j as ApiErr).ok === false) {
        const e = j as ApiErr;
        setErr(e.error ?? "완료 처리에 실패했습니다.");
        setCode(e.code ?? String(res.status));
        setPhase("error");
        return;
      }
      const ok = j as CompleteOk;
      if (ok.roomId) {
        router.push(`/question-room/${encodeURIComponent(ok.roomId)}`);
        return;
      }
      router.push(
        `/subscribe?mentorId=${encodeURIComponent(mentorId)}&plan=${encodeURIComponent(selectedTier)}&success=1`
      );
    },
    [mentorId, router, selectedTier]
  );

  const onSubscribe = useCallback(async () => {
    if (blocked) return;
    setPhase("intent");
    setErr(null);
    setCode(null);
    setInfo(null);
    setLastIntent(null);
    const res = await fetch("/api/subscribe/intent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mentorId, planTier: selectedTier }),
      credentials: "same-origin",
    });
    const j = (await res.json().catch(() => ({}))) as IntentOk & ApiErr;
    if (!res.ok || !j || (j as ApiErr).ok === false) {
      const e = j as ApiErr;
      setErr(e.error ?? "결제 준비에 실패했습니다.");
      setCode(e.code ?? String(res.status));
      setPhase("idle");
      return;
    }
    const i = j as IntentOk;
    setLastIntent({ paymentId: i.paymentId, intentKey: i.intentKey });
    if (i.allowImmediateComplete) {
      await runComplete(i.paymentId);
    } else {
      setPhase("idle");
      setInfo(
        "결제 intent만 생성되었습니다. PG에서 결제가 성공(succeeded/paid 등)으로 반영된 뒤 complete가 호출되면 구독이 활성화됩니다. 로컬에서 intent 직후 완료를 시험하려면 서버에 SUBSCRIBE_CHECKOUT_ALLOW_PENDING=true 를 설정하세요."
      );
    }
  }, [blocked, mentorId, runComplete, selectedTier]);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5">
      <h3 className="text-sm font-extrabold text-slate-900">구독 결제</h3>
      <p className="mt-1 text-xs text-slate-500">
        선택: {selectedTier} · mentee/mentor는 subscribe 전용 API만 사용 (캐시·wallet과 무관)
      </p>
      {blocked
        ? (
            <p className="mt-2 text-sm font-bold text-amber-900">
              {disabledReason ?? "선택 티어에 맞는 플랜 행이 없어 결제를 시작할 수 없습니다. 멘토 플랜 등록·프로브를 확인하세요."}
            </p>
          )
        : null}

      <form className="mt-4 space-y-3" noValidate onSubmit={(e) => e.preventDefault()}>
        <label className="block text-xs font-extrabold text-slate-700">
          PG·카드 (예정)
          <input
            readOnly
            className="mt-1 w-full cursor-not-allowed rounded-lg border border-slate-200 bg-slate-50 px-2 py-2 text-sm text-slate-500"
            value={lastIntent ? `intent: ${lastIntent.intentKey}` : "연동 시 토큰/위젯 자리"}
            aria-label="PG 자리(예정)"
          />
        </label>
        {info && !err
          ? (
              <p className="text-sm font-bold text-slate-700" role="status">
                {info}
              </p>
            )
          : null}
        {err
          ? (
              <p className="text-sm font-bold text-red-800" role="alert">
                {err}
                {code ? ` (${code})` : null}
              </p>
            )
          : null}
        <button
          type="button"
          onClick={onSubscribe}
          disabled={blocked || busy}
          className={
            blocked || busy
              ? "w-full cursor-not-allowed rounded-lg bg-slate-300 py-2.5 text-sm font-extrabold text-white"
              : "w-full rounded-lg bg-slate-900 py-2.5 text-sm font-extrabold text-white hover:bg-slate-800"
          }
        >
          {phase === "intent"
            ? "결제 준비 중…"
            : phase === "complete"
              ? "구독 완료 처리 중…"
              : "구독 결제 진행 (intent → complete)"}
        </button>
        {phase === "error" && lastIntent
          ? (
              <button
                type="button"
                className="w-full rounded-lg border border-slate-300 py-2 text-sm font-extrabold text-slate-800 hover:bg-slate-50"
                onClick={() => void runComplete(lastIntent.paymentId)}
              >
                완료(complete)만 다시 시도
              </button>
            )
          : null}
      </form>

      <div className="mt-4 text-xs text-slate-500">
        <p>
          흐름: intent → PG 확정(결제 행이 succeeded/paid 등) → complete → subscriptions + mentor_student_rooms. 비확정
          pending 상태에서의 complete는 서버에서 차단됩니다.
        </p>
      </div>
    </section>
  );
}
