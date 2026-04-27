"use client";

import { FormSubmitButton } from "@/components/qna/FormSubmitButton";
import { submitAdminNoticeDraft } from "@/lib/admin/adminNoticesActions";

type Hints = {
  title: string | null;
  body: string | null;
  type: string | null;
  target: string | null;
  start: string | null;
  end: string | null;
  active: string | null;
} | null;

export function AdminNoticesFormSkeleton(props: { hints: Hints; errorMessage: string | null; ok: boolean; hintTable: string | null }) {
  const { hints, errorMessage, ok, hintTable } = props;
  return (
    <form action={submitAdminNoticeDraft} className="space-y-2 rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
      <h3 className="text-sm font-extrabold text-slate-900">새 항목 (draft insert)</h3>
      {ok ? <p className="text-sm font-bold text-emerald-800">저장/삽입 성공(목록 Revalidate). 상세 id는 쿼리 <code>new=</code> (후속).</p> : null}
      {errorMessage ? <p className="text-sm font-bold text-red-800">{errorMessage}</p> : null}
      {hintTable && hints ? (
        <p className="text-xs text-slate-500">
          컬럼 힌트 ({hintTable}): title→{hints.title ?? "?"}, body→{hints.body ?? "?"}, type→{hints.type ?? "?"}, target→
          {hints.target ?? "?"}, 기간→{hints.start ?? "?"} / {hints.end ?? "?"}, 활성→{hints.active ?? "?"}
        </p>
      ) : (
        <p className="text-xs text-slate-500">notices / promotions 중 읽기 가능한 첫 테이블에 insert(후보만)합니다.</p>
      )}

      <label className="block text-sm font-extrabold text-slate-800">
        제목
        <input name="title" required className="mt-1 w-full rounded border border-slate-200 bg-white px-2 py-1.5" />
      </label>
      <label className="block text-sm font-extrabold text-slate-800">
        본문·배너 문구(요약)
        <textarea name="body" rows={3} className="mt-1 w-full rounded border border-slate-200 bg-white px-2 py-1.5" />
      </label>
      <div className="grid gap-2 sm:grid-cols-2">
        <label className="text-sm font-extrabold text-slate-800">
          유형
          <select name="resource" className="mt-1 w-full rounded border border-slate-200 bg-white px-2 py-1.5" defaultValue="notice">
            <option value="notice">공지</option>
            <option value="promotion">프로모션</option>
          </select>
        </label>
        <label className="text-sm font-extrabold text-slate-800">
          타겟/노출 화면(문자)
          <input name="target" className="mt-1 w-full rounded border border-slate-200 bg-white px-2 py-1.5" placeholder="home, pricing, …" />
        </label>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        <label className="text-sm font-extrabold text-slate-800">
          노출 시작
          <input name="start" type="datetime-local" className="mt-1 w-full rounded border border-slate-200 bg-white px-2 py-1.5" />
        </label>
        <label className="text-sm font-extrabold text-slate-800">
          노출 종료
          <input name="end" type="datetime-local" className="mt-1 w-full rounded border border-slate-200 bg-white px-2 py-1.5" />
        </label>
      </div>
      <label className="flex items-center gap-2 text-sm text-slate-800">
        <input type="checkbox" name="active" value="on" defaultChecked />
        활성(또는 draft/비활성·스키마에 맞는 값으로 후처리)
      </label>
      <FormSubmitButton
        idleLabel="저장(드래프트)"
        pendingLabel="처리 중…"
        className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-bold text-white enabled:hover:bg-slate-800 disabled:bg-slate-300"
      />
    </form>
  );
}
