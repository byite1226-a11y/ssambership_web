"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import { FormSubmitButton } from "@/components/qna/FormSubmitButton";
import { saveConnectionNoteAction } from "@/lib/qna/questionRoomActions";

export function QuestionRoomNewNoteModal(props: {
  open: boolean;
  onClose: () => void;
  roomId: string;
  threadId?: string | null;
  defaultBody?: string;
  actor?: "student" | "mentor";
}) {
  useEffect(() => {
    if (!props.open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") props.onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [props.open, props.onClose]);

  if (!props.open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/40"
        aria-label="닫기"
        onClick={props.onClose}
      />
      <div
        role="dialog"
        aria-modal
        aria-labelledby="new-note-title"
        className="relative z-10 w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl"
      >
        <div className="mb-4 flex items-center justify-between gap-2">
          <h2 id="new-note-title" className="text-[16px] font-black text-slate-900">
            새 노트 작성
          </h2>
          <button
            type="button"
            onClick={props.onClose}
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <form action={saveConnectionNoteAction} className="space-y-3">
          <textarea
            name="noteBody"
            required
            defaultValue={props.defaultBody ?? ""}
            placeholder="멘토에게 전달할 배경·목표를 짧게 남겨 주세요."
            className="h-32 w-full rounded-xl border border-slate-200 px-4 py-3 text-[13px] font-medium outline-none focus:border-[#1A56DB] focus:ring-2 focus:ring-[#1A56DB]/20"
          />
          <input type="hidden" name="roomId" value={props.roomId} />
          <input type="hidden" name="actor" value={props.actor ?? "student"} />
          <input type="hidden" name="contextThreadId" value={props.threadId ?? ""} />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={props.onClose}
              className="h-10 flex-1 rounded-xl border border-slate-200 text-[12px] font-bold text-slate-600"
            >
              취소
            </button>
            <FormSubmitButton
              idleLabel="저장"
              pendingLabel="저장 중…"
              className="h-10 flex-1 rounded-xl bg-[#1A56DB] text-[12px] font-black text-white"
            />
          </div>
        </form>
      </div>
    </div>
  );
}
