"use client";

import type { ReactNode } from "react";
import { FormSubmitButton } from "@/components/qna/FormSubmitButton";
import { submitMentorProfileEdit } from "@/lib/mentor/mentorProfileEditActions";
import { mentorVerificationKo } from "@/lib/mentor/mentorDisplayFields";
import { USER_UI_LOAD_FAILED } from "@/lib/constants/userFacingMessages";

type Q = { row: Record<string, unknown> | null; err: string | null; media: { table: string | null; error: string | null } };
type I = { intro: string; university: string; department: string; subjects: string; highSchool: string; tags: string; subOpen: boolean; photoUrl: string; verification: string };

const inputClass =
  "min-h-[48px] w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-700 placeholder:text-slate-400 transition focus:border-blue-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/30";

const labelClass = "block text-sm font-extrabold text-slate-900";
const helperClass = "mt-1 block text-xs font-medium text-slate-500";

function SectionCard(props: { id: string; title: string; description?: string; children: ReactNode }) {
  return (
    <section
      id={props.id}
      className="rounded-3xl border border-slate-200/90 bg-white p-5 shadow-sm ring-1 ring-slate-900/[0.02] sm:p-6 md:p-7"
      aria-labelledby={`${props.id}-title`}
    >
      <div className="border-b border-slate-100 pb-4">
        <h2 id={`${props.id}-title`} className="text-lg font-black text-slate-900">
          {props.title}
        </h2>
        {props.description ? <p className="mt-1 text-sm font-medium text-slate-500">{props.description}</p> : null}
      </div>
      <div className="pt-6 space-y-5">{props.children}</div>
    </section>
  );
}

