"use client";

import { FormSubmitButton } from "@/components/qna/FormSubmitButton";
import { submitMentorProfileEdit } from "@/lib/mentor/mentorProfileEditActions";
import { mentorVerificationKo } from "@/lib/mentor/mentorDisplayFields";
import { USER_UI_LOAD_FAILED } from "@/lib/constants/userFacingMessages";

type Q = { row: Record<string, unknown> | null; err: string | null; media: { table: string | null; error: string | null } };
type I = { intro: string; university: string; department: string; subjects: string; highSchool: string; tags: string; subOpen: boolean; photoUrl: string; verification: string };

export function MentorProfileEditForm(props: {
  initial: I;
  query: Q;
  accountEmail?: string | null;
  ok: boolean;
  errorMessage: string | null;
}) {
  const { initial, query, ok, errorMessage, accountEmail } = props;

  return (
    <form action={submitMentorProfileEdit} className="max-w-4xl mx-auto space-y-6 rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm pb-12">
      {/* Alert states */}
      {ok ? (
        <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-900">
          성공적으로 저장되었습니다.
        </p>
      ) : null}
      {errorMessage ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-900">
          {errorMessage}
        </p>
      ) : null}

      {/* Account Info Bar */}
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-4">
        {accountEmail ? (
          <p className="min-w-0 max-w-full break-all text-xs font-semibold text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100 sm:max-w-[50%]">
            로그인 계정: {accountEmail}
          </p>
        ) : (
          <div />
        )}
        {query.row ? (
          <p className="min-w-0 max-w-full flex-1 text-xs font-semibold text-slate-500 bg-blue-50/50 px-3 py-1.5 rounded-lg border border-blue-100 sm:text-right sm:max-w-[50%]">
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

      {query.err && !query.row ? <p className="text-sm font-bold text-amber-900 bg-amber-50 p-3 rounded-xl border border-amber-200">{USER_UI_LOAD_FAILED}</p> : null}

      {/* Intro */}
      <div className="space-y-1.5">
        <label className="block text-sm font-bold text-slate-800">
          자기소개
        </label>
        <textarea
          name="intro"
          rows={4}
          placeholder="학생들에게 전할 간단한 인사를 입력해 주세요."
          className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm font-medium text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all placeholder:text-slate-400"
          defaultValue={initial.intro}
        />
      </div>

      {/* Education info in 2 columns */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label className="block text-sm font-bold text-slate-800">
            대학교
          </label>
          <input
            name="university"
            placeholder="예: 서울대학교"
            className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm font-medium text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all placeholder:text-slate-400"
            defaultValue={initial.university}
          />
        </div>
        <div className="space-y-1.5">
          <label className="block text-sm font-bold text-slate-800">
            과(학과)
          </label>
          <input
            name="department"
            placeholder="예: 경영학과"
            className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm font-medium text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all placeholder:text-slate-400"
            defaultValue={initial.department}
          />
        </div>
      </div>

      {/* Additional Profile Info */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label className="block text-sm font-bold text-slate-800">
            과목 (쉼표로 구분)
          </label>
          <input
            name="subjects"
            placeholder="예: 수학, 영어, 과학"
            className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm font-medium text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all placeholder:text-slate-400"
            defaultValue={initial.subjects}
          />
        </div>
        <div className="space-y-1.5">
          <label className="block text-sm font-bold text-slate-800">
            출신 고등학교
          </label>
          <input
            name="highSchool"
            placeholder="예: 강남고등학교"
            className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm font-medium text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all placeholder:text-slate-400"
            defaultValue={initial.highSchool}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="block text-sm font-bold text-slate-800">
          대표 태그 (쉼표로 구분)
        </label>
        <input
          name="tags"
          placeholder="예: 족집게, 수시전문, 고3전담"
          className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm font-medium text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all placeholder:text-slate-400"
          defaultValue={initial.tags}
        />
      </div>

      {/* Guide Cards */}
      <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 space-y-2">
        <p className="text-sm font-extrabold text-slate-800">대표 콘텐츠 연결 및 채널</p>
        <p className="text-xs text-slate-500 leading-relaxed">
          숏폼·게시판 등에서 등록한 대표 콘텐츠가 연결되면 채널 화면에 정렬되어 표시됩니다. 등록된 대표 콘텐츠가 없으면 목록이 비어 있을 수 있으니 저장 후 채널 메뉴에서 확인해 주세요.
        </p>
      </div>

      <div className="flex flex-col gap-3 pt-2">
        <label className="flex items-center gap-3 select-none text-sm font-bold text-slate-800">
          <input
            type="checkbox"
            name="subscribeOpen"
            value="on"
            className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500/20"
            defaultChecked={initial.subOpen}
          />
          멤버십 구독을 받을 수 있게 공개합니다
        </label>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">
        <FormSubmitButton
          idleLabel="프로필 저장하기"
          pendingLabel="저장 중…"
          className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white enabled:hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-slate-300 transition-colors shadow-sm"
        />
      </div>
    </form>
  );
}
