/**
 * 멘토 «새 의뢰 목록» 우측 필터 패널
 * 기준 이미지 req_10에 맞춘 UI 구조:
 *   - 검색창 (의뢰 제목 또는 키워드)
 *   - 카테고리 체크박스 (전체, 공부/과제, 진로/입시, 자기소개서, 기타)
 *   - 학교급 체크박스 (전체, 고1, 고2, 고3, N수 및 기타)
 *   - 희망 전공 드롭다운
 *   - 예산 금액 범위
 *   - 마감일
 *   - 적용/초기화 버튼
 */
export function MentorCustomRequestPostsFilterPanel() {
  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-100">
        <h3 className="text-[14px] font-black text-slate-900">검색 및 필터</h3>
      </div>

      <div className="p-5 space-y-5">
        {/* 검색 */}
        <div className="relative">
          <input
            type="search"
            placeholder="의뢰 제목 또는 키워드 검색"
            className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 pr-9 text-[13px] text-slate-700 placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
          <svg
            className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400"
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        {/* 카테고리 */}
        <div>
          <p className="mb-2 text-[12px] font-bold text-slate-700">카테고리</p>
          <ul className="space-y-1.5">
            {[
              { label: "전체", defaultChecked: true },
              { label: "공부/과제" },
              { label: "진로/입시" },
              { label: "자기소개서" },
              { label: "기타" },
            ].map(({ label, defaultChecked }) => (
              <li key={label} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id={`cat-${label}`}
                  defaultChecked={!!defaultChecked}
                  className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor={`cat-${label}`} className="cursor-pointer text-[13px] text-slate-700">
                  {label}
                </label>
              </li>
            ))}
          </ul>
        </div>

        {/* 학교급 */}
        <div>
          <p className="mb-2 text-[12px] font-bold text-slate-700">학교급</p>
          <ul className="space-y-1.5">
            {[
              { label: "전체", defaultChecked: true },
              { label: "고1" },
              { label: "고2" },
              { label: "고3" },
              { label: "N수 및 기타" },
            ].map(({ label, defaultChecked }) => (
              <li key={label} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id={`grade-${label}`}
                  defaultChecked={!!defaultChecked}
                  className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor={`grade-${label}`} className="cursor-pointer text-[13px] text-slate-700">
                  {label}
                </label>
              </li>
            ))}
          </ul>
        </div>

        {/* 희망 전공 */}
        <div>
          <label htmlFor="major-filter" className="mb-2 block text-[12px] font-bold text-slate-700">
            희망 전공
          </label>
          <select
            id="major-filter"
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-[13px] text-slate-600 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option>전체 선택</option>
            <option>이공계</option>
            <option>인문사회계</option>
            <option>예체능</option>
            <option>의약계</option>
            <option>기타</option>
          </select>
        </div>

        {/* 예산 금액 (캐시) */}
        <div>
          <p className="mb-2 text-[12px] font-bold text-slate-700">예상 금액 (캐시)</p>
          <div className="flex items-center gap-2">
            <input
              type="number"
              placeholder="최소 금액"
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-[13px] placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
            <span className="text-slate-400 text-[12px] font-medium shrink-0">~</span>
            <input
              type="number"
              placeholder="최대 금액"
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-[13px] placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
        </div>

        {/* 마감일 */}
        <div>
          <label htmlFor="deadline-filter" className="mb-2 block text-[12px] font-bold text-slate-700">
            마감일
          </label>
          <select
            id="deadline-filter"
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-[13px] text-slate-600 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option>전체</option>
            <option>오늘 마감</option>
            <option>3일 이내</option>
            <option>7일 이내</option>
            <option>2주 이내</option>
          </select>
        </div>

        {/* 적용/초기화 버튼 */}
        <div className="space-y-2 pt-1">
          <button
            type="button"
            className="w-full rounded-lg bg-blue-600 py-2.5 text-[13px] font-bold text-white hover:bg-blue-700 transition shadow-sm"
          >
            적용하기
          </button>
          <button
            type="button"
            className="w-full rounded-lg border border-slate-200 bg-white py-2.5 text-[13px] font-bold text-slate-600 hover:bg-slate-50 transition"
          >
            초기화
          </button>
        </div>
      </div>
    </div>
  );
}