export function MentorProfileEditForm(props: {
  initial: I;
  query: Q;
  accountEmail?: string | null;
  ok: boolean;
  errorMessage: string | null;
}) {
  const { initial, query, ok, errorMessage, accountEmail } = props;

  return (
    <form action={submitMentorProfileEdit} className="mx-auto w-full max-w-5xl space-y-6 px-1 pb-28 sm:space-y-8 sm:px-0 sm:pb-32">
      {ok ? (
        <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-900">성공적으로 저장되었습니다.</p>
      ) : null}
      {errorMessage ? (
        <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-900">{errorMessage}</p>
      ) : null}

      {/* 상단 상태 요약 */}
      <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-50 to-blue-50/30 p-5 shadow-sm sm:p-6">
        <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-blue-800/80">저장 상태</p>
        <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1 space-y-2">
            {accountEmail ? (
              <p className="break-all rounded-xl border border-white/80 bg-white/90 px-3 py-2 text-xs font-semibold text-slate-600">
                로그인 계정: {accountEmail}
              </p>
            ) : null}
            {query.row ? (
              <p className="rounded-xl border border-blue-100 bg-white/90 px-3 py-2 text-xs font-semibold text-slate-700">
                멘토 인증: <span className="font-bold text-blue-700">{mentorVerificationKo(initial.verification)}</span>
                {" · "}
                학생증 자료:{" "}
                {initial.photoUrl ? (
                  <a className="font-bold text-blue-600 hover:underline" href={initial.photoUrl} target="_blank" rel="noreferrer">
                    등록됨 (보기)
                  </a>
                ) : (
                  <span className="font-bold text-slate-400">없음</span>
                )}
              </p>
            ) : null}
          </div>
          <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700">
            대표 콘텐츠: {query.media.table ? "채널에서 연결됨" : "연결된 항목 없음"}
          </div>
        </div>
      </div>

      {query.err && !query.row ? (
        <p className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-bold text-amber-900">{USER_UI_LOAD_FAILED}</p>
      ) : null}

      <SectionCard id="edit-intro" title="1. 기본 소개" description="학생에게 가장 먼저 보이는 소개입니다.">
        <div>
          <label className={labelClass} htmlFor="field-intro">
            자기소개
          </label>
          <span className={helperClass}>간단한 인사와 강점을 적어 주세요.</span>
          <textarea
            id="field-intro"
            name="intro"
            rows={5}
            placeholder="학생들에게 전할 간단한 인사를 입력해 주세요."
            className="mt-2 min-h-[8rem] w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm font-medium text-slate-700 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/30"
            defaultValue={initial.intro}
          />
        </div>
      </SectionCard>

      <SectionCard id="edit-education" title="2. 학력·전공" description="신뢰도에 가장 큰 영향을 줍니다.">
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className={labelClass} htmlFor="field-university">
              대학교
            </label>
            <span className={helperClass}>예: 서울대학교</span>
            <input
              id="field-university"
              name="university"
              placeholder="예: 서울대학교"
              className={`mt-2 ${inputClass}`}
              defaultValue={initial.university}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="field-department">
              과(학과)
            </label>
            <span className={helperClass}>예: 경영학과</span>
            <input
              id="field-department"
              name="department"
              placeholder="예: 경영학과"
              className={`mt-2 ${inputClass}`}
              defaultValue={initial.department}
            />
          </div>
        </div>
        <div>
          <label className={labelClass} htmlFor="field-highSchool">
            출신 고등학교
          </label>
          <span className={helperClass}>선택적으로 입력할 수 있어요.</span>
          <input
            id="field-highSchool"
            name="highSchool"
            placeholder="예: 강남고등학교"
            className={`mt-2 ${inputClass}`}
            defaultValue={initial.highSchool}
          />
        </div>
      </SectionCard>

      <SectionCard id="edit-subjects" title="3. 과목·태그" description="쉼표로 구분해 입력합니다.">
        <div>
          <label className={labelClass} htmlFor="field-subjects">
            과목 (쉼표로 구분)
          </label>
          <span className={helperClass}>예: 수학, 영어, 과학</span>
          <input
            id="field-subjects"
            name="subjects"
            placeholder="예: 수학, 영어, 과학"
            className={`mt-2 ${inputClass}`}
            defaultValue={initial.subjects}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="field-tags">
            대표 태그 (쉼표로 구분)
          </label>
          <span className={helperClass}>예: 족집게, 수시전문, 고3전담</span>
          <input
            id="field-tags"
            name="tags"
            placeholder="예: 족집게, 수시전문, 고3전담"
            className={`mt-2 ${inputClass}`}
            defaultValue={initial.tags}
          />
        </div>
      </SectionCard>

      <SectionCard id="edit-media" title="4. 대표 콘텐츠 연결" description="채널에서 등록한 콘텐츠가 공개 화면에 반영됩니다.">
        <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
          <p className="text-sm font-extrabold text-slate-800">대표 콘텐츠 연결 및 채널</p>
          <p className="mt-2 text-xs leading-relaxed text-slate-600">
            숏폼·게시판 등에서 등록한 대표 콘텐츠가 연결되면 채널 화면에 정렬되어 표시됩니다. 등록된 대표 콘텐츠가 없으면 목록이 비어 있을 수 있으니 저장 후 채널 메뉴에서 확인해 주세요.
          </p>
        </div>
      </SectionCard>

      <SectionCard id="edit-visibility" title="5. 공개 설정" description="구독을 받을지 여부를 설정합니다.">
        <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50/60 p-4 transition hover:bg-slate-50">
          <input
            type="checkbox"
            name="subscribeOpen"
            value="on"
            className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500/20"
            defaultChecked={initial.subOpen}
          />
          <span className="text-sm font-bold text-slate-800">멤버십 구독을 받을 수 있게 공개합니다</span>
        </label>
      </SectionCard>

      {/* 6. 저장 — 하단 고정 풋터 느낌 */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 bg-white/95 px-4 py-4 shadow-[0_-8px_30px_rgba(15,23,42,0.08)] backdrop-blur sm:px-6">
        <div className="mx-auto flex w-full max-w-5xl flex-col items-stretch justify-between gap-3 sm:flex-row sm:items-center">
          <p className="text-center text-xs font-medium text-slate-500 sm:text-left">변경 사항은 저장 후 공개 프로필에 반영됩니다.</p>
          <FormSubmitButton
            idleLabel="프로필 저장하기"
            pendingLabel="저장 중…"
            className="min-h-[52px] w-full rounded-2xl bg-gradient-to-r from-blue-600 to-violet-600 px-8 text-sm font-extrabold text-white shadow-md transition enabled:hover:from-blue-700 enabled:hover:to-violet-700 disabled:cursor-not-allowed disabled:bg-slate-300 sm:w-auto sm:min-w-[12rem]"
          />
        </div>
      </div>
    </form>
  );
}
