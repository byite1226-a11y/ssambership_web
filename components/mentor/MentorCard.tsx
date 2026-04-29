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
  const ratingLabel =
    card.avgRating != null && Number.isFinite(card.avgRating) ? card.avgRating.toFixed(1) : "준비 중";
  const reviewLabel =
    card.reviewCount != null && Number.isFinite(card.reviewCount) ? String(card.reviewCount) : "아직 없음";
  const chips = subjectChips(d.subjects || d.tags);
  const schoolLine =
    d.university && d.department
      ? `${d.university} · ${d.department}`
      : d.university || d.department || "학교·학과 준비 중";
  const introOne = d.intro?.trim() ? d.intro : "한 줄 소개는 준비 중이에요.";
  const hasPrice = Boolean(card.priceLabel && card.priceLabel.trim().length > 0);

  return (
    <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md">
      <div className="flex flex-col gap-4 p-3.5 sm:flex-row sm:items-stretch sm:gap-5 sm:p-4">
        <div className="flex min-w-0 flex-1 gap-3.5 sm:gap-4">
          <div
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-gradient-to-br from-slate-100 to-slate-200 text-lg font-black text-slate-700"
            aria-hidden
          >
            {initialName(d.displayName)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base font-black text-slate-900 sm:text-lg">{d.displayName}</h2>
              {ver ? (
                <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-800 sm:text-xs">
                  인증
                </span>
              ) : (
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-600 sm:text-xs">
                  인증 준비
                </span>
              )}
            </div>
            <p className="mt-1 line-clamp-1 text-sm font-bold text-slate-800">{schoolLine}</p>
            <p className="mt-0.5 line-clamp-2 text-sm text-slate-600">{introOne}</p>
            {chips.length > 0 ? (
              <ul className="mt-2 flex flex-wrap gap-1.5">
                {chips.map((c) => (
                  <li
                    key={c}
                    className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-bold text-slate-800"
                  >
                    {c}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-xs text-slate-500">과목·태그는 준비 중이에요</p>
            )}
          </div>
        </div>

        <div className="flex shrink-0 flex-col justify-between border-t border-slate-100 pt-3 sm:w-[11.5rem] sm:border-l sm:border-t-0 sm:pl-4 sm:pt-0 md:w-52">
          <div>
            <div className="grid grid-cols-3 gap-1.5 text-center sm:grid-cols-1 sm:gap-1 sm:text-left">
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-wide text-slate-500 sm:text-xs">평점</p>
                <p className="text-sm font-black text-slate-900">{ratingLabel}</p>
              </div>
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-wide text-slate-500 sm:text-xs">리뷰</p>
                <p className="text-sm font-black text-slate-900">{reviewLabel}</p>
              </div>
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-wide text-slate-500 sm:text-xs">답변율</p>
                <p className="text-sm font-bold text-slate-600">준비 중</p>
              </div>
            </div>
            <div className="mt-3 min-h-[2.25rem] rounded-lg border border-slate-100 bg-slate-50/90 px-2.5 py-1.5 text-center sm:text-left">
              {hasPrice ? (
                <p className="text-sm font-extrabold text-slate-900">{card.priceLabel}</p>
              ) : (
                <p className="text-sm font-bold text-slate-500">가격·플랜 준비 중</p>
              )}
            </div>
          </div>

          <div className="mt-3 flex flex-col gap-2 sm:mt-4">
            <Link
              href={`/mentors/${card.mentorId}`}
              className="inline-flex min-h-[40px] w-full items-center justify-center rounded-lg bg-blue-600 px-3 text-sm font-bold text-white hover:bg-blue-500"
            >
              프로필 보기
            </Link>
            <span
              className="inline-flex min-h-[40px] w-full cursor-not-allowed select-none items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-sm font-bold text-slate-400"
              title="다음에 제공될 예정이에요"
              role="status"
            >
              찜 (준비 중)
            </span>
            {d.subOpen ? (
              <Link
                href={`/subscribe?mentorId=${encodeURIComponent(card.mentorId)}`}
                className="inline-flex min-h-[40px] w-full items-center justify-center rounded-lg border border-blue-200 bg-blue-50/90 text-sm font-bold text-blue-900 hover:bg-blue-100"
              >
                구독 알아보기
              </Link>
            ) : null}
          </div>
        </div>
      </div>
    </article>
  );
}
