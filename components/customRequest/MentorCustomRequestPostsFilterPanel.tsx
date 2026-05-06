/**
 * 멘토 «새 의뢰 목록» 우측 필터 패널 — 레이아웃·시각 정렬용.
 * 검색/필터 쿼리 연동은 추후(현재 입력은 비활성).
 */
export function MentorCustomRequestPostsFilterPanel() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-4 py-3 sm:px-5">
        <h3 className="text-sm font-extrabold text-slate-900">검색·필터</h3>
        <p className="mt-1 text-xs leading-relaxed text-slate-500">연결 전까지는 접어 두었어요. 목록은 페이지 본문에서 먼저 확인해 주세요.</p>
      </div>
      <details className="group px-4 pb-4 pt-3 sm:px-5">
        <summary className="cursor-pointer list-none text-xs font-bold text-blue-800 underline-offset-2 hover:underline [&::-webkit-details-marker]:hidden">
          <span className="inline-flex items-center gap-2">
            자리표시 필터 펼치기
            <span className="font-normal text-slate-400 group-open:hidden">▼</span>
            <span className="hidden font-normal text-slate-400 group-open:inline">▲</span>
          </span>
        </summary>
        <div className="mt-4 space-y-4">
          <label className="block">
            <span className="text-xs font-extrabold uppercase tracking-wide text-slate-500">검색</span>
            <input
              type="search"
              disabled
              placeholder="의뢰 제목·키워드"
              className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500"
            />
          </label>
          <div>
            <span className="text-xs font-extrabold uppercase tracking-wide text-slate-500">카테고리</span>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {["전체", "학습", "입시", "기타"].map((t) => (
                <span
                  key={t}
                  className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-500"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
          <label className="block">
            <span className="text-xs font-extrabold uppercase tracking-wide text-slate-500">학교급</span>
            <select disabled className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500">
              <option>전체</option>
            </select>
          </label>
          <label className="block">
            <span className="text-xs font-extrabold uppercase tracking-wide text-slate-500">희망 전공</span>
            <input
              type="text"
              disabled
              placeholder="예: 수학, 국어"
              className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500"
            />
          </label>
          <label className="block">
            <span className="text-xs font-extrabold uppercase tracking-wide text-slate-500">예산</span>
            <input
              type="text"
              disabled
              placeholder="범위 선택 예정"
              className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500"
            />
          </label>
          <label className="block">
            <span className="text-xs font-extrabold uppercase tracking-wide text-slate-500">마감일</span>
            <input
              type="text"
              disabled
              placeholder="기간 선택 예정"
              className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500"
            />
          </label>
          <div className="flex gap-2 pt-1">
            <button type="button" disabled className="min-h-[40px] flex-1 rounded-xl bg-blue-600 px-3 text-sm font-bold text-white opacity-45">
              적용
            </button>
            <button
              type="button"
              disabled
              className="min-h-[40px] flex-1 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-600 opacity-45"
            >
              초기화
            </button>
          </div>
        </div>
      </details>
    </div>
  );
}
