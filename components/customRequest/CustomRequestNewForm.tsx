"use client";

import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import { FormSubmitButton } from "@/components/qna/FormSubmitButton";
import { submitCustomRequestNew } from "@/lib/customRequest/customRequestComposeActions";
import { CustomRequestFlowStepper } from "@/components/customRequest/CustomRequestFlowStepper";
import { CustomRequestPolicyNotice } from "@/components/customRequest/CustomRequestPolicyNotice";
import { ContactMaskingNotice } from "@/components/customRequest/ContactMaskingNotice";
import {
  CUSTOM_REQUEST_BANNED_WARNING,
  findBannedPhrase,
} from "@/lib/customRequest/bannedPhrases";
import { POST_ATTACHMENT_MAX_FILES } from "@/lib/customRequest/postAttachmentConstants";

const PRIMARY = "#1A56DB";

const CATEGORIES = ["수학", "영어", "국어", "과학", "사회", "기타"] as const;

const BUDGET_OPTIONS = [
  { value: 10000, label: "10,000 캐시" },
  { value: 30000, label: "30,000 캐시" },
  { value: 50000, label: "50,000 캐시" },
  { value: 100000, label: "100,000 캐시" },
  { value: 200000, label: "200,000 캐시" },
] as const;

const BODY_PLACEHOLDER =
  "어떤 도움이 필요한지 구체적으로 적어주세요.\n예: 수학 미적분 개념 정리 노트 제작, 영어 독해 지문 분석 피드백 등";

const inputClass =
  "min-h-[48px] w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-medium placeholder-slate-400 transition focus:border-blue-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/35";

function FormSection(props: { step: string; title: string; hint?: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-slate-200/80 bg-slate-50/40 p-5 ring-1 ring-slate-900/[0.02] sm:p-6">
      <div className="flex gap-3 border-b border-slate-200/70 pb-4">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-violet-600 text-xs font-black text-white shadow-sm">
          {props.step}
        </span>
        <div className="min-w-0">
          <h3 className="text-sm font-extrabold text-slate-900">{props.title}</h3>
          {props.hint ? <p className="mt-1 text-xs font-medium text-slate-500">{props.hint}</p> : null}
        </div>
      </div>
      <div className="pt-5">{props.children}</div>
    </section>
  );
}

