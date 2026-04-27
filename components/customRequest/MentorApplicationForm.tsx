"use client";

import { FormSubmitButton } from "@/components/qna/FormSubmitButton";
import { submitMentorCustomRequestApplication } from "@/lib/customRequest/customRequestApplicationActions";

export function MentorApplicationForm(props: { postId: string; appTableHint: string | null }) {
  return (
    <form action={submitMentorCustomRequestApplication} className="space-y-3 rounded-2xl border border-emerald-200 bg-emerald-50/50 p-5">
      <h2 className="text-lg font-extrabold text-slate-900">멘토 지원 제출</h2>
      <p className="text-xs text-slate-600">
        custom_request_applications(후보) insert · {props.appTableHint ? `probe: ${props.appTableHint}` : "테이블 probe 필요"}
      </p>
      <input type="hidden" name="postId" value={props.postId} />
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
        납기(제안)
        <input name="deliveryAt" type="date" className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-1.5" />
      </label>
      <label className="block text-sm font-extrabold text-slate-800">
        제공 범위
        <textarea name="scope" required rows={3} className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-1.5" />
      </label>
      <label className="block text-sm font-extrabold text-slate-800">
        자기소개 / 커버노트
        <textarea name="coverNote" required rows={4} className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-1.5" />
      </label>
      <label className="block text-sm font-extrabold text-slate-800">
        추가 질문·응답(의뢰 측 문항)
        <textarea name="extraAnswers" rows={3} className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-1.5" />
      </label>
      <FormSubmitButton
        idleLabel="지원 제출"
        pendingLabel="제출 중…"
        className="rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-extrabold text-white enabled:hover:bg-emerald-500 disabled:cursor-not-allowed disabled:bg-slate-300"
      />
    </form>
  );
}
