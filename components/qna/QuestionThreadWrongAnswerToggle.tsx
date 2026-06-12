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
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2">
      <label className="flex cursor-pointer items-start gap-2 text-[12px] font-bold text-slate-700">
        <input
          type="checkbox"
          checked={checked}
          disabled={pending}
          onChange={(e) => void save(e.target.checked)}
          className="mt-0.5 h-4 w-4 rounded border-slate-300 text-[#1A56DB] focus:ring-[#1A56DB]"
        />
        <span>
          이 문제는 내가 틀렸던 문제예요
          <span className="mt-0.5 block text-[10px] font-medium text-slate-500">
            나중에 약점 분석과 복습 리포트에 반영됩니다.
          </span>
        </span>
      </label>
      {error ? <p className="mt-1 text-[11px] font-bold text-amber-800">{error}</p> : null}
    </div>
  );
}
