export function MentorSearchBar(props: { defaultValue: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <label className="block text-xs font-extrabold uppercase tracking-wide text-slate-500">검색</label>
      <input
        type="search"
        name="q"
        defaultValue={props.defaultValue}
        placeholder="이름, 학교, 과목, 소개, 태그…"
        className="mt-1.5 min-h-[44px] w-full rounded-lg border border-slate-300 px-3 py-2.5 text-base font-bold text-slate-900 sm:text-sm"
      />
      <p className="mt-1.5 text-xs leading-relaxed text-slate-500">서버에서 필터됩니다. 결과가 없으면 단어를 줄이거나 필터를 초기화해 보세요.</p>
    </div>
  );
}
