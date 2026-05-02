"use client";

import { FormSubmitButton } from "@/components/qna/FormSubmitButton";
import { submitMentorProfileEdit } from "@/lib/mentor/mentorProfileEditActions";
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
    <form action={submitMentorProfileEdit} className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5">
      {ok ? <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-bold text-emerald-900">저장되었습니다.</p> : null}
      {errorMessage ? <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-bold text-red-900">{errorMessage}</p> : null}
      {accountEmail ? <p className="text-xs text-slate-500">로그인 계정: {accountEmail}</p> : null}
      {query.err && !query.row ? <p className="text-sm font-bold text-amber-900">{USER_UI_LOAD_FAILED}</p> : null}
      {query.row ? (
        <p className="text-xs text-slate-500">
          verification: <span className="font-bold text-slate-800">{initial.verification || "—"}</span> · student_id_image_url(학생증): {initial.photoUrl || "—"}
        </p>
      ) : null}

      <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50/60 p-3 text-sm text-slate-600">
        프로필(대표) 이미지: 업로드/Storage(후속). 현재:
        {initial.photoUrl ? (
          <a className="ml-1 font-mono text-xs text-blue-700 hover:underline" href={initial.photoUrl} target="_blank" rel="noreferrer">
            {initial.photoUrl}
          </a>
        ) : (
          " 없음"
        )}
        <input type="file" disabled className="mt-1 block w-full text-xs" />
      </div>

      <label className="block text-sm font-extrabold text-slate-800">
        소개
        <textarea name="intro" rows={3} className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-1.5" defaultValue={initial.intro} />
      </label>
      <div className="grid gap-2 sm:grid-cols-2">
        <label className="text-sm font-extrabold text-slate-800">
          대학교
          <input name="university" className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-1.5" defaultValue={initial.university} />
        </label>
        <label className="text-sm font-extrabold text-slate-800">
          과(학과)
          <input name="department" className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-1.5" defaultValue={initial.department} />
        </label>
      </div>
      <label className="block text-sm font-extrabold text-slate-800">
        과목(콤마 구분 — teaching_subjects)
        <input name="subjects" className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-1.5" defaultValue={initial.subjects} />
      </label>
      <label className="block text-sm font-extrabold text-slate-800">
        출신 고등학교
        <input name="highSchool" className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-1.5" defaultValue={initial.highSchool} />
      </label>
      <label className="block text-sm font-extrabold text-slate-800">
        대표 태그(콤마 구분)
        <input name="tags" className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-1.5" defaultValue={initial.tags} />
      </label>

      <div className="rounded-lg border border-slate-200 bg-slate-50/80 p-3">
        <p className="text-sm font-extrabold text-slate-800">대표 콘텐츠 연결</p>
        <p className="text-xs text-slate-500">
          숏폼·게시판에서 등록한 대표 콘텐츠가 연결되면 채널 화면에 표시됩니다. 테이블이 준비되기 전에는 목록이 비어 있을 수 있어요.
        </p>
        <p className="text-xs text-slate-500">저장 후 채널 메뉴에서 목록을 확인해 주세요.</p>
      </div>

      <label className="flex items-center gap-2 text-sm text-slate-800">
        <input type="checkbox" name="subscribeOpen" value="on" defaultChecked={initial.subOpen} />
        구독(멤버십) 가능 상태(스키마 컬럼: accepts_subscriptions 등, 후보 upsert)
      </label>

      <FormSubmitButton
        idleLabel="저장"
        pendingLabel="저장 중…"
        className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-bold text-white enabled:hover:bg-emerald-500 disabled:cursor-not-allowed disabled:bg-slate-300"
      />
    </form>
  );
}
