"use client";

import { FormSubmitButton } from "@/components/qna/FormSubmitButton";
import { submitMentorCustomRequestApplication } from "@/lib/customRequest/customRequestApplicationActions";

export function MentorApplicationForm(props: { postId: string; returnContext: "mentor" | "public" }) {
  return (
    <form
      action={submitMentorCustomRequestApplication}
      className="space-y-3 rounded-2xl border border-emerald-200 bg-emerald-50/50 p-5"
    >
      <h2 className="text-lg font-extrabold text-slate-900">지원서 제출</h2>
      <p className="text-xs text-slate-600">
        제출하신 제안가·납기·제안 내용은 의뢰자(학생)의 지원서 비교 화면에 표시됩니다. 질문·조정은 플랫폼 내 맞춤의뢰 흐름에 따릅니다.
      </p>
      <input type="hidden" name="postId" value={props.postId} />
      <input type="hidden" name="returnContext" value={props.returnContext} />
      <label className="block text-sm font-extrabold text-slate-800">
        제안 가격(원)
        <input
          name="proposedPrice"
          type="number"
          min={0}
          required
          className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-1.5"
        />
      </label>
      <label className="block text-sm font-extrabold text-slate-800">
        예상 납기(완료 예정일)
        <input
          name="deliveryAt"
          type="date"
          required
          className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-1.5"
        />
      </label>
      <label className="block text-sm font-extrabold text-slate-800">
        제안 내용
        <textarea
          name="coverNote"
          required
          rows={7}
          placeholder="제안 범위, 진행 방식, 질의응답, 인도 형태 등을 구체적으로 적어 주세요."
          className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-1.5"
        />
      </label>
      <label className="block text-sm font-extrabold text-slate-800">
        추가 메모(선택)
        <textarea
          name="extraAnswers"
          rows={3}
          className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-1.5"
        />
      </label>
      <FormSubmitButton
        idleLabel="지원서 제출"
        pendingLabel="제출 중…"
        className="rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-extrabold text-white enabled:hover:bg-emerald-500 disabled:cursor-not-allowed disabled:bg-slate-300"
      />
    </form>
  );
}
