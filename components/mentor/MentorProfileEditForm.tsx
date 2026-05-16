"use client";

import { useState, type ReactNode } from "react";
import { FormSubmitButton } from "@/components/qna/FormSubmitButton";
import { submitMentorProfileEdit } from "@/lib/mentor/mentorProfileEditActions";
import { mentorVerificationKo } from "@/lib/mentor/mentorDisplayFields";
import { USER_UI_LOAD_FAILED } from "@/lib/constants/userFacingMessages";
import { Camera, ChevronRight, HelpCircle, RotateCcw, PlayCircle, Info, LayoutGrid, Video, Plus } from "lucide-react";

type Q = { 
  row: Record<string, unknown> | null; 
  err: string | null; 
  media: { rows: Record<string, unknown>[]; table: string | null; error: string | null } 
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
};

const inputClass =
  "min-h-[48px] w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-700 placeholder:text-slate-400 transition focus:border-blue-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/30";

const labelClass = "flex items-center gap-1.5 text-sm font-extrabold text-slate-900";

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const val = type === "checkbox" ? (e.target as HTMLInputElement).checked : value;
    setFormData((prev) => ({ ...prev, [name]: val }));
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
          <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">멘토 총 프로필 관리</h1>
          <p className="mt-2 text-sm font-medium text-slate-500">학생들이 나를 더 잘 이해할 수 있도록 정보를 입력하고 관리해보세요.</p>
        </div>
        <div className="flex items-center gap-4">
          <p suppressHydrationWarning className="text-xs font-medium text-slate-400">마지막 저장: {lastSavedStr}</p>
          <button type="button" className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 shadow-sm transition hover:bg-slate-50">
            <RotateCcw className="h-3.5 w-3.5" />
            미리보기 새로고침
          </button>
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
                    <label className={labelClass} htmlFor="nickname">닉네임</label>
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
                    <label className={labelClass} htmlFor="grade">학년 <span className="ml-0.5 text-red-500">*</span></label>
                    <div className="relative mt-1.5">
                      <select
                        id="grade"
                        name="grade"
                        className={`${inputClass} appearance-none pr-10`}
                        value={formData.grade}
                        onChange={handleChange}
                      >
                        <option value="">학년 선택</option>
                        <option value="1학년">1학년</option>
                        <option value="2학년">2학년</option>
                        <option value="3학년">3학년</option>
                        <option value="4학년">4학년</option>
                        <option value="졸업">졸업</option>
                      </select>
                      <ChevronRight className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 rotate-90 text-slate-400" />
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
                    maxLength={60}
                  />
                </div>
              </div>

              <div>
                <label className={labelClass} htmlFor="bio">자기소개 <span className="ml-0.5 text-red-500">*</span></label>
                <div className="relative mt-1.5">
                  <textarea
                    id="bio"
                    name="bio"
                    placeholder="자세한 자기소개를 입력해주세요"
                    rows={4}
                    className={`${inputClass} min-h-[120px] py-3 resize-none`}
                    value={formData.bio}
                    onChange={handleChange}
                    maxLength={300}
                  />
                </div>
              </div>
            </div>
          </section>

          {/* 4. 대표 콘텐츠 설정 */}
          <section className="space-y-6">
            <SectionHeader number="4" title="대표 콘텐츠 설정" optional />
            
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <button 
                type="button" 
                className="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 p-6 transition hover:border-blue-200 hover:bg-blue-50/30"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-slate-100">
                  <LayoutGrid className="h-6 w-6 text-slate-400" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-bold text-slate-700">커뮤니티 게시글 추가</p>
                  <p className="mt-1 text-[11px] font-medium text-slate-400">작성한 글을 대표 콘텐츠로 등록</p>
                </div>
                <div className="mt-2 flex items-center gap-1 rounded-lg bg-white px-2 py-1 text-[10px] font-bold text-blue-600 ring-1 ring-slate-100">
                  <Plus className="h-3 w-3" /> 선택하기
                </div>
              </button>

              <button 
                type="button" 
                className="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 p-6 transition hover:border-indigo-200 hover:bg-indigo-50/30"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-slate-100">
                  <Video className="h-6 w-6 text-slate-400" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-bold text-slate-700">숏폼 영상 추가</p>
                  <p className="mt-1 text-[11px] font-medium text-slate-400">업로드한 숏폼을 대표 콘텐츠로 등록</p>
                </div>
                <div className="mt-2 flex items-center gap-1 rounded-lg bg-white px-2 py-1 text-[10px] font-bold text-indigo-600 ring-1 ring-slate-100">
                  <Plus className="h-3 w-3" /> 선택하기
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

            {/* Preview Card Mockup */}
            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl ring-1 ring-slate-900/5">
              {/* Header Gradient */}
              <div className="h-32 bg-gradient-to-br from-blue-100 via-indigo-100 to-violet-100" />
              
              <div className="relative px-6 pb-8">
                {/* Profile Pic overlapping header */}
                <div className="-mt-12 mb-4 h-24 w-24 overflow-hidden rounded-3xl border-4 border-white bg-white shadow-lg">
                  {initial.photoUrl ? (
                    <img src={initial.photoUrl} alt="Preview" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-slate-100 text-slate-300">
                      <Camera className="h-8 w-8" />
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="text-xl font-black text-slate-900">{formData.nickname || "닉네임 미입력"}</h3>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {formData.department && (
                        <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-[10px] font-bold text-blue-600 ring-1 ring-blue-100">
                          {formData.department}
                        </span>
                      )}
                      {formData.university && (
                        <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-[10px] font-bold text-blue-600 ring-1 ring-blue-100">
                          {formData.university}
                        </span>
                      )}
                      {formData.highSchool && (
                        <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-[10px] font-bold text-blue-600 ring-1 ring-blue-100">
                          {formData.highSchool}
                        </span>
                      )}
                    </div>
                    <p className="mt-3 text-xs font-bold leading-relaxed text-blue-600/80">
                      {formData.intro || "소개글이 없습니다."}
                    </p>
                  </div>

                  <div className="grid grid-cols-3 gap-1 border-y border-slate-50 py-4">
                    <div className="flex flex-col items-center gap-1.5 text-center">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-50 shadow-inner">
                        <svg className="h-4.5 w-4.5 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-[10px] font-black text-slate-800 leading-tight">{formData.university || "미입력"}</p>
                        <p className="text-[9px] font-bold text-slate-400 leading-tight">{formData.department || "전공 미입력"}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-center gap-1.5 text-center">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-50 shadow-inner">
                        <svg className="h-4.5 w-4.5 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-[10px] font-black text-slate-800 leading-tight">{formData.highSchool || "미입력"}</p>
                        <p className="text-[9px] font-bold text-slate-400 leading-tight">고등학교</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-center gap-1.5 text-center">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-50 shadow-inner">
                        <svg className="h-4.5 w-4.5 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="5"/><path d="M20 21a8 8 0 1 0-16 0"/></svg>
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-[10px] font-black text-slate-800 leading-tight">{formData.grade || "학년 정보 없음"}</p>
                        <p className="text-[9px] font-bold text-slate-400 leading-tight">재학 상태</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="text-xs font-black text-slate-900">소개</h4>
                    <p className="text-[11px] leading-relaxed text-slate-600">
                      {formData.intro || "소개글이 없습니다."}
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-black text-slate-900">대표 콘텐츠 <HelpCircle className="inline h-3 w-3 text-slate-300" /></h4>
                    </div>
                    {query.media.rows.length > 0 ? (
                      <div className="grid grid-cols-3 gap-2">
                        {query.media.rows.slice(0, 3).map((r, i) => (
                          <div key={i} className="group relative aspect-video overflow-hidden rounded-lg bg-slate-100 shadow-sm ring-1 ring-slate-200">
                            <div className="absolute inset-0 flex items-center justify-center bg-black/5 transition group-hover:bg-black/10">
                              <PlayCircle className="h-6 w-6 text-white/90" />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[10px] font-medium text-slate-400">등록된 대표 콘텐츠가 없습니다.</p>
                    )}
                  </div>

                  <div className="space-y-3 pt-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-black text-slate-900">학생 리뷰</h4>
                      </div>
                    </div>
                    <p className="text-[10px] font-medium text-slate-400">아직 받은 리뷰가 없습니다.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
