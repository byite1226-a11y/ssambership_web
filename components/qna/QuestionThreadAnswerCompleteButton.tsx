"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { CheckCircle2 } from "lucide-react";

export function QuestionThreadAnswerCompleteButton(props: {
  roomId: string;
  threadId: string;
  disabled?: boolean;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    if (pending || props.disabled) return;
    setPending(true);
    setError(null);
    try {
      const res = await fetch(`/api/question-room/threads/${encodeURIComponent(props.threadId)}/answer`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomId: props.roomId }),
      });
      const json = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !json.ok) {
        setError(json.error ?? "답변 완료 처리에 실패했습니다.");
        return;
      }
      router.refresh();
    } catch {
      setError("답변 완료 처리에 실패했습니다.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-1">
      <button
        type="button"
        disabled={pending || props.disabled}
        onClick={() => void handleClick()}
        className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#1A56DB] px-3.5 py-2 text-[12px] font-black text-white shadow-sm transition hover:bg-[#1648c0] disabled:opacity-40"
      >
        <CheckCircle2 className="h-4 w-4" />
        {pending ? "처리 중..." : "답변 완료"}
      </button>
      {error ? <p className="text-[11px] font-bold text-amber-800">{error}</p> : null}
    </div>
  );
}
