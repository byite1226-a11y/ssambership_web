"use client";

import { useState } from "react";
import { FormSubmitButton } from "@/components/qna/FormSubmitButton";
import { submitCustomRequestNew } from "@/lib/customRequest/customRequestComposeActions";
import { CustomRequestFlowStepper } from "@/components/customRequest/CustomRequestFlowStepper";

const EXAMPLES = [
  { t: "생기부 주제 선정 및 방향성 피드백", d: "희망 전공과 관심 분야에 맞춰 어떤 주제가 적합할지 추천해 주세요." },
  { t: "자기소개서 소재 추천 및 구조 설계", d: "초안 작성 전에 어떤 내용이 들어가야 할지 방향을 잡아 주세요." },
  { t: "면접 예상 질문 및 답변 피드백", d: "지원 전공 및 생기부 기반으로 나올 만한 면접 질문을 구성해 주세요." },
  { t: "기타 맞춤 학습 상담", d: "공부법, 진로 등 전반적인 학습 고민을 멘토와 상의해 보세요." },
] as const;

const fieldRing =
  "rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-medium placeholder-slate-400 transition focus:border-blue-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/35 focus-visible:ring-offset-0";

export function CustomRequestNewForm(props: { errorMessage: string | null }) {
  const [selectedCat, setSelectedCat] = useState("");

  const cats = [
    "학습 계획 & 방법",
    "과목 개념 이해",
    "과제/보고서",
    "발표 준비 코칭",
    "글쓰기/논술 첨삭",
    "진로/진학 상담",
    "기타 학습상담",
  ];

  return (
    <div className="space-y-8 sm:space-y-10">
      <CustomRequestFlowStepper activeStep={1} id="new-request-stepper" />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-start lg:gap-8">
        <form
          action={submitCustomRequestNew}
          className="space-y-0 overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-[0_2px_16px_rgba(15,23,42,0.07)] ring-1 ring-slate-900/[0.03] lg:col-span-8"
        >
          <div className="space-y-6 p-5 sm:p-7">
            <div className="flex flex-col gap-1 border-b border-slate-100 pb-5 sm:flex-row sm:items-end sm:justify-between">
              <h2 className="text-lg font-extrabold leading-snug text-slate-900 sm:text-xl">의뢰 요청서 작성</h2>
              <p className="text-xs font-medium leading-relaxed text-slate-500">제출하면 멘토 지원 단계로 넘어가요.</p>
            </div>

            {props.errorMessage ? (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-950">
                {props.errorMessage}
              </div>
            ) : null}

            <div className="rounded-2xl border border-sky-100/90 bg-gradient-to-b from-sky-50/50 to-white p-4 sm:p-6">
              <label className="block text-sm font-extrabold leading-snug text-slate-900">
                1. 어떤 도움이 필요하신가요?
                <span className="mt-1 block text-xs font-medium leading-relaxed text-slate-600">
                  카드를 눌러 고르거나, 아래 칸에 직접 적어 주세요.
                </span>
                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {cats.map((c) => {
                    const on = selectedCat === c;
                    return (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setSelectedCat(c)}
                        className={`flex min-h-[3.25rem] items-center rounded-2xl border-2 px-4 py-3 text-left text-xs font-bold transition-all sm:min-h-[3.5rem] sm:text-sm ${
                          on
                            ? "border-blue-600 bg-blue-600 text-white shadow-md ring-2 ring-blue-200 ring-offset-2 ring-offset-sky-50/80"
                            : "border-slate-200/90 bg-white text-slate-800 hover:border-sky-300 hover:bg-sky-50/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                        }`}
                      >
                        {c}
                      </button>
                    );
                  })}
                </div>
                <input
                  name="category"
                  required
                  value={selectedCat}
                  onChange={(e) => setSelectedCat(e.target.value)}
                  className={`mt-4 min-h-[52px] w-full ${fieldRing}`}
                  placeholder="예: 수능 국어, 수행평가, 논술"
                />
              </label>
            </div>

            <div className="space-y-6 rounded-2xl border border-slate-100 bg-slate-50/40 p-4 sm:p-6">
              <label className="block text-sm font-extrabold leading-snug text-slate-900">
                2. 제목을 입력해 주세요
                <span className="mt-1 block text-xs font-medium text-slate-500">요청을 한 줄로 요약해 주세요.</span>
                <input name="subject" required className={`mt-3 min-h-[52px] w-full ${fieldRing}`} placeholder="한 줄로 요약해 주세요" />
              </label>

              <label className="block text-sm font-extrabold leading-snug text-slate-900">
                목표 (선택)
                <span className="mt-1 block text-xs font-medium text-slate-500">이번 의뢰로 이루고 싶은 결과를 적어 주세요.</span>
                <input name="goal" className={`mt-3 min-h-[52px] w-full ${fieldRing}`} placeholder="예: 과목 등급 상승, 지원 동기 작성" />
              </label>

              <label className="block text-sm font-extrabold leading-snug text-slate-900">
                3. 도움이 필요한 내용을 자세히 적어 주세요
                <span className="mt-1 block text-xs font-medium text-slate-500">배경, 범위, 자료, 제한 사항을 구체적으로 적어 주세요.</span>
                <div className="mt-3 rounded-2xl border border-slate-200/90 bg-white p-1 shadow-inner">
                  <textarea
                    name="body"
                    required
                    rows={6}
                    className="min-h-[13.5rem] w-full resize-y rounded-xl border-0 bg-transparent px-3 py-3 text-sm font-medium leading-relaxed placeholder-slate-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500/30"
                    placeholder="의뢰 배경과 요구 사항을 자세히 적을수록 제안이 정확해져요."
                  />
                </div>
              </label>
            </div>

            <div className="rounded-2xl border-2 border-dashed border-slate-200/90 bg-slate-50/80 p-4 sm:p-6">
              <p className="text-sm font-extrabold text-slate-900">4. 첨부 파일 (선택)</p>
              <p className="mt-1 text-xs font-medium leading-relaxed text-slate-500">
                PDF, 이미지, ZIP, DOCX, PPTX 등 (최대 10MB / 최대 5개)
              </p>
              <input
                type="file"
                name="postAttachmentFile"
                accept="application/pdf,image/png,image/jpeg,image/webp,application/zip,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.presentationml.presentation"
                className="mt-4 block w-full min-h-[52px] text-sm file:mr-3 file:rounded-xl file:border file:border-slate-200 file:bg-white file:px-4 file:py-2.5 file:text-xs file:font-extrabold file:text-slate-700 file:cursor-pointer file:transition file:hover:bg-slate-50"
              />
            </div>

            <div className="grid gap-5 sm:grid-cols-3 sm:gap-4">
              <label className="block text-sm font-extrabold text-slate-900">
                희망 마감일
                <span className="mt-1 block text-xs font-medium text-slate-500">완료 희망일</span>
                <input name="deadline" type="date" className={`mt-3 min-h-[52px] w-full ${fieldRing}`} />
              </label>
              <label className="block text-sm font-extrabold text-slate-900">
                예산 (최소)
                <span className="mt-1 block text-xs font-medium text-slate-500">최소 금액</span>
                <input
                  name="budgetMin"
                  type="number"
                  min={0}
                  placeholder="0캐시"
                  className={`mt-3 min-h-[52px] w-full ${fieldRing}`}
                />
              </label>
              <label className="block text-sm font-extrabold text-slate-900">
                예산 (최대)
                <span className="mt-1 block text-xs font-medium text-slate-500">최대 금액</span>
                <input
                  name="budgetMax"
                  type="number"
                  min={0}
                  placeholder="0캐시"
                  className={`mt-3 min-h-[52px] w-full ${fieldRing}`}
                />
              </label>
            </div>

            <label className="block text-sm font-extrabold leading-snug text-slate-900">
              원하는 결과물 형식 (선택)
              <span className="mt-1 block text-xs font-medium text-slate-500">원하는 형태를 적어 주세요.</span>
              <input
                name="deliverableFormat"
                className={`mt-3 min-h-[52px] w-full ${fieldRing}`}
                placeholder="예: 한글 문서, PDF, 첨삭 댓글"
              />
            </label>

            <div className="space-y-4 rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5">
              <p className="text-xs font-extrabold uppercase tracking-wide text-slate-500">동의</p>
              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-100 bg-slate-50/50 p-3 transition hover:bg-slate-50">
                <input type="checkbox" name="agreeProhibited" value="on" required className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                <span className="text-xs font-medium leading-relaxed text-slate-700 sm:text-sm">
                  시험 부정·표절·대리·권리 침해를 요청하지 않겠습니다.
                </span>
              </label>
              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-100 bg-slate-50/50 p-3 transition hover:bg-slate-50">
                <input type="checkbox" name="agreeNoExternal" value="on" required className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                <span className="text-xs font-medium leading-relaxed text-slate-700 sm:text-sm">
                  의뢰·주문 과정에서 외부로 연락처를 교환하지 않겠습니다.
                </span>
              </label>
            </div>
          </div>

          <div className="flex flex-col items-stretch justify-between gap-4 border-t border-slate-100 bg-slate-50/30 px-5 py-5 sm:flex-row sm:items-center sm:px-7 sm:py-6">
            <span className="text-center text-xs font-medium leading-relaxed text-slate-500 sm:text-left">제출 후 멘토가 제안을 보낼 수 있어요.</span>
            <FormSubmitButton
              idleLabel="의뢰 요청 등록하기"
              pendingLabel="등록 중…"
              className="min-h-[52px] w-full shrink-0 rounded-2xl bg-blue-600 px-8 py-3.5 text-sm font-extrabold text-white shadow-md transition hover:bg-blue-700 hover:shadow-lg sm:w-auto"
            />
          </div>
        </form>

        <aside className="space-y-5 lg:col-span-4 lg:sticky lg:top-28 lg:self-start">
          <div className="rounded-2xl border border-sky-100/90 bg-gradient-to-b from-sky-50/60 to-white p-5 shadow-sm ring-1 ring-slate-900/[0.02] sm:p-6">
            <p className="border-b border-sky-100/80 pb-3 text-sm font-extrabold text-blue-950">요청 작성 팁</p>
            <ul className="mt-4 space-y-3 text-xs font-medium leading-relaxed text-slate-700 sm:text-sm">
              <li className="flex gap-2.5">
                <span className="mt-0.5 font-black text-blue-600" aria-hidden>
                  ·
                </span>
                마감·분량·자료를 알려 주면 견적이 정확해져요.
              </li>
              <li className="flex gap-2.5">
                <span className="mt-0.5 font-black text-blue-600" aria-hidden>
                  ·
                </span>
                학년·과목·단원을 구체적으로 적어 주세요.
              </li>
              <li className="flex gap-2.5">
                <span className="mt-0.5 font-black text-blue-600" aria-hidden>
                  ·
                </span>
                꼭 지켜야 할 조건이 있으면 빠짐없이 적어 주세요.
              </li>
            </ul>
          </div>

          <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm ring-1 ring-slate-900/[0.02] sm:p-6">
            <p className="border-b border-slate-100 pb-3 text-sm font-extrabold text-slate-900">이용 안내</p>
            <p className="mt-4 text-xs font-medium leading-relaxed text-slate-600 sm:text-sm">
              등록하면 여러 멘토의 제안을 받을 수 있어요. 비교한 뒤 한 분을 고르면 상담·주문 단계로 이어져요.
            </p>
          </div>

          <div className="rounded-2xl border border-amber-200/80 bg-amber-50/50 p-5 shadow-sm ring-1 ring-amber-900/[0.04] sm:p-6">
            <p className="border-b border-amber-200/60 pb-3 text-sm font-extrabold text-amber-950">주의사항</p>
            <p className="mt-4 text-xs font-medium leading-relaxed text-amber-950 sm:text-sm">
              부정행위·대필·표절 요청은 반려될 수 있어요. 반복 시 이용이 제한될 수 있습니다.
            </p>
          </div>
        </aside>
      </div>

      <section className="space-y-4" aria-label="요청 예시">
        <div className="border-b border-slate-100 pb-3">
          <h2 className="text-base font-extrabold text-slate-900 sm:text-lg">이런 요청이 많아요</h2>
          <p className="mt-1 text-xs font-medium text-slate-500">예시를 참고해 보세요.</p>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {EXAMPLES.map((ex) => (
            <div
              key={ex.t}
              className="rounded-2xl border border-slate-100 bg-white p-4 text-sm shadow-sm transition hover:border-sky-200 hover:shadow-md"
            >
              <p className="line-clamp-1 font-bold text-slate-900">{ex.t}</p>
              <p className="mt-2 line-clamp-3 text-xs font-medium leading-relaxed text-slate-600 sm:text-sm">{ex.d}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
