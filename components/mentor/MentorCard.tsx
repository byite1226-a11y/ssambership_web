import Link from "next/link";
import type { MentorPublicListCard } from "@/lib/mentor/publicMentorsListQueries";

export function MentorCard(props: { card: MentorPublicListCard }) {
  const { card } = props;
  const d = card.display;
  const ver = d.verification.trim();
  const ratingStr = card.avgRating != null ? card.avgRating.toFixed(2) : "—";
  const reviewStr = card.reviewCount != null ? String(card.reviewCount) : "—";

  return (
    <article className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h2 className="text-lg font-black text-slate-900">{d.displayName}</h2>
          <p className="text-xs text-slate-500">상태: {card.userStatus}</p>
        </div>
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-bold ${
            ver ? "bg-emerald-50 text-emerald-800" : "bg-slate-100 text-slate-600"
          }`}
          title="mentor_profiles.verification_status"
        >
          {ver ? `인증: ${ver}` : "인증 미입력"}
        </span>
      </div>

      <dl className="mt-3 space-y-1.5 text-sm">
        <div className="flex gap-2">
          <dt className="w-20 shrink-0 font-extrabold text-slate-500">대학</dt>
          <dd className="font-bold text-slate-800">{d.university || "—"}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="w-20 shrink-0 font-extrabold text-slate-500">과</dt>
          <dd className="font-bold text-slate-800">{d.department || "—"}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="w-20 shrink-0 font-extrabold text-slate-500">과목</dt>
          <dd className="line-clamp-2 font-bold text-slate-800">{d.subjects || "—"}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="w-20 shrink-0 font-extrabold text-slate-500">고교</dt>
          <dd className="font-bold text-slate-800">{d.highSchool || "—"}</dd>
        </div>
      </dl>

      <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-slate-700">{d.intro || "대표 소개 없음"}</p>

      <p className="mt-2 text-xs font-bold text-slate-600">
        평점 <span className="text-slate-900">{ratingStr}</span> · 리뷰{" "}
        <span className="text-slate-900">{reviewStr}</span>
      </p>
      {d.tags ? (
        <p className="mt-1 text-xs text-slate-500">
          태그: <span className="font-bold text-slate-800">{d.tags}</span>
        </p>
      ) : null}

      <p className="mt-2 text-sm font-extrabold text-slate-900">
        가격: {card.priceLabel ?? "(plans / Standard 매칭 대기)"}
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        <Link
          href={`/mentors/${card.mentorId}`}
          className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-bold text-white hover:bg-blue-500"
        >
          프로필 보기
        </Link>
      </div>
    </article>
  );
}
