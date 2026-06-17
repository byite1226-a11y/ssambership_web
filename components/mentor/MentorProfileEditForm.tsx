"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { FormSubmitButton } from "@/components/qna/FormSubmitButton";
import { submitMentorProfileEdit } from "@/lib/mentor/mentorProfileEditActions";
import type { MentorProfileDisplay } from "@/lib/mentor/mentorDisplayFields";
import { mentorVerificationKo } from "@/lib/mentor/mentorDisplayFields";
import { MentorPublicProfilePreviewCard } from "@/components/mentor/MentorPublicProfilePreviewCard";
import { USER_UI_LOAD_FAILED } from "@/lib/constants/userFacingMessages";
import { SUBSCRIBE_PLAN_CATALOG } from "@/lib/subscribe/subscribePlanCatalog";
import {
  isOutsideMentorPriceGuide,
  mentorPlanCashKrw,
  mentorSubscriptionPriceRule,
} from "@/lib/subscribe/mentorPlanPricing";
import { Camera, ChevronRight, HelpCircle, PlayCircle, Info, LayoutGrid, Video, Plus } from "lucide-react";
import { MentorSubjectCheckboxes } from "@/components/subjects/MentorSubjectCheckboxes";
import { subjectCodesFromText } from "@/lib/subjects/subjectCatalog";

type Q = { 
  row: Record<string, unknown> | null; 
  err: string | null; 
  media: { rows: Record<string, unknown>[]; table: string | null; error: string | null };
  byTier?: Record<string, Record<string, unknown> | null> | null;
};
type I = { 
  intro: string; 
  university: string; 
  department: string; 
  subjects: string; 
  highSchool: string; 
  tags: string; 
  subOpen: boolean; 
  photoUrl: string; 
  verification: string;
  displayName?: string;
  grade?: string;
  individualQuestionPriceCash?: number | null;
};

const inputClass =
  "min-h-[48px] w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-700 placeholder:text-slate-400 transition focus:border-blue-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/30";

const labelClass = "flex items-center gap-1.5 text-sm font-extrabold text-slate-900";

function priceInputName(tier: string): string {
  return `subscriptionPriceKrw_${tier}`;
}

function SectionHeader(props: { number: string; title: string; required?: boolean; optional?: boolean }) {
  return (
    <div className="flex items-center justify-between border-b border-slate-100 pb-4">
      <div className="flex items-center gap-2">
        <h2 className="text-lg font-black text-slate-900">
          <span className="mr-1.5">{props.number}.</span>
          {props.title}
        </h2>
        {props.required && (
          <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-600 ring-1 ring-blue-100">
            필수
          </span>
        )}
        {props.optional && (
          <span className="rounded-full bg-slate-50 px-2 py-0.5 text-[10px] font-bold text-slate-500 ring-1 ring-slate-200">
            선택
          </span>
        )}
      </div>
    </div>
  );
}

