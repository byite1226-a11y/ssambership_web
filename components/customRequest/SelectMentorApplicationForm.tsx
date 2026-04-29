"use client";

import { FormSubmitButton } from "@/components/qna/FormSubmitButton";
import { selectMentorApplicationForOrder } from "@/lib/customRequest/customRequestOrderActions";

export function SelectMentorApplicationForm(props: { postId: string; applicationId: string; disabled?: boolean }) {
  if (props.disabled || !props.applicationId) {
    return (
      <button
        type="button"
        disabled
        className="min-h-[44px] cursor-not-allowed rounded-xl bg-slate-200 px-4 py-2.5 text-sm font-bold text-slate-500"
      >
        선택 불가
      </button>
    );
  }
  return (
    <form action={selectMentorApplicationForOrder} className="w-full min-[400px]:w-auto">
      <input type="hidden" name="postId" value={props.postId} />
      <input type="hidden" name="applicationId" value={props.applicationId} />
      <FormSubmitButton
        idleLabel="이 제안으로 주문 열기"
        pendingLabel="처리 중…"
        className="min-h-[48px] w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-extrabold text-white enabled:hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-slate-300 min-[400px]:min-h-[44px] min-[400px]:w-auto"
      />
    </form>
  );
}