export function CustomRequestNewForm(props: { errorMessage: string | null }) {
  const [selectedCat, setSelectedCat] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [budget, setBudget] = useState<number>(50000);
  const [fileCount, setFileCount] = useState(0);

  const bannedHit = useMemo(() => findBannedPhrase(`${subject}\n${body}`), [subject, body]);
  const bodyTooShort = body.trim().length > 0 && body.trim().length < 50;
  const [showIncomplete, setShowIncomplete] = useState(false);

  const incompleteFields = useMemo(() => {
    const list: string[] = [];
    if (!selectedCat) list.push("카테고리");
    if (!subject.trim()) list.push("의뢰 제목");
    if (body.trim().length < 50) list.push("의뢰 내용 (50자 이상)");
    return list;
  }, [selectedCat, subject, body]);

  const canSubmit = !bannedHit && incompleteFields.length === 0;

  return (
    <div className="space-y-8 sm:space-y-10">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-start lg:gap-8">
        <div className="flex w-full min-w-0 flex-col gap-6 lg:col-span-8">
          <CustomRequestFlowStepper activeStep={1} id="new-request-stepper" />

          <form
            action={submitCustomRequestNew}
            className="w-full overflow-hidden rounded-3xl border border-slate-200/90 bg-white shadow-[0_6px_28px_rgba(15,23,42,0.08)] ring-1 ring-slate-900/[0.03]"
          >
            <div className="border-b border-slate-200/80 bg-gradient-to-r from-slate-50 to-sky-50/30 px-5 py-5 sm:px-8 sm:py-6">
              <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-blue-700/90">맞춤의뢰</p>
              <h2 className="mt-1 text-xl font-black text-slate-900 sm:text-2xl">의뢰 등록하기</h2>
              <p className="mt-2 text-xs font-medium text-slate-600 sm:text-sm">
                카테고리 → 의뢰 내용 → 조건 설정 → 확인 순서로 작성해 주세요.
              </p>
            </div>

            <div className="space-y-6 px-5 py-6 sm:space-y-7 sm:px-8 sm:py-8">
              {props.errorMessage ? (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-950">
                  {props.errorMessage}
                </div>
              ) : null}

              <div className="space-y-3">
                <CustomRequestPolicyNotice />
                <ContactMaskingNotice />
              </div>

              <FormSection step="1" title="카테고리 선택" hint="필수 · 하나를 선택해 주세요">
                <input type="hidden" name="category" value={selectedCat} required={selectedCat.length > 0} />
                <div
                  className={`grid grid-cols-2 gap-3 sm:grid-cols-3 ${showIncomplete && !selectedCat ? "rounded-xl ring-2 ring-red-400 ring-offset-2" : ""}`}
                >
                  {CATEGORIES.map((c) => {
                    const on = selectedCat === c;
                    return (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setSelectedCat(c)}
                        className={`flex min-h-[52px] items-center justify-center rounded-2xl border-2 px-4 py-3 text-sm font-bold transition ${
                          on
                            ? "border-[#1A56DB] bg-[#1A56DB] text-white shadow-md"
                            : "border-slate-200 bg-white text-slate-800 hover:border-sky-300 hover:bg-sky-50"
                        }`}
                      >
                        {c}
                      </button>
                    );
                  })}
                </div>
              </FormSection>

              <FormSection step="2" title="의뢰 내용" hint="제목·본문 필수 (본문 50~2000자)">
                <label className="block text-sm font-extrabold text-slate-900">
                  제목
                  <input
                    name="subject"
                    required
                    maxLength={100}
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className={`mt-2 ${inputClass} ${showIncomplete && !subject.trim() ? "border-red-400 ring-2 ring-red-200" : ""}`}
                    placeholder="한 줄로 요약 (최대 100자)"
                  />
                  {showIncomplete && !subject.trim() ? (
                    <p className="mt-1 text-xs font-semibold text-red-700">의뢰 제목을 입력해 주세요.</p>
                  ) : null}
                </label>
                <label className="mt-6 block text-sm font-extrabold text-slate-900">
                  의뢰 내용
                  <textarea
                    name="body"
                    required
                    rows={8}
                    minLength={50}
                    maxLength={2000}
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    className={`mt-2 min-h-[14rem] w-full resize-y rounded-xl border px-3 py-3 text-sm font-medium leading-relaxed placeholder-slate-400 focus:border-blue-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/35 ${
                      showIncomplete && body.trim().length < 50
                        ? "border-red-400 ring-2 ring-red-200"
                        : "border-slate-200"
                    }`}
                    placeholder={BODY_PLACEHOLDER}
                  />
                  {showIncomplete && body.trim().length < 50 ? (
                    <p className="mt-1 text-xs font-semibold text-red-700">의뢰 내용은 50자 이상 입력해 주세요.</p>
                  ) : null}
                  <span className="mt-1 block text-xs font-medium text-slate-500">
                    {body.trim().length}/2000자 (최소 50자)
                  </span>
                </label>
                {bannedHit ? (
                  <p className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-bold text-red-900">
                    {CUSTOM_REQUEST_BANNED_WARNING}
                  </p>
                ) : null}
                {bodyTooShort && !bannedHit ? (
                  <p className="mt-2 text-xs font-semibold text-amber-800">의뢰 내용은 50자 이상 입력해 주세요.</p>
                ) : null}
              </FormSection>

              <FormSection
                step="3"
                title="조건 설정"
                hint="마감일·예산·첨부 파일"
              >
                <label className="block text-sm font-extrabold text-slate-900">
                  참고 파일 첨부 (선택)
                  <span className="mt-1 block text-xs font-medium text-slate-500">
                    PDF/PPT/DOCX/이미지 · 최대 {POST_ATTACHMENT_MAX_FILES}개 · 각 50MB
                  </span>
                  <input
                    type="file"
                    name="postAttachmentFiles"
                    multiple
                    accept="application/pdf,image/png,image/jpeg,image/webp,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.presentationml.presentation"
                    onChange={(e) => setFileCount(e.target.files?.length ?? 0)}
                    className="mt-2 w-full text-sm file:mr-3 file:rounded-xl file:border file:border-slate-200 file:bg-white file:px-4 file:py-2.5 file:text-xs file:font-extrabold file:text-slate-700"
                  />
                  {fileCount > 0 ? (
                    <span className="mt-1 block text-xs text-slate-600">{fileCount}개 선택됨</span>
                  ) : null}
                </label>

                <label className="mt-6 block text-sm font-extrabold text-slate-900">
                  마감일
                  <input name="deadline" type="date" required className={`mt-2 ${inputClass}`} />
                </label>

                <fieldset className="mt-6">
                  <legend className="text-sm font-extrabold text-slate-900">예산 범위</legend>
                  <input type="hidden" name="budgetMin" value={budget} />
                  <input type="hidden" name="budgetMax" value={budget} />
                  <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {BUDGET_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setBudget(opt.value)}
                        className={`rounded-xl border-2 px-3 py-2.5 text-xs font-bold sm:text-sm ${
                          budget === opt.value
                            ? "border-[#1A56DB] bg-blue-50 text-[#1A56DB]"
                            : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </fieldset>
              </FormSection>

              <FormSection step="4" title="확인" hint="동의 후 등록해 주세요">
                <div className="space-y-3">
                  <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-slate-50/80 p-4">
                    <input
                      type="checkbox"
                      name="agreeProhibited"
                      value="on"
                      required
                      className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-xs font-medium leading-relaxed text-slate-800 sm:text-sm">
                      시험 부정·표절·대리·권리 침해를 요청하지 않겠습니다.
                    </span>
                  </label>
                  <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-slate-50/80 p-4">
                    <input
                      type="checkbox"
                      name="agreeNoExternal"
                      value="on"
                      required
                      className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-xs font-medium leading-relaxed text-slate-800 sm:text-sm">
                      의뢰·주문 과정에서 외부로 연락처를 교환하지 않겠습니다.
                    </span>
                  </label>
                </div>
              </FormSection>
            </div>

            <div className="flex flex-col gap-4 border-t border-slate-200/90 bg-slate-100/50 px-5 py-5 sm:px-8 sm:py-6">
              {showIncomplete && incompleteFields.length > 0 ? (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
                  <p className="font-extrabold">아래 항목을 완성해 주세요:</p>
                  <ul className="mt-2 list-inside list-disc font-medium">
                    {incompleteFields.map((f) => (
                      <li key={f}>{f}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-end sm:gap-3">
                <button
                  type="submit"
                  name="intent"
                  value="draft"
                  className="min-h-[52px] rounded-2xl border border-slate-300 bg-white px-6 py-3.5 text-sm font-extrabold text-slate-800 hover:bg-slate-50"
                >
                  임시저장
                </button>
                <div
                  className="w-full sm:w-auto"
                  onMouseEnter={() => {
                    if (!canSubmit) setShowIncomplete(true);
                  }}
                >
                  <FormSubmitButton
                    idleLabel="의뢰 등록하기"
                    pendingLabel="등록 중…"
                    name="intent"
                    value="submit"
                    disabled={!canSubmit}
                    onClick={(e) => {
                      if (!canSubmit) {
                        e.preventDefault();
                        setShowIncomplete(true);
                      }
                    }}
                    className="min-h-[52px] w-full shrink-0 rounded-2xl bg-[#1A56DB] px-8 py-3.5 text-sm font-extrabold text-white shadow-md hover:bg-blue-700 sm:w-auto disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>
              </div>
            </div>
          </form>
        </div>

        <aside className="flex w-full min-w-0 flex-col gap-5 lg:col-span-4 lg:sticky lg:top-28 lg:self-start">
          <div className="rounded-2xl border border-sky-100/90 bg-gradient-to-b from-sky-50/70 to-white p-5 shadow-sm sm:p-6">
            <p className="border-b border-sky-100/80 pb-3 text-sm font-extrabold text-blue-950">요청 작성 팁</p>
            <ul className="mt-4 space-y-3 text-xs font-medium leading-relaxed text-slate-700 sm:text-sm">
              <li>마감·분량·자료를 알려 주면 제안이 정확해져요.</li>
              <li>학년·과목·단원을 구체적으로 적어 주세요.</li>
              <li>대필·완성 대행 표현은 등록이 거절될 수 있어요.</li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
