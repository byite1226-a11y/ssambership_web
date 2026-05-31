"use client";

import { useRef, useState, useTransition } from "react";
import { Paperclip } from "lucide-react";
import { sendQuestionAttachmentAction } from "@/lib/qna/questionRoomActions";

/**
 * 채팅 입력바 첨부 버튼. 메시지 폼 내부에 위치하므로 자체 <form> 을 두지 않고
 * 서버 액션을 직접 호출(transition)해 파일을 업로드·전송한다.
 */
export function QuestionRoomAttachmentButton(props: {
  roomId: string;
  threadId: string | null;
  actor: "student" | "mentor";
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const disabled = !props.threadId || pending;

  function onPick(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !props.threadId) return;
    if (file.size > 20 * 1024 * 1024) {
      setError("파일은 20MB 이하만 첨부할 수 있어요.");
      return;
    }
    setError(null);
    const fd = new FormData();
    fd.append("attachment", file);
    fd.append("roomId", props.roomId);
    fd.append("threadId", props.threadId);
    fd.append("actor", props.actor);
    fd.append("contextThreadId", props.threadId);
    startTransition(() => {
      void sendQuestionAttachmentAction(fd);
    });
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/*,application/pdf,.doc,.docx,.ppt,.pptx,.zip"
        className="hidden"
        onChange={onPick}
      />
      <button
        type="button"
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
        title={props.threadId ? "파일·사진 첨부" : "질문을 먼저 선택해 주세요"}
        aria-label="파일·사진 첨부"
        className="shrink-0 rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <Paperclip className={`h-5 w-5 ${pending ? "animate-pulse text-blue-500" : ""}`} />
      </button>
      {error ? (
        <span className="absolute -top-6 left-2 rounded bg-red-50 px-2 py-0.5 text-[10px] font-bold text-red-700">
          {error}
        </span>
      ) : null}
    </>
  );
}
