"use client";

import Link from "next/link";
import { BadgeCheck, Camera } from "lucide-react";
import { MentorFavoriteButton } from "@/components/mentor/MentorFavoriteButton";
import type { MentorPublicListCard } from "@/lib/mentor/publicMentorsListQueries";
import {
  mentorIntroFallback,
  mentorIsVerified,
  mentorSchoolGradeLine,
  mentorSubjectChips,
} from "@/lib/mentor/mentorPublicProfileDisplay";

export function MentorCard(props: {
  card: MentorPublicListCard;
  isLoggedIn: boolean;
  isFavorited: boolean;
}) {
  const { card, isLoggedIn } = props;
  const d = card.display;
  const verified = mentorIsVerified(d.verification);
  const chips = mentorSubjectChips(d.subjects || d.tags, 4);
  const intro = mentorIntroFallback(d.intro);
  const photo = d.photoUrl?.trim();
  const profileHref = `/mentors/${card.mentorId}`;

  const statItems = [
    { label: "?? ??", value: card.stats.totalAnswers != null ? `${card.stats.totalAnswers}` : "?" },
    { label: "?? ??", value: card.stats.connectedStudents != null ? `${card.stats.connectedStudents}` : "?" },
    { label: "?? ??", value: card.stats.avgResponseLabel },
    { label: "???", value: card.stats.satisfactionLabel },
  ];

  return (
    <article className="relative flex h-full min-w-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:border-slate-300 hover:shadow-md">
      <MentorFavoriteButton
        mentorId={card.mentorId}
        initialFavorited={props.isFavorited}
        isLoggedIn={isLoggedIn}
        loginNext={`/mentors/${card.mentorId}`}
      />

      <div className="p-5 pb-4">
        <div className="flex gap-4">
          <div className="h-[72px] w-[72px] shrink-0 overflow-hidden rounded-full border-2 border-white bg-slate-100 shadow ring-1 ring-slate-100">
            {photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photo} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-slate-300">
                <Camera className="h-7 w-7" aria-hidden />
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1 pt-1 pr-8">
            <div className="flex flex-wrap items-center gap-1.5">
              <h3 className="truncate text-[16px] font-black text-slate-900">{d.displayName}</h3>
              {verified ? (
                <span className="inline-flex items-center gap-0.5 rounded-md bg-[#1A56DB] px-1.5 py-0.5 text-[10px] font-black text-white">
                  <BadgeCheck className="h-3 w-3" />
                  ??
                </span>
              ) : null}
            </div>
            <p className="mt-1 text-[12px] font-medium text-slate-600">{mentorSchoolGradeLine(d)}</p>
          </div>
        </div>

        {chips.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {chips.map((c) => (
              <span
                key={c}
                className="rounded-md border border-[#1A56DB]/45 bg-white px-2 py-0.5 text-[10px] font-bold text-[#1A56DB]"
              >
                {c}
              </span>
            ))}
          </div>
        ) : null}

        <p className="mt-3 line-clamp-2 text-[12px] font-medium leading-relaxed text-slate-600">{intro}</p>

        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {statItems.map((s) => (
            <div key={s.label} className="rounded-lg bg-slate-50 px-2 py-2 text-center">
              <p className="text-[9px] font-bold text-slate-500">{s.label}</p>
              <p className="mt-0.5 text-[12px] font-black text-slate-900">{s.value}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mx-5 border-t border-slate-100" />

      <div className="space-y-1.5 px-5 py-4">
        {card.tierPrices.map((t) => (
          <div key={t.tier} className="flex items-center justify-between text-[11px]">
            <span className="font-bold text-slate-600">{t.label}</span>
            <span className="font-black text-slate-900">{t.cashLabel}</span>
          </div>
        ))}
      </div>

      <div className="mt-auto border-t border-slate-100 p-4">
        <Link
          href={profileHref}
          className="flex min-h-[44px] w-full items-center justify-center rounded-xl bg-[#1A56DB] px-4 text-sm font-extrabold text-white transition hover:bg-[#1648c0]"
        >
          ??? ??
        </Link>
      </div>
    </article>
  );
}
