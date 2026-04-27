"use client";

import { FormSubmitButton } from "@/components/qna/FormSubmitButton";
import { selectMentorApplicationForOrder } from "@/lib/customRequest/customRequestOrderActions";

export function SelectMentorApplicationForm(props: { postId: string; applicationId: string; disabled?: boolean }) {
  if (props.disabled || !props.applicationId) {
    return (
      <button type="button" disabled className="cursor-not-allowed rounded-lg bg-slate-200 px-3 py-1.5 text-sm font-bold text-slate-500">
        선택 불가
      </button>
    );
  }
  return (
    <form action={selectMentorApplicationForOrder} className="inline">
      <input type="hidden" name="postId" value={props.postId} />
      <input type="hidden" name="applicationId" value={props.applicationId} />
      <FormSubmitButton
        idleLabel="이 제안으로 주문 열기"
        pendingLabel="처리 중…"
        className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-extrabold text-white enabled:hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-slate-300"
      />
    </form>
  );
}
