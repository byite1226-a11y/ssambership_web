import type { MentorPublicListCard } from "@/lib/mentor/publicMentorsListQueries";

function popularSubjectsFromCards(cards: MentorPublicListCard[], limit = 10): string[] {
  const counts = new Map<string, number>();
  for (const c of cards) {
    const raw = [c.display.subjects, c.display.tags, c.display.department]
      .filter((s) => s && s.trim().length > 0)
      .join(",");
    for (const part of raw.split(/[,，、·]/)) {
      const t = part.trim();
      if (t.length < 2 || t.length > 32) continue;
      counts.set(t, (counts.get(t) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([k]) => k);
}

/**
 * 멘토 목록 우측: 안내, 찜(미연결), 인기 키워드 — 더미 멘토 없이 실제 카드에서만 집계.
 */
export function MentorsListSidebar(props: { cards: MentorPublicListCard[] }) {
  const popular = popularSubjectsFromCards(props.cards);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-gradient-to-b from-slate-50 to-white p-4 shadow-sm">
        <h2 className="text-sm font-extrabold text-slate-900">이용 안내</h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          필터와 검색으로 멘토를 좁힌 뒤, 카드에서 <span className="font-bold text-slate-800">프로필</span>로 이동해
          상세·구독을 이어갈 수 있어요. 비로그인도 둘러볼 수 있고, 구독·질문은 로그인 후에 안내됩니다.
        </p>
        <p className="mt-2 text-xs text-slate-500">목록이 비어 있으면 공개 데이터·정책(준비)에 따라 표시가 달라질 수 있어요.</p>
      </div>

      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 p-4">
        <h2 className="text-sm font-extrabold text-slate-900">찜한 멘토</h2>
        <p className="mt-1.5 text-sm text-slate-600">
          찜·하트·알림은 아직 연결되지 않았어요. <span className="font-bold text-slate-700">준비 중</span>입니다.
        </p>
        <span
          className="mt-3 inline-flex w-full items-center justify-center rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-bold text-slate-400"
          title="다음 릴리스에서 제공할 예정입니다"
          role="status"
        >
          ♥ 찜하기 (준비 중)
        </span>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-sm font-extrabold text-slate-900">인기 과목·태그</h2>
        <p className="mt-0.5 text-xs text-slate-500">현재 목록에 보이는 멘토에서만 합쳤어요</p>
        {popular.length === 0 ? (
          <p className="mt-3 text-sm text-slate-600">표시할 수 있는 인기 키워드가 없어요. 멘토가 늘어나면 나타납니다.</p>
        ) : (
          <ul className="mt-3 flex flex-wrap gap-2">
            {popular.map((p) => (
              <li
                key={p}
                className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-bold text-slate-800"
              >
                {p}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
