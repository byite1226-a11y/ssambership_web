import Link from "next/link";
import type { MentorPublicListCard } from "@/lib/mentor/publicMentorsListQueries";

function subjectChips(text: string, max = 4): string[] {
  if (!text.trim()) return [];
  return text
    .split(/[,，、·]/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
    .slice(0, max);
}

function initialName(name: string): string {
  const t = name.trim();
  if (!t) return "멘";
  return t.slice(0, 1);
}

export function MentorCard(props: { card: MentorPublicListCard }) {
  const { card } = props;
  const d = card.display;
  const ver = d.verification.trim();
  const ratingStr = card.avgRating != null ? card.avgRating.toFixed(1) : "—";
  const reviewStr = card.reviewCount != null ? String(card.reviewCount) : "—";
  const chips = subjectChips(d.subjects || d.tags);
  const priceLine = card.priceLabel?.trim() || "표시 가능한 요금 없음(준비 중)";

  return (
    <article className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md">
      <div className="flex min-w-0 gap-3 p-4 sm:p-5">
        <div
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 text-lg font-black text-slate-700"
          aria-hidden
        >
          {initialName(d.displayName)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h2 className="text-base font-black leading-snug text-slate-900 sm:text-lg">{d.displayName}</h2>
            <span
              className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold sm:text-xs ${
                ver ? "bg-emerald-50 text-emerald-800" : "bg-slate-100 text-slate-600"
              }`}
            >
              {ver || "인증·준비"}
            </span>
          </div>
          <p className="mt-0.5 text-xs text-slate-500">상태: {card.userStatus}</p>
        </div>
      </div>

      <div className="space-y-2 border-t border-slate-100 px-4 py-3 sm:px-5">
        <p className="text-sm font-bold text-slate-800">
          {d.university && d.department
            ? `${d.university} · ${d.department}`
            : d.university || d.department || "학교·학과 정보 없음(준비 중)"}
        </p>
        {chips.length > 0 ? (
          <ul className="flex flex-wrap gap-1.5">
            {chips.map((c) => (
              <li
                key={c}
                className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-bold text-slate-800 sm:text-xs"
              >
                {c}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-slate-500">과목·태그를 표시할 수 없어요(데이터 없음)</p>
        )}
      </div>

      <p className="line-clamp-3 min-h-[3.5rem] border-t border-slate-100 px-4 text-sm leading-relaxed text-slate-700 sm:px-5">
        {d.intro?.trim() ? d.intro : "대표 소개가 아직 없어요."}
      </p>

      <div className="grid grid-cols-2 gap-2 border-t border-slate-100 px-4 py-3 sm:px-5">
        <div className="rounded-lg bg-slate-50 px-2 py-1.5 text-center sm:px-3">
          <p className="text-[11px] font-extrabold uppercase tracking-wide text-slate-500">평점</p>
          <p className="text-sm font-black text-slate-900 sm:text-base">{ratingStr}</p>
        </div>
        <div className="rounded-lg bg-slate-50 px-2 py-1.5 text-center sm:px-3">
          <p className="text-[11px] font-extrabold uppercase tracking-wide text-slate-500">리뷰</p>
          <p className="text-sm font-black text-slate-900 sm:text-base">{reviewStr}</p>
        </div>
        <div className="col-span-2 rounded-lg border border-dashed border-slate-200 bg-slate-50/80 px-2 py-1.5 text-center sm:px-3">
          <p className="text-[11px] font-extrabold text-slate-500">답변율</p>
          <p className="text-xs font-bold text-slate-500">준비 중</p>
        </div>
      </div>

      <div className="mt-auto border-t border-slate-100 px-4 py-2 sm:px-5">
        <p className="text-sm font-extrabold text-slate-900">{priceLine}</p>
      </div>

      <div className="grid grid-cols-1 gap-2 border-t border-slate-100 p-4 sm:grid-cols-2 sm:p-5">
        <span
          className="inline-flex min-h-[44px] cursor-not-allowed select-none items-center justify-center rounded-lg border border-slate-200 bg-slate-50 px-2 text-center text-xs font-bold text-slate-400"
          title="다음에 제공될 예정이에요"
          role="status"
        >
          찜 (준비 중)
        </span>
        <Link
          href={`/mentors/${card.mentorId}`}
          className="inline-flex min-h-[44px] items-center justify-center rounded-lg bg-blue-600 px-3 text-sm font-bold text-white hover:bg-blue-500"
        >
          프로필 보기
        </Link>
        {d.subOpen ? (
          <Link
            href={`/subscribe?mentorId=${encodeURIComponent(card.mentorId)}`}
            className="col-span-1 inline-flex min-h-[44px] w-full items-center justify-center rounded-lg border border-blue-200 bg-blue-50 px-3 text-sm font-bold text-blue-800 hover:bg-blue-100 sm:col-span-2"
          >
            구독 알아보기
          </Link>
        ) : null}
      </div>
    </article>
  );
}
