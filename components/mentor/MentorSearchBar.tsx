export function MentorSearchBar(props: { defaultValue: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <label className="block text-xs font-extrabold uppercase tracking-wide text-slate-500">검색</label>
      <input
        type="search"
        name="q"
        defaultValue={props.defaultValue}
        placeholder="이름, 학교, 과목, 소개, 태그…"
        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-bold text-slate-900"
      />
      <p className="mt-1 text-xs text-slate-500">클라이언트 필터 없음 · GET /mentors?q=… (subjects taxonomy 연동은 후속)</p>
    </div>
  );
}
