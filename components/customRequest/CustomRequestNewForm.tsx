"use client";

import { FormSubmitButton } from "@/components/qna/FormSubmitButton";
import { submitCustomRequestNew } from "@/lib/customRequest/customRequestComposeActions";

export function CustomRequestNewForm(props: { errorMessage: string | null }) {
  return (
    <form action={submitCustomRequestNew} className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5">
      <h1 className="text-xl font-black text-slate-900">의뢰 등록</h1>
      {props.errorMessage ? <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-950">{props.errorMessage}</div> : null}

      <label className="block text-sm font-extrabold text-slate-800">
        카테고리
        <input name="category" required className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-1.5" placeholder="예: 수능 국어" />
      </label>
      <label className="block text-sm font-extrabold text-slate-800">
        과목(제목)
        <input name="subject" required className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-1.5" />
      </label>
      <label className="block text-sm font-extrabold text-slate-800">
        목표
        <input name="goal" className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-1.5" />
      </label>
      <label className="block text-sm font-extrabold text-slate-800">
        설명
        <textarea name="body" required rows={5} className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-1.5" />
      </label>
      <label className="block text-sm font-extrabold text-slate-800">
        희망 기한
        <input name="deadline" type="date" className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-1.5" />
      </label>
      <div className="grid gap-2 sm:grid-cols-2">
        <label className="text-sm font-extrabold text-slate-800">
          예산(최소)
          <input name="budgetMin" type="number" min={0} className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-1.5" />
        </label>
        <label className="text-sm font-extrabold text-slate-800">
          예산(최대)
          <input name="budgetMax" type="number" min={0} className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-1.5" />
        </label>
      </div>
      <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50/80 p-3 text-sm text-slate-500">
        첨부 파일은 주문이 연결된 뒤, 안내에 따라 등록할 수 있습니다(현재 비활성).
        <input type="file" disabled className="mt-1 block w-full text-xs" />
      </div>
      <label className="block text-sm font-extrabold text-slate-800">
        원하는 결과물 형식
        <input name="deliverableFormat" className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-1.5" placeholder="예: hwp, 첨삭 댓글" />
      </label>

      <div className="space-y-2 text-sm text-slate-800">
        <p className="text-xs text-slate-500">연락은 플랫폼 내·주문·진행 루틴만 사용합니다. 외부 연락처(카톡·이메일 등) 교환은 정책·분쟁·계정에 따라 제재될 수 있습니다.</p>
        <label className="flex items-start gap-2">
          <input type="checkbox" name="agreeProhibited" value="on" required className="mt-1" />
          <span>시험 부정·표절·대리시험·타인 권리 침해 등을 요청하지 않는다는 데 동의합니다.</span>
        </label>
        <label className="flex items-start gap-2">
          <input type="checkbox" name="agreeNoExternal" value="on" required className="mt-1" />
          <span>의뢰/주문/납품 과정에서 외부로 연락처를 교환하지 않겠습니다(플랫폼 안에서만). </span>
        </label>
      </div>
      <FormSubmitButton
        idleLabel="의뢰 등록"
        pendingLabel="보내는 중…"
        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white enabled:hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-slate-300"
      />
    </form>
  );
}
