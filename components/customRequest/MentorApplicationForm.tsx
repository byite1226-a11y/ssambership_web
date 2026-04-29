"use client";

import { FormSubmitButton } from "@/components/qna/FormSubmitButton";
import { submitMentorCustomRequestApplication } from "@/lib/customRequest/customRequestApplicationActions";

export function MentorApplicationForm(props: { postId: string; returnContext: "mentor" | "public" }) {
  return (
    <form
      action={submitMentorCustomRequestApplication}
      className="space-y-4 overflow-hidden rounded-2xl border border-emerald-200/90 bg-gradient-to-b from-emerald-50/60 to-white p-4 shadow-sm sm:p-5"
    >
      <div>
        <h2 className="text-lg font-extrabold text-slate-900">지원서</h2>
        <p className="mt-1 text-sm leading-relaxed text-slate-600">
          제안가·납기·제안 내용은 의뢰자(학생)의 비교 화면에 표시돼요. 질문·조정은 맞춤의뢰 흐름에 따릅니다.
        </p>
      </div>
      <input type="hidden" name="postId" value={props.postId} />
      <input type="hidden" name="returnContext" value={props.returnContext} />

      <div className="rounded-xl border border-slate-200/80 bg-white p-3.5 sm:p-4">
        <label className="block text-sm font-extrabold text-slate-800">
          제안 금액(원)
          <input
            name="proposedPrice"
            type="number"
            min={0}
            required
            className="mt-2 min-h-[44px] w-full rounded-lg border border-slate-300 px-3 py-2.5 text-base text-slate-900 sm:text-sm"
          />
        </label>
      </div>
      <div className="rounded-xl border border-slate-200/80 bg-white p-3.5 sm:p-4">
        <label className="block text-sm font-extrabold text-slate-800">
          예상 납기(완료 예정일)
          <input
            name="deliveryAt"
            type="date"
            required
            className="mt-2 min-h-[44px] w-full rounded-lg border border-slate-300 px-3 py-2.5 text-base text-slate-900 sm:text-sm"
          />
        </label>
      </div>
      <div className="rounded-xl border border-slate-200/80 bg-white p-3.5 sm:p-4">
        <label className="block text-sm font-extrabold text-slate-800">
          제안 내용
          <textarea
            name="coverNote"
            required
            rows={7}
            placeholder="범위, 진행 방식, 질의응답, 전달 방식을 구체적으로 적어 주세요."
            className="mt-2 w-full min-h-[8rem] rounded-lg border border-slate-300 px-3 py-2.5 text-sm leading-relaxed text-slate-900"
          />
        </label>
      </div>
      <div className="rounded-xl border border-slate-200/80 bg-white p-3.5 sm:p-4">
        <label className="block text-sm font-extrabold text-slate-800">
          추가 메모(선택)
          <textarea
            name="extraAnswers"
            rows={3}
            className="mt-2 w-full min-h-[4.5rem] rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900"
          />
        </label>
      </div>
      <FormSubmitButton
        idleLabel="지원서 제출하기"
        pendingLabel="제출 중…"
        className="min-h-[48px] w-full rounded-xl bg-emerald-600 px-4 py-3 text-base font-extrabold text-white enabled:hover:bg-emerald-500 disabled:cursor-not-allowed disabled:bg-slate-300 sm:min-h-[44px] sm:text-sm"
      />
    </form>
  );
}
