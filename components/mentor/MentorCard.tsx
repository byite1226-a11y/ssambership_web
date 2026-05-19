"use client";

import Link from "next/link";
import type { MentorPublicListCard } from "@/lib/mentor/publicMentorsListQueries";
import { MentorPublicProfilePreviewCard } from "@/components/mentor/MentorPublicProfilePreviewCard";

export function MentorCard(props: { card: MentorPublicListCard }) {
  const { card } = props;
  const questionHref = `/login/student?next=${encodeURIComponent("/question-room")}`;

  return (
    <article className="flex h-full min-w-0 flex-col">
      <MentorPublicProfilePreviewCard
        variant="compact"
        display={card.display}
        stats={{
          avgRating: card.avgRating,
          reviewCount: card.reviewCount,
          priceLabel: card.priceLabel,
          byTier: card.byTier,
        }}
        className="flex-1 shadow-sm transition hover:border-slate-300 hover:shadow-md"
      />

      <div className="mt-3 flex min-w-0 flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
        <Link
          href={`/mentors/${card.mentorId}`}
          className="inline-flex min-h-[44px] w-full flex-1 items-center justify-center rounded-xl bg-[#142d61] px-4 text-sm font-extrabold text-white transition hover:bg-[#0f2349] sm:w-auto sm:min-w-[8.5rem]"
        >
          프로필 보기
        </Link>
        <Link
          href={questionHref}
          className="inline-flex min-h-[44px] w-full flex-1 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-extrabold text-slate-800 transition hover:border-slate-300 hover:bg-slate-50 sm:w-auto sm:min-w-[8.5rem]"
        >
          질문하기
        </Link>
        {card.display.subOpen ? (
          <Link
            href={`/subscribe?mentorId=${encodeURIComponent(card.mentorId)}`}
            className="inline-flex min-h-[40px] w-full items-center justify-center rounded-xl border border-slate-200 px-4 text-xs font-extrabold text-slate-700 transition hover:bg-slate-50 sm:w-auto sm:min-w-[8.5rem]"
          >
            구독 보기
          </Link>
        ) : (
          <span className="inline-flex min-h-[40px] w-full items-center justify-center rounded-xl border border-dashed border-slate-200 px-4 text-xs font-semibold text-slate-400 sm:w-auto sm:min-w-[8.5rem]">
            공개 준비 중
          </span>
        )}
      </div>
    </article>
  );
}
