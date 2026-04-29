export function MentorSearchBar(props: { defaultValue: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm sm:p-3.5">
      <label className="block text-xs font-extrabold uppercase tracking-wide text-slate-500">검색</label>
      <input
        type="search"
        name="q"
        defaultValue={props.defaultValue}
        placeholder="이름, 학교, 과목, 소개, 태그…"
        className="mt-1 min-h-[40px] w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-bold text-slate-900"
      />
      <p className="mt-1.5 text-[11px] leading-relaxed text-slate-500 sm:text-xs">필터와 함께 적용돼요. 안 나오면 단어를 짧게 해 보세요.</p>
    </div>
  );
}
