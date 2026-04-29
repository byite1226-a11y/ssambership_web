"use client";

import { FormSubmitButton } from "@/components/qna/FormSubmitButton";
import { submitCustomRequestNew } from "@/lib/customRequest/customRequestComposeActions";
import { CustomRequestFlowStepper } from "@/components/customRequest/CustomRequestFlowStepper";

const EXAMPLES = [
  { t: "수행평가 보고서 구조", d: "자료 조사·목차·분량에 맞춰 초안을 정리해 주세요." },
  { t: "수학 개념 질문", d: "단원명과 막히는 지점을 짧게 알려 주세요." },
  { t: "면접 질문 대비", d: "지원 동기·질문 예시를 기준으로 실전감 있게 봐 주세요." },
  { t: "논술 첨삭", d: "주제·분량·마감을 정해 올리면 톤·논리를 봐 주세요." },
] as const;

export function CustomRequestNewForm(props: { errorMessage: string | null }) {
  return (
    <div className="space-y-6 sm:space-y-8">
      <CustomRequestFlowStepper activeStep={1} id="new-request-stepper" />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-8">
        <form
          action={submitCustomRequestNew}
          encType="multipart/form-data"
          className="space-y-4 rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm sm:space-y-5 sm:p-5 lg:col-span-7 xl:col-span-8"
        >
          <h2 className="text-lg font-extrabold text-slate-900 sm:text-xl">요청 내용</h2>
          {props.errorMessage ? (
            <div className="rounded-xl border border-red-200 bg-red-50/90 px-3.5 py-2.5 text-sm font-semibold text-red-950">
              {props.errorMessage}
            </div>
          ) : null}

          <div className="rounded-2xl border border-indigo-100/80 bg-indigo-50/30 p-3.5 sm:p-4">
            <p className="text-sm font-extrabold text-slate-900">1. 어떤 도움이 필요하신가요?</p>
            <p className="mt-0.5 text-xs text-slate-600">카테고리를 정해 주시면 맞는 멘토를 찾는 데 도움이 돼요.</p>
            <label className="mt-3 block text-sm font-extrabold text-slate-800">
              카테고리
              <input
                name="category"
                required
                className="mt-2 min-h-[44px] w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm"
                placeholder="예: 수능 국어, 수행평가"
              />
            </label>
          </div>

          <label className="block text-sm font-extrabold text-slate-800">
            제목
            <input
              name="subject"
              required
              className="mt-2 min-h-[44px] w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm"
              placeholder="한 줄로 요청을 요약해 주세요"
            />
          </label>
          <label className="block text-sm font-extrabold text-slate-800">
            목표(선택)
            <input name="goal" className="mt-2 min-h-[44px] w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm" />
          </label>
          <label className="block text-sm font-extrabold text-slate-800">
            상세 내용
            <textarea
              name="body"
              required
              rows={6}
              className="mt-2 w-full min-h-[10rem] rounded-xl border border-slate-300 px-3 py-2.5 text-sm leading-relaxed"
              placeholder="배경, 범위, 자료, 제한 사항을 구체적으로 적어 주세요."
            />
          </label>

          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/80 p-3.5 sm:p-4">
            <p className="text-sm font-extrabold text-slate-800">첨부 파일(선택)</p>
            <p className="mt-1 text-xs text-slate-600">PDF, 이미지, ZIP, DOCX, PPTX 등(용량·형식은 안내에 따릅니다)</p>
            <input
              type="file"
              name="postAttachmentFile"
              accept="application/pdf,image/png,image/jpeg,image/webp,application/zip,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.presentationml.presentation"
              className="mt-2 block w-full min-h-[44px] text-sm file:mr-2 file:rounded-lg file:border file:border-slate-200 file:bg-white file:px-3 file:py-1.5"
            />
          </div>

          <label className="block text-sm font-extrabold text-slate-800">
            희망 마감일
            <input name="deadline" type="date" className="mt-2 min-h-[44px] w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm" />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm font-extrabold text-slate-800">
              예산(최소)
              <input
                name="budgetMin"
                type="number"
                min={0}
                className="mt-2 min-h-[44px] w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm"
              />
            </label>
            <label className="text-sm font-extrabold text-slate-800">
              예산(최대)
              <input
                name="budgetMax"
                type="number"
                min={0}
                className="mt-2 min-h-[44px] w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm"
              />
            </label>
          </div>
          <label className="block text-sm font-extrabold text-slate-800">
            원하는 결과물 형식
            <input
              name="deliverableFormat"
              className="mt-2 min-h-[44px] w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm"
              placeholder="예: 한글, 첨삭 댓글, 음성"
            />
          </label>

          <div className="space-y-2 rounded-xl border border-slate-100 bg-slate-50/60 p-3.5 text-sm text-slate-800 sm:p-4">
            <p className="text-xs text-slate-600">플랫폼 내 주문·진행만 사용해요. 외부 연락처는 정책에 따라 제재될 수 있어요.</p>
            <label className="flex items-start gap-2">
              <input type="checkbox" name="agreeProhibited" value="on" required className="mt-1.5" />
              <span>시험 부정·표절·대리·권리 침해를 요청하지 않겠습니다.</span>
            </label>
            <label className="flex items-start gap-2">
              <input type="checkbox" name="agreeNoExternal" value="on" required className="mt-1.5" />
              <span>의뢰·주문 과정에서 외부로 연락처를 교환하지 않겠습니다.</span>
            </label>
          </div>
          <div className="flex flex-col gap-2.5 min-[400px]:flex-row min-[400px]:items-center min-[400px]:justify-end">
            <p className="order-2 text-xs text-slate-500 min-[400px]:order-1 min-[400px]:mr-auto">제출 시 멘토 지원 단계로 이어져요.</p>
            <FormSubmitButton
              idleLabel="의뢰 요청 등록하기"
              pendingLabel="보내는 중…"
              className="order-1 min-h-[48px] w-full min-w-0 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-extrabold text-white enabled:hover:bg-indigo-500 disabled:cursor-not-allowed disabled:bg-slate-300 min-[400px]:order-2 min-[400px]:w-auto"
            />
          </div>
        </form>

        <aside className="space-y-4 lg:col-span-5 xl:col-span-4">
          <div className="rounded-2xl border border-indigo-100/80 bg-indigo-50/40 p-4 sm:p-5">
            <p className="text-sm font-extrabold text-slate-900">요청 작성 팁</p>
            <ul className="mt-2 list-inside list-disc space-y-1.5 text-sm break-words text-slate-700">
              <li>마감·분량·자료를 알려 주시면 견적이 정확해져요.</li>
              <li>학년·과목·단원을 구체적으로 적어 주세요.</li>
            </ul>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <p className="text-sm font-extrabold text-slate-900">이용 안내</p>
            <p className="mt-2 text-sm break-words text-slate-600">등록 후 멘토가 제안을 보내고, 비교한 뒤 한 분을 선택해 주문·상담으로 이어질 수 있어요.</p>
          </div>
          <div className="rounded-2xl border border-amber-100/80 bg-amber-50/50 p-4 sm:p-5">
            <p className="text-sm font-extrabold text-amber-950">주의</p>
            <p className="mt-1.5 text-sm break-words text-amber-900/90">부정·대필·표절 요청은 정책에 따라 제재돼요.</p>
          </div>
        </aside>
      </div>

      <section className="space-y-3" aria-label="요청 예시">
        <h2 className="text-base font-extrabold text-slate-900 sm:text-lg">이런 요청이 많아요</h2>
        <div className="grid grid-cols-1 gap-2.5 min-[500px]:grid-cols-2">
          {EXAMPLES.map((ex) => (
            <div
              key={ex.t}
              className="rounded-2xl border border-slate-200/90 bg-slate-50/50 p-3.5 text-sm text-slate-800 sm:p-4"
            >
              <p className="font-extrabold text-slate-900">{ex.t}</p>
              <p className="mt-1.5 break-words text-slate-600">{ex.d}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
