"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { WEEKLY_QUESTION_LIMIT_MESSAGE } from "@/lib/qna/questionThreadStatus";

export function QuestionThreadConfirmButton(props: {
  roomId: string;
  threadId: string;
  onConfirmed?: () => void;
  /** 카드 인라인용 컴팩트 버튼 */
  compact?: boolean;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConfirm() {
    setPending(true);
    setError(null);
    try {
      const res = await fetch(`/api/question-room/threads/${encodeURIComponent(props.threadId)}/confirm`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomId: props.roomId }),
      });
      const json = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !json.ok) {
        setError(json.error ?? "확인 처리에 실패했습니다.");
        return;
      }
      props.onConfirmed?.();
      router.refresh();
    } catch {
      setError("확인 처리에 실패했습니다.");
    } finally {
      setPending(false);
    }
  }

  function handleAdditionalQuestion() {
    const textarea = document.querySelector<HTMLTextAreaElement>('textarea[name="messageBody"]');
    textarea?.focus();
    textarea?.scrollIntoView({ block: "center", behavior: "smooth" });
  }

  if (props.compact) {
    return (
      <div className="mt-2" onClick={(e) => e.stopPropagation()}>
        {error ? <p className="mb-1 text-[10px] font-bold text-amber-800">{error}</p> : null}
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            disabled={pending}
            onClick={() => void handleConfirm()}
            className="rounded-lg bg-[#2563EB] px-3 py-1.5 text-[11px] font-black text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {pending ? "처리 중…" : "답변 확인 완료"}
          </button>
          <button
            type="button"
            onClick={handleAdditionalQuestion}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-black text-slate-700 hover:bg-slate-50"
          >
            추가 질문하기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-blue-200 bg-blue-50/80 p-4">
      <p className="text-[12px] font-bold text-blue-950">멘토 답변이 도착했습니다.</p>
      <p className="mt-1 text-[11px] font-medium text-blue-800/90">
        내용을 확인한 뒤 확인하기를 누르면 이번 주 질문 한도에 반영됩니다.
      </p>
      {error ? (
        <p className="mt-2 text-[11px] font-bold text-amber-800">{error}</p>
      ) : null}
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <button
          type="button"
          disabled={pending}
          onClick={() => void handleConfirm()}
          className="rounded-xl bg-blue-600 px-4 py-2.5 text-[12px] font-black text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-50"
        >
          {pending ? "처리 중…" : "답변 확인 완료"}
        </button>
        <button
          type="button"
          onClick={handleAdditionalQuestion}
          className="rounded-xl border border-blue-200 bg-white px-4 py-2.5 text-[12px] font-black text-blue-900 transition hover:bg-blue-50"
        >
          추가 질문하기
        </button>
      </div>
      <p className="mt-2 text-[10px] text-blue-700/80">{WEEKLY_QUESTION_LIMIT_MESSAGE}는 확인 완료된 질문 수 기준입니다.</p>
    </div>
  );
}