export function MentorProfileEditForm(props: {
  initial: I;
  query: Q;
  accountEmail?: string | null;
  ok: boolean;
  errorMessage: string | null;
}) {
  const { initial, query, ok, errorMessage } = props;

  // Real-time preview state
  const [formData, setFormData] = useState({
    nickname: initial.displayName || "",
    university: initial.university || "",
    department: initial.department || "",
    highSchool: initial.highSchool || "",
    grade: initial.grade || "",
    intro: initial.intro || "",
    bio: "", // Actual bio column would need to be added to lib/mentor/mentorDisplayFields.ts
    career: "", // Actual career column would need to be added to lib/mentor/mentorDisplayFields.ts
    subjects: initial.subjects || "",
    answerStyle: "",
    subOpen: initial.subOpen,
  });
  const [planPrices, setPlanPrices] = useState(() =>
    Object.fromEntries(
      SUBSCRIBE_PLAN_CATALOG.map((plan) => [
        plan.tier,
        String(mentorPlanCashKrw(query.byTier?.[plan.tier] ?? null, plan.tier)),
      ]),
    ) as Record<string, string>,
  );
  const [individualQuestionPrice, setIndividualQuestionPrice] = useState(
    initial.individualQuestionPriceCash != null && initial.individualQuestionPriceCash > 0
      ? String(initial.individualQuestionPriceCash)
      : "",
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const val = type === "checkbox" ? (e.target as HTMLInputElement).checked : value;
    setFormData((prev) => ({ ...prev, [name]: val }));
  };

  const handlePlanPriceChange = (tier: string, value: string) => {
    setPlanPrices((prev) => ({ ...prev, [tier]: value }));
  };

  // 담당과목: formData.subjects(콤마 결합)에서 정본 code 파생. 토글 시 code 결합으로 갱신.
  // (미선택/레거시 자유텍스트는 첫 토글 전까지 그대로 보존 — 강제 변환 없음)
  const subjectCodes = subjectCodesFromText(formData.subjects);
  const toggleSubjectCode = (code: string) => {
    const next = new Set(subjectCodes);
    if (next.has(code)) next.delete(code);
    else next.add(code);
    setFormData((prev) => ({ ...prev, subjects: [...next].join(",") }));
  };

  const previewDisplay: MentorProfileDisplay = {
    displayName: formData.nickname || initial.displayName || "",
    university: formData.university,
    department: formData.department,
    highSchool: formData.highSchool,
    grade: formData.grade,
    intro: formData.intro,
    subjects: formData.subjects,
    tags: initial.tags,
    subOpen: formData.subOpen,
    photoUrl: initial.photoUrl,
    verification: initial.verification,
  };

  const lastSavedStr = query.row?.updated_at
    ? new Date(query.row.updated_at as string).toLocaleString("ko-KR", {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "기록 없음";

  return (
    <div className="mx-auto w-full max-w-[1400px] px-4 py-8">
      {/* Header Area */}
      <div className="mb-10 flex flex-col items-start justify-between gap-4 border-b border-slate-100 pb-8 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">멘토 프로필 관리</h1>
          <p className="mt-2 text-sm font-medium text-slate-500">기본 정보·소개·과목·요금제·인증 서류를 관리하세요.</p>
        </div>
        <div className="flex items-center gap-4">
          <p suppressHydrationWarning className="text-xs font-medium text-slate-400">마지막 저장: {lastSavedStr}</p>
        </div>
      </div>

      <form action={submitMentorProfileEdit} className="grid grid-cols-1 gap-10 lg:grid-cols-12">
        {/* Left Column: Form Fields */}
        <div className="space-y-12 lg:col-span-7">
          {ok && (
            <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-900">성공적으로 저장되었습니다.</p>
          )}
          {errorMessage && (
            <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-900">{errorMessage}</p>
          )}

          {/* 1. 기본 정보 */}
          <section className="space-y-6">
            <SectionHeader number="1" title="기본 정보" required />
            
            <div className="flex flex-col gap-8 sm:flex-row sm:items-start">
              <div className="flex flex-col items-center gap-3">
                <p className="w-full text-xs font-extrabold text-slate-500">프로필 사진</p>
                <div className="relative h-24 w-24 overflow-hidden rounded-full border-2 border-slate-100 bg-slate-50 shadow-inner">
                  {initial.photoUrl ? (
                    <img src={initial.photoUrl} alt="Profile" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-slate-300">
                      <Camera className="h-8 w-8" />
                    </div>
                  )}
                </div>
                <button type="button" className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 shadow-sm transition hover:bg-slate-50">
                  사진 변경
                </button>
                <div className="text-center text-[10px] leading-relaxed text-slate-400">
                  권장 사이즈: 400x400px (JPG, PNG)<br />최대 5MB
                </div>
              </div>

              <div className="flex-1 space-y-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className={labelClass} htmlFor="nickname">이름</label>
                    <div className="relative mt-1.5">
                      <input
                        id="nickname"
                        name="nickname"
                        placeholder="닉네임을 입력해주세요"
                        className={inputClass}
                        value={formData.nickname}
                        onChange={handleChange}
                        maxLength={20}
                      />
                    </div>
                  </div>
                  <div>
                    <label className={labelClass} htmlFor="grade">학번 (예: 22학번)</label>
                    <div className="relative mt-1.5">
                      <input
                        id="grade"
                        name="grade"
                        className={inputClass}
                        placeholder="22학번"
                        value={formData.grade}
                        onChange={handleChange}
                        maxLength={20}
                      />
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-1">
                  <div>
                    <label className={labelClass} htmlFor="department">전공(학과) <span className="ml-0.5 text-red-500">*</span></label>
                    <div className="relative mt-1.5">
                      <input
                        id="department"
                        name="department"
                        placeholder="전공 학과를 입력해주세요"
                        className={inputClass}
                        value={formData.department}
                        onChange={handleChange}
                        maxLength={40}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className={labelClass} htmlFor="highSchool">출신 고등학교 <span className="ml-0.5 text-red-500">*</span></label>
                  <div className="relative mt-1.5">
                    <input
                      id="highSchool"
                      name="highSchool"
                      placeholder="출신 고등학교를 입력해주세요"
                      className={inputClass}
                      value={formData.highSchool}
                      onChange={handleChange}
                      maxLength={40}
                    />
                  </div>
                </div>

                <div>
                  <label className={labelClass} htmlFor="university">대학교 <span className="ml-0.5 text-red-500">*</span></label>
                  <div className="relative mt-1.5">
                    <input
                      id="university"
                      name="university"
                      placeholder="대학교를 입력해주세요"
                      className={inputClass}
                      value={formData.university}
                      onChange={handleChange}
                      maxLength={40}
                    />
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* 2. 소개 */}
          <section className="space-y-6">
            <SectionHeader number="2" title="소개" required />
            
            <div className="space-y-5">
              <div>
                <label className={labelClass} htmlFor="intro">한줄 소개 <span className="ml-0.5 text-red-500">*</span></label>
                <div className="relative mt-1.5">
                  <input
                    id="intro"
                    name="intro"
                    placeholder="대표 한줄 소개를 입력해주세요"
                    className={inputClass}
                    value={formData.intro}
                    onChange={handleChange}
                    maxLength={50}
                  />
                  <p className="mt-1 text-right text-[10px] font-medium text-slate-400">{formData.intro.length}/50</p>
                </div>
              </div>

              <div>
                <label className={labelClass} htmlFor="bio">상세 소개 <span className="ml-0.5 text-red-500">*</span></label>
                <div className="relative mt-1.5">
                  <textarea
                    id="bio"
                    name="bio"
                    placeholder="멘토링 스타일, 경력, 강점을 자세히 적어주세요"
                    rows={6}
                    className={`${inputClass} min-h-[140px] py-3 resize-none`}
                    value={formData.bio}
                    onChange={handleChange}
                    maxLength={500}
                  />
                  <p className="mt-1 text-right text-[10px] font-medium text-slate-400">{formData.bio.length}/500</p>
                </div>
              </div>
            </div>
          </section>

          {/* 3. 전공 및 과목 */}
          <section className="space-y-6">
            <SectionHeader number="3" title="전공 및 과목" required />
            <div>
              <label className={labelClass}>담당 과목</label>
              <p className="mt-1 text-xs font-medium text-slate-500">
                가르치는 과목을 모두 선택하세요. 대분류를 펼쳐 세부 과목을 고를 수 있어요.
              </p>
              <div className="mt-2">
                <MentorSubjectCheckboxes selected={subjectCodes} onToggle={toggleSubjectCode} />
              </div>
              {/* 저장은 기존 경로 유지: name="subjects" 콤마 결합 code. (mutation이 split→text[]) */}
              <input type="hidden" name="subjects" value={formData.subjects} />
              <input type="hidden" name="tags" value={initial.tags} />
            </div>
          </section>

          {/* 4. 요금제 */}
          <section className="space-y-4">
            <SectionHeader number="4" title="요금제 설정" />
            <p className="text-xs font-medium text-slate-500">
              구독 요금은 멘토가 직접 설정할 수 있어요. 권장 범위를 벗어나면 경고만 표시되고 저장은 가능합니다.
            </p>
            <div className="grid gap-3 sm:grid-cols-3">
              {SUBSCRIBE_PLAN_CATALOG.map((plan) => {
                const rule = mentorSubscriptionPriceRule(plan.tier);
                const rawValue = planPrices[plan.tier] ?? String(rule.recommendedCashKrw);
                const numericValue = Number(rawValue);
                const invalid = !Number.isFinite(numericValue) || numericValue <= 0;
                const outsideGuide = !invalid && isOutsideMentorPriceGuide(numericValue, plan.tier);
                return (
                  <div
                    key={plan.tier}
                    className={`rounded-xl border p-4 ${
                      plan.recommend ? "border-2 border-[#1A56DB] bg-blue-50/30" : "border-slate-200 bg-slate-50/50"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-black text-slate-900">{plan.label}</p>
                        <p className="mt-1 text-[11px] font-semibold text-slate-600">{plan.weeklyLabel}</p>
                      </div>
                      {plan.recommend ? (
                        <span className="rounded-full bg-blue-600 px-2 py-0.5 text-[10px] font-extrabold text-white">
                          추천
                        </span>
                      ) : null}
                    </div>
                    <label className="mt-3 block text-[11px] font-extrabold text-slate-500" htmlFor={priceInputName(plan.tier)}>
                      월 구독 캐시
                    </label>
                    <div className="mt-1.5 flex items-center gap-2">
                      <input
                        id={priceInputName(plan.tier)}
                        name={priceInputName(plan.tier)}
                        type="number"
                        inputMode="numeric"
                        min={1}
                        step={100}
                        className={inputClass}
                        value={rawValue}
                        onChange={(e) => handlePlanPriceChange(plan.tier, e.target.value)}
                      />
                      <span className="shrink-0 text-xs font-bold text-slate-500">캐시</span>
                    </div>
                    <p className="mt-2 text-[10px] font-semibold text-slate-500">
                      권장 {rule.recommendedCashKrw.toLocaleString("ko-KR")} · 범위{" "}
                      {rule.minCashKrw.toLocaleString("ko-KR")}~{rule.maxCashKrw.toLocaleString("ko-KR")}
                    </p>
                    {invalid ? (
                      <p className="mt-2 rounded-lg border border-red-200 bg-red-50 px-2 py-1.5 text-[10px] font-bold text-red-700">
                        1캐시 이상 입력해 주세요.
                      </p>
                    ) : outsideGuide ? (
                      <p className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-2 py-1.5 text-[10px] font-bold text-amber-800">
                        권장 범위 밖이에요. 그래도 저장할 수 있어요.
                      </p>
                    ) : null}
                  </div>
                );
              })}
            </div>

            {/* 개별 질문 답변 단가 — 구독 요금제와 별개 */}
            <div className="rounded-xl border-2 border-dashed border-blue-200 bg-blue-50/40 p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-black text-slate-900">개별 질문 답변 단가</p>
                <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-bold text-blue-600 ring-1 ring-blue-100">
                  구독과 별개
                </span>
              </div>
              <p className="mt-1 text-xs font-medium text-slate-500">
                학생이 나를 지정해 보내는 단건(지정형) 개별 질문의 답변 단가예요. 구독 요금제와 무관하며, 자유롭게 설정할 수 있어요.
                비워 두면 지정형 개별 질문을 받지 않습니다.
              </p>
              <label
                className="mt-3 block text-[11px] font-extrabold text-slate-500"
                htmlFor="individualQuestionPriceCash"
              >
                답변 단가 (캐시)
              </label>
              <div className="mt-1.5 flex max-w-xs items-center gap-2">
                <input
                  id="individualQuestionPriceCash"
                  name="individualQuestionPriceCash"
                  type="number"
                  inputMode="numeric"
                  min={1}
                  step={100}
                  placeholder="예: 5000"
                  className={inputClass}
                  value={individualQuestionPrice}
                  onChange={(e) => setIndividualQuestionPrice(e.target.value)}
                />
                <span className="shrink-0 text-xs font-bold text-slate-500">캐시</span>
              </div>
            </div>
          </section>

          {/* 5. 인증 서류 */}
          <section className="space-y-4">
            <SectionHeader number="5" title="인증 서류" />
            <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4">
              <p className="text-sm font-bold text-slate-800">
                학생증 업로드 상태:{" "}
                <span className="text-[#1A56DB]">{mentorVerificationKo(initial.verification)}</span>
              </p>
              {initial.photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={initial.photoUrl}
                  alt="학생증 미리보기"
                  className="mt-3 max-h-40 rounded-lg border object-contain"
                />
              ) : (
                <p className="mt-2 text-xs font-medium text-slate-500">아직 업로드된 학생증이 없어요.</p>
              )}
              <Link
                href="/mentor/verification"
                className="mt-3 inline-block text-xs font-bold text-[#1A56DB] hover:underline"
              >
                인증 서류 제출하기 &gt;
              </Link>
            </div>
            {formData.subOpen ? <input type="hidden" name="subscribeOpen" value="on" /> : null}
          </section>

          {/* 6. 대표 콘텐츠 설정 */}
          <section className="space-y-6">
            <SectionHeader number="6" title="대표 콘텐츠 설정" optional />
            
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <button 
                type="button" 
                disabled
                className="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 p-6 opacity-75 cursor-not-allowed"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-slate-100">
                  <LayoutGrid className="h-6 w-6 text-slate-400" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-bold text-slate-700">커뮤니티 게시글 추가</p>
                  <p className="mt-1 text-[11px] font-medium text-slate-400">작성한 글을 대표 콘텐츠로 등록</p>
                </div>
                <div className="mt-2 flex items-center gap-1 rounded-lg bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-500">
                  <Plus className="h-3 w-3" /> 준비 중
                </div>
              </button>

              <button 
                type="button" 
                disabled
                className="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 p-6 opacity-75 cursor-not-allowed"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-slate-100">
                  <Video className="h-6 w-6 text-slate-400" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-bold text-slate-700">숏폼 영상 추가</p>
                  <p className="mt-1 text-[11px] font-medium text-slate-400">업로드한 숏폼을 대표 콘텐츠로 등록</p>
                </div>
                <div className="mt-2 flex items-center gap-1 rounded-lg bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-500">
                  <Plus className="h-3 w-3" /> 준비 중
                </div>
              </button>
            </div>
            
            <p className="text-[11px] font-medium text-slate-400 text-center bg-slate-50 py-2 rounded-lg border border-slate-100 border-dashed">
              대표 콘텐츠 연결 기능은 준비 중입니다. (게시글 및 숏폼 선택 기능)
            </p>

            <div className="rounded-xl border border-slate-100 bg-white p-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-500">현재 등록된 대표 콘텐츠 ({query.media.rows.length})</h4>
              </div>
              {query.media.rows.length > 0 ? (
                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {query.media.rows.map((r, i) => (
                    <div key={i} className="group relative aspect-video overflow-hidden rounded-lg bg-slate-100 ring-1 ring-slate-200 transition hover:ring-blue-500">
                      <div className="absolute inset-0 flex items-center justify-center bg-black/5">
                        <PlayCircle className="h-8 w-8 text-white/80" />
                      </div>
                      <button type="button" className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/50 text-white opacity-0 transition group-hover:opacity-100">
                        <Plus className="h-3 w-3 rotate-45" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-4 flex flex-col items-center justify-center rounded-lg border border-slate-50 bg-slate-50/30 py-10">
                  <p className="text-xs font-medium text-slate-400">등록된 콘텐츠가 없습니다. 위 버튼을 통해 추가해주세요.</p>
                </div>
              )}
            </div>
          </section>

          <div className="flex items-center gap-3 rounded-xl bg-blue-50/50 p-4">
            <Info className="h-5 w-5 text-blue-500" />
            <p className="text-xs font-bold text-blue-800">입력한 정보는 프로필(채널)에 공개되며, 언제든지 수정할 수 있습니다.</p>
          </div>

          <div className="flex items-center justify-between gap-4 pt-6">
            <button type="button" className="min-h-[52px] flex-1 rounded-xl border border-slate-200 bg-white px-8 text-sm font-extrabold text-slate-600 transition hover:bg-slate-50">
              취소
            </button>
            <FormSubmitButton
              idleLabel="저장하기"
              pendingLabel="저장 중…"
              className="min-h-[52px] flex-[2] rounded-xl bg-blue-600 px-8 text-sm font-extrabold text-white shadow-md transition hover:bg-blue-700 disabled:bg-slate-300"
            />
            <p className="hidden text-[11px] font-bold text-slate-400 sm:block">변경 사항은 저장 즉시 반영됩니다.</p>
          </div>
        </div>

        {/* Right Column: Preview */}
        <div className="lg:col-span-5">
          <div className="sticky top-10 space-y-6">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black text-slate-900">학생에게 보여지는 프로필 미리보기</h2>
              <HelpCircle className="h-4 w-4 text-slate-300" />
            </div>
            <p className="text-sm font-medium text-slate-500">실제 학생들이 보는 화면이에요.</p>

            {/* Preview Card */}
            <MentorPublicProfilePreviewCard
              variant="preview"
              display={previewDisplay}
              stats={{ mediaCount: query.media.rows.length, byTier: query.byTier }}
              mediaPreviewSlots={query.media.rows.length}
              footerNote="실제 학생에게 보이는 공개 프로필과 동일한 요약입니다."
            />
          </div>
        </div>
      </form>
    </div>
  );
}
