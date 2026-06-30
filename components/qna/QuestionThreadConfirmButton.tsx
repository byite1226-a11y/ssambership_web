"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

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

  if (props.compact) {
    return (
      <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
        {error ? <p className="mb-1 text-[10px] font-bold text-amber-800">{error}</p> : null}
        <button
          type="button"
          disabled={pending}
          onClick={() => void handleConfirm()}
          className="rounded-lg bg-[#2563EB] px-3 py-1.5 text-[11px] font-black text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {pending ? "처리 중…" : "답변 확인 완료"}
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
      <p className="text-[12px] font-bold text-slate-800">멘토 답변이 도착했어요.</p>
      <p className="mt-1 text-[11px] font-medium text-slate-500">
        내용을 확인한 뒤 “답변 확인 완료”를 누르면 완료로 표시돼요.
      </p>
      {error ? <p className="mt-2 text-[11px] font-bold text-amber-800">{error}</p> : null}
      <button
        type="button"
        disabled={pending}
        onClick={() => void handleConfirm()}
        className="mt-3 w-full rounded-xl bg-[#2563EB] px-4 py-2.5 text-[12px] font-black text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-50 sm:w-auto"
      >
        {pending ? "처리 중…" : "답변 확인 완료"}
      </button>
    </div>
  );
}
