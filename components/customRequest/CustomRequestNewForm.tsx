"use client";

import { FormSubmitButton } from "@/components/qna/FormSubmitButton";
import { submitCustomRequestNew } from "@/lib/customRequest/customRequestComposeActions";
import { CustomRequestFlowStepper } from "@/components/customRequest/CustomRequestFlowStepper";

const EXAMPLES = [
  { t: "생기부 주제 선정 및 방향성 피드백", d: "희망 전공과 관심 분야에 맞춰 어떤 주제가 적합할지 추천해 주세요." },
  { t: "자기소개서 소재 추천 및 구조 설계", d: "초안 작성 전에 어떤 내용이 들어가야 할지 방향을 잡아 주세요." },
  { t: "면접 예상 질문 및 답변 피드백", d: "지원 전공 및 생기부 기반으로 나올 만한 면접 질문을 구성해 주세요." },
  { t: "기타 맞춤 학습 상담", d: "공부법, 진로 등 전반적인 학습 고민을 멘토와 상의해 보세요." },
] as const;

export function CustomRequestNewForm(props: { errorMessage: string | null }) {
  return (
    <div className="space-y-8 sm:space-y-10">
      <CustomRequestFlowStepper activeStep={1} id="new-request-stepper" />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-start lg:gap-8">
        <form
          action={submitCustomRequestNew}
          className="space-y-6 rounded-2xl border border-slate-100 bg-white p-5 sm:p-6 lg:col-span-8 shadow-sm transition-all"
        >
          <div className="flex items-center justify-between border-b border-slate-100/80 pb-4">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">의뢰 요청서 작성</h2>
            <p className="text-xs text-slate-500 font-medium">제출 시 멘토 지원 단계로 이어집니다.</p>
          </div>

          {props.errorMessage ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-950">
              {props.errorMessage}
            </div>
          ) : null}

          <div className="space-y-5">
            <div className="rounded-xl border border-blue-50 bg-blue-50/10 p-4 sm:p-5 space-y-3.5">
              <label className="block text-sm font-bold text-slate-900 leading-snug">
                1. 어떤 도움이 필요하신가요?
                <p className="mt-1 text-xs text-slate-500 font-medium">
                  카테고리를 정해 주시면 맞는 멘토를 찾는 데 도움이 돼요.
                </p>
                <input
                  name="category"
                  required
                  className="mt-2.5 min-h-[46px] w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-medium placeholder-slate-400 focus:outline-none focus:border-blue-500"
                  placeholder="예: 수능 국어, 수행평가, 논술"
                />
              </label>
            </div>

            <div className="space-y-4">
              <label className="block text-sm font-bold text-slate-900 leading-snug">
                2. 제목을 입력해주세요.
                <p className="mt-1 text-xs text-slate-500 font-medium">
                  요청을 가장 잘 요약할 수 있는 문장을 입력해 주세요.
                </p>
                <input
                  name="subject"
                  required
                  className="mt-2 min-h-[46px] w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm font-medium placeholder-slate-400 focus:outline-none focus:border-blue-500"
                  placeholder="한 줄로 요청을 요약해 주세요"
                />
              </label>

              <label className="block text-sm font-bold text-slate-900 leading-snug">
                목표(선택)
                <p className="mt-1 text-xs text-slate-500 font-medium">
                  해당 요청을 통해 달성하고 싶은 결과를 적어주세요.
                </p>
                <input
                  name="goal"
                  className="mt-2 min-h-[46px] w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm font-medium placeholder-slate-400 focus:outline-none focus:border-blue-500"
                  placeholder="예: 과목 등급 상승, 지원 동기 작성"
                />
              </label>

              <label className="block text-sm font-bold text-slate-900 leading-snug">
                3. 도움이 필요한 내용을 자세히 작성해주세요.
                <p className="mt-1 text-xs text-slate-500 font-medium">
                  배경, 범위, 자료, 제한 사항을 구체적으로 적어 주세요.
                </p>
                <textarea
                  name="body"
                  required
                  rows={6}
                  className="mt-2 w-full min-h-[12rem] rounded-xl border border-slate-200 px-3.5 py-3 text-sm font-medium leading-relaxed placeholder-slate-400 focus:outline-none focus:border-blue-500"
                  placeholder="의뢰 배경, 구체적인 요구 사항을 자세히 적어주시면 더 정확한 제안을 받을 수 있어요."
                />
              </label>
            </div>

            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-4 sm:p-5">
              <p className="text-sm font-bold text-slate-900 leading-snug">4. 첨부 파일 (선택)</p>
              <p className="mt-1 text-xs text-slate-500 font-medium">
                PDF, 이미지, ZIP, DOCX, PPTX 등 (용량 최대 10MB / 최대 5개)
              </p>
              <input
                type="file"
                name="postAttachmentFile"
                accept="application/pdf,image/png,image/jpeg,image/webp,application/zip,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.presentationml.presentation"
                className="mt-3 block w-full min-h-[46px] text-sm file:mr-3 file:rounded-xl file:border file:border-slate-200 file:bg-white file:px-4 file:py-2 file:text-xs file:font-extrabold file:text-slate-700 file:cursor-pointer file:hover:bg-slate-50"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <label className="block text-sm font-bold text-slate-900 leading-snug">
                희망 마감일
                <p className="mt-1 text-xs text-slate-500 font-medium">작업 완료 마감일</p>
                <input
                  name="deadline"
                  type="date"
                  className="mt-2 min-h-[46px] w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm font-medium focus:outline-none focus:border-blue-500"
                />
              </label>
              <label className="block text-sm font-bold text-slate-900 leading-snug">
                예산 (최소)
                <p className="mt-1 text-xs text-slate-500 font-medium">최소 금액</p>
                <input
                  name="budgetMin"
                  type="number"
                  min={0}
                  placeholder="0캐시"
                  className="mt-2 min-h-[46px] w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm font-medium placeholder-slate-400 focus:outline-none focus:border-blue-500"
                />
              </label>
              <label className="block text-sm font-bold text-slate-900 leading-snug">
                예산 (최대)
                <p className="mt-1 text-xs text-slate-500 font-medium">최대 금액</p>
                <input
                  name="budgetMax"
                  type="number"
                  min={0}
                  placeholder="0캐시"
                  className="mt-2 min-h-[46px] w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm font-medium placeholder-slate-400 focus:outline-none focus:border-blue-500"
                />
              </label>
            </div>

            <label className="block text-sm font-bold text-slate-900 leading-snug">
              원하는 결과물 형식 (선택)
              <p className="mt-1 text-xs text-slate-500 font-medium">
                원하는 문서 또는 서비스 결과의 형태를 적어주세요.
              </p>
              <input
                name="deliverableFormat"
                className="mt-2 min-h-[46px] w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm font-medium placeholder-slate-400 focus:outline-none focus:border-blue-500"
                placeholder="예: 한글 문서, PDF, 엑셀, 첨삭 댓글"
              />
            </label>

            <div className="space-y-3 rounded-xl border border-slate-100 bg-slate-50/50 p-4 text-sm text-slate-700 sm:p-5 select-none">
              <p className="text-xs text-slate-500 font-medium leading-relaxed">
                플랫폼의 안전한 거래 규칙 준수를 위해 아래 내용을 확인해 주세요.
              </p>
              <label className="flex items-start gap-2.5 mt-2 cursor-pointer">
                <input type="checkbox" name="agreeProhibited" value="on" required className="mt-1 h-4 w-4 shrink-0" />
                <span className="text-xs sm:text-sm font-medium text-slate-700 leading-normal">
                  시험 부정·표절·대리·권리 침해를 요청하지 않겠습니다.
                </span>
              </label>
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input type="checkbox" name="agreeNoExternal" value="on" required className="mt-1 h-4 w-4 shrink-0" />
                <span className="text-xs sm:text-sm font-medium text-slate-700 leading-normal">
                  의뢰·주문 과정에서 외부로 연락처를 교환하지 않겠습니다.
                </span>
              </label>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-100/80 pt-5 mt-2">
            <span className="text-xs text-slate-500 font-medium text-center sm:text-left">
              제출한 내용은 심사를 거쳐 멘토들이 열람하게 됩니다.
            </span>
            <FormSubmitButton
              idleLabel="의뢰 요청 등록하기"
              pendingLabel="등록 중…"
              className="min-h-[48px] w-full sm:w-auto rounded-xl bg-blue-600 px-6 py-3 text-sm font-extrabold text-white shadow-sm hover:bg-blue-700 transition"
            />
          </div>
        </form>

        <aside className="space-y-5 lg:col-span-4 h-full">
          <div className="rounded-2xl border border-blue-50 bg-blue-50/10 p-5 space-y-3 shadow-sm select-none">
            <div className="flex items-center gap-1.5 border-b border-blue-100 pb-2">
              <span className="text-sm font-bold text-blue-800">💡 요청 작성 팁</span>
            </div>
            <ul className="list-inside list-disc space-y-1 text-xs sm:text-sm font-medium text-slate-700 leading-relaxed">
              <li>마감·분량·자료를 알려 주시면 견적이 정확해져요.</li>
              <li>학년·과목·단원을 구체적으로 적어 주세요.</li>
              <li>중요한 배경과 요구 조건을 구체적으로 명시해 주세요.</li>
            </ul>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-white p-5 space-y-3 shadow-sm select-none">
            <div className="flex items-center gap-1.5 border-b border-slate-100 pb-2">
              <span className="text-sm font-bold text-slate-800">📦 이용 안내</span>
            </div>
            <p className="text-xs sm:text-sm font-medium text-slate-600 leading-relaxed">
              등록 후 여러 멘토들의 제안서가 도착합니다. 제안서를 꼼꼼히 비교한 후 한 분을 선택하여 상담 및 주문으로 이어지게 됩니다.
            </p>
          </div>

          <div className="rounded-2xl border border-amber-100/60 bg-amber-50/30 p-5 space-y-3 shadow-sm select-none">
            <div className="flex items-center gap-1.5 border-b border-amber-100 pb-2">
              <span className="text-sm font-bold text-amber-900">⚠️ 주의사항</span>
            </div>
            <p className="text-xs sm:text-sm font-medium text-amber-800 leading-relaxed">
              부정행위, 대필, 표절 요청은 운영 정책에 따라 반려될 수 있으며 상습 적발 시 서비스 이용이 제한될 수 있습니다.
            </p>
          </div>
        </aside>
      </div>

      <section className="space-y-4" aria-label="요청 예시">
        <div className="border-b border-slate-100 pb-2">
          <h2 className="text-base font-bold text-slate-900 sm:text-lg">이런 요청이 많아요!</h2>
          <p className="text-xs font-medium text-slate-500 mt-0.5">다른 학생들이 많이 의뢰한 유형을 참고해 보세요.</p>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {EXAMPLES.map((ex) => (
            <div
              key={ex.t}
              className="rounded-2xl border border-slate-100 bg-white p-4 text-sm shadow-sm transition hover:shadow-md"
            >
              <p className="font-bold text-slate-900 line-clamp-1">{ex.t}</p>
              <p className="mt-2 break-words text-slate-600 font-medium text-xs sm:text-sm leading-relaxed line-clamp-3">
                {ex.d}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
