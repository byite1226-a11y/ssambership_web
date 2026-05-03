import Link from "next/link";
import type { MentorPublicListCard } from "@/lib/mentor/publicMentorsListQueries";

function popularSubjectsFromCards(cards: MentorPublicListCard[], limit = 12): string[] {
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
 * 멘토 목록 우측: 안내, 인기 태그, CTA — 더미 멘토 없이 실제 카드에서만 집계.
 */
export function MentorsListSidebar(props: { cards: MentorPublicListCard[] }) {
  const popular = popularSubjectsFromCards(props.cards);

  return (
    <div className="rounded-3xl border border-slate-200/90 bg-white p-4 shadow-[0_4px_24px_rgba(15,23,42,0.06)] sm:p-5">
      <div className="space-y-5">
      <div className="rounded-2xl border border-blue-100/80 bg-gradient-to-br from-blue-600 to-indigo-700 p-5 text-white shadow-md sm:p-5">
        <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-white/80">시작하기</p>
        <h2 className="mt-2 text-xl font-black leading-tight">멘토와 연결해 보세요</h2>
        <p className="mt-2 text-sm font-medium leading-relaxed text-blue-50">
          프로필에서 구독·질문방으로 이어질 수 있어요. 학생 계정으로 로그인하면 질문방이 열려요.
        </p>
        <div className="mt-5 flex flex-col gap-2">
          <Link
            href={`/login/student?next=${encodeURIComponent("/mentors")}`}
            className="inline-flex min-h-[48px] items-center justify-center rounded-xl bg-white px-4 text-sm font-extrabold text-blue-800 shadow-sm transition hover:bg-blue-50"
          >
            학생 로그인
          </Link>
          <Link
            href="/question-room"
            className="inline-flex min-h-[48px] items-center justify-center rounded-xl border-2 border-white/40 px-4 text-sm font-extrabold text-white transition hover:bg-white/10"
          >
            내 질문방
          </Link>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200/90 bg-slate-50/50 p-4 sm:p-5">
        <h2 className="text-sm font-black text-slate-900">이용 안내</h2>
        <p className="mt-3 text-sm leading-relaxed text-slate-600">
          왼쪽에서 조건을 좁힌 뒤, 카드의 <span className="font-bold text-slate-900">프로필 보기</span>로 상세·요금제를 확인하세요.
          구독이 열린 멘토는 카드에서 바로 <span className="font-bold text-slate-900">구독·결제</span>로 이동할 수 있어요.
        </p>
        <p className="mt-2 text-xs font-medium text-slate-500">목록은 서비스 상황에 따라 달라질 수 있어요.</p>
      </div>

      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/90 p-4 sm:p-5">
        <h2 className="text-sm font-black text-slate-900">찜한 멘토</h2>
        <p className="mt-2 text-sm text-slate-600">
          찜·알림은 아직 연결되지 않았어요. <span className="font-bold text-slate-800">준비 중</span>입니다.
        </p>
        <span
          className="mt-4 inline-flex w-full min-h-[44px] items-center justify-center rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-bold text-slate-400"
          title="다음 릴리스에서 제공할 예정입니다"
          role="status"
        >
          ♥ 찜하기 (준비 중)
        </span>
      </div>

      <div className="rounded-2xl border border-slate-200/90 bg-slate-50/50 p-4 sm:p-5">
        <h2 className="text-sm font-black text-slate-900">인기 과목·태그</h2>
        <p className="mt-1 text-xs font-medium text-slate-500">현재 목록에 보이는 멘토에서만 합쳤어요</p>
        {popular.length === 0 ? (
          <p className="mt-4 text-sm text-slate-600">표시할 수 있는 인기 키워드가 없어요.</p>
        ) : (
          <ul className="mt-4 flex flex-wrap gap-2">
            {popular.map((p) => (
              <li
                key={p}
                className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-extrabold text-slate-800"
              >
                {p}
              </li>
            ))}
          </ul>
        )}
      </div>
      </div>
    </div>
  );
}
