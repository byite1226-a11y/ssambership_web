"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function QuestionThreadWrongAnswerToggle(props: {
  roomId: string;
  threadId: string;
  initialChecked?: boolean;
}) {
  const router = useRouter();
  const [checked, setChecked] = useState(Boolean(props.initialChecked));
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save(next: boolean) {
    const previous = checked;
    setChecked(next);
    setPending(true);
    setError(null);
    try {
      const res = await fetch(`/api/question-room/threads/${encodeURIComponent(props.threadId)}/wrong-answer`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomId: props.roomId, isWrongAnswer: next }),
      });
      const json = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !json.ok) {
        setChecked(previous);
        setError(json.error ?? "오답 표시를 저장하지 못했습니다.");
        return;
      }
      router.refresh();
    } catch {
      setChecked(previous);
      setError("오답 표시를 저장하지 못했습니다.");
    } finally {
      setPending(false);
    }
  }

  return (
    <label
      className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-bold text-slate-700"
      title="나중에 약점 분석과 복습 리포트에 반영됩니다."
    >
      <input
        type="checkbox"
        checked={checked}
        disabled={pending}
        onChange={(e) => void save(e.target.checked)}
        className="h-3.5 w-3.5 shrink-0 rounded border-slate-300 text-[#2563EB] focus:ring-[#2563EB]"
      />
      이 문제는 내가 틀렸던 문제예요
      {error ? <span className="ml-1 text-[10px] font-bold text-amber-800">· {error}</span> : null}
    </label>
  );
}
