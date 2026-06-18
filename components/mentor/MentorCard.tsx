"use client";

import Link from "next/link";
import { BadgeCheck, Camera } from "lucide-react";
import { MentorFavoriteButton } from "@/components/mentor/MentorFavoriteButton";
import { listCardClassName } from "@/components/design-system/ListCard";
import type { MentorPublicListCard } from "@/lib/mentor/publicMentorsListQueries";
import {
  mentorIntroFallback,
  mentorIsVerified,
  mentorSchoolGradeLine,
  mentorSubjectChips,
} from "@/lib/mentor/mentorPublicProfileDisplay";

function formatStatLine(card: MentorPublicListCard): string {
  const parts: string[] = [];
  const sat = card.stats.satisfactionLabel;
  if (sat && sat !== "—") parts.push(`답변 만족도 ${sat}`);
  const resp = card.stats.avgResponseLabel;
  if (resp && resp !== "—") parts.push(`평균 답변 시간 ${resp}`);
  const ans = card.stats.totalAnswers;
  if (ans != null) parts.push(`누적 답변 ${ans.toLocaleString("ko-KR")}개`);
  return parts.length ? parts.join(" · ") : "통계 준비 중";
}

export function MentorCard(props: {
  card: MentorPublicListCard;
  isLoggedIn: boolean;
  isFavorited: boolean;
  layout?: "list" | "grid";
}) {
  const { card, isLoggedIn } = props;
  const layout = props.layout ?? "list";
  const d = card.display;
  const verified = mentorIsVerified(d.verification);
  const chips = mentorSubjectChips(d.subjects || d.tags, 6);
  const intro = mentorIntroFallback(d.intro);
  const photo = d.photoUrl?.trim();
  const profileHref = `/mentors/${card.mentorId}`;
  const subscribeHref = `/subscribe?mentorId=${encodeURIComponent(card.mentorId)}`;
  const closed = card.subscriptionClosed;

  if (layout === "grid") {
    return (
      <article className={listCardClassName("neutral", true, "relative flex h-full min-w-0 flex-col overflow-hidden p-0")}>
        <MentorFavoriteButton
          mentorId={card.mentorId}
          initialFavorited={props.isFavorited}
          isLoggedIn={isLoggedIn}
          loginNext={profileHref}
          className="right-3 top-3"
        />
        <div className="p-5">
          <div className="flex gap-3">
            <div className="relative h-16 w-16 shrink-0">
              <div className="h-16 w-16 overflow-hidden rounded-full border-2 border-white bg-blue-50 shadow ring-1 ring-slate-100">
                {photo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={photo} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-blue-300">
                    <Camera className="h-6 w-6" aria-hidden />
                  </div>
                )}
              </div>
            </div>
            <div className="min-w-0 flex-1 pr-6">
              <div className="flex flex-wrap items-center gap-1">
                <h3 className="truncate text-base font-black text-slate-900">{d.displayName}</h3>
                {verified ? (
                  <span className="inline-flex items-center gap-0.5 rounded-md bg-[#1A56DB] px-1.5 py-0.5 text-[10px] font-black text-white">
                    <BadgeCheck className="h-3 w-3" />
                    인증
                  </span>
                ) : null}
                {closed ? (
                  <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-black text-slate-500">
                    구독 마감
                  </span>
                ) : null}
              </div>
              <p className="mt-0.5 text-xs font-medium text-slate-600">{mentorSchoolGradeLine(d)}</p>
            </div>
          </div>
          {chips.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-1">
              {chips.slice(0, 4).map((c) => (
                <span
                  key={c}
                  className="rounded-md border border-[#1A56DB]/40 bg-white px-1.5 py-0.5 text-[10px] font-bold text-[#1A56DB]"
                >
                  {c}
                </span>
              ))}
            </div>
          ) : null}
          <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-slate-600">{intro}</p>
          <p className="mt-3 text-[11px] font-semibold text-slate-500">{formatStatLine(card)}</p>
          <div className="mt-3 space-y-1 border-t border-slate-100 pt-3">
            {card.tierPrices.map((t) => (
              <div key={t.tier} className="flex justify-between text-[11px]">
                <span className="font-bold text-slate-600">
                  {t.label}
                  {t.recommend ? (
                    <span className="ml-1 rounded bg-[#1A56DB] px-1 py-px text-[9px] text-white">추천</span>
                  ) : null}
                </span>
                <span className="font-black text-slate-900">{t.cashLabel}</span>
              </div>
            ))}
          </div>
          <Link
            href={profileHref}
            className="mt-4 flex min-h-[40px] w-full items-center justify-center rounded-xl bg-[#1A56DB] text-sm font-extrabold text-white hover:bg-[#1648c0]"
          >
            프로필 보기
          </Link>
        </div>
      </article>
    );
  }

  return (
    <article className={listCardClassName("neutral", true, "relative overflow-hidden p-0")}>
      <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-stretch sm:gap-5 sm:p-5">
        <div className="relative shrink-0 sm:w-[88px]">
          <div className="mx-auto h-20 w-20 overflow-hidden rounded-full border-2 border-white bg-blue-50 shadow ring-1 ring-slate-100 sm:mx-0">
            {photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photo} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-blue-300">
                <Camera className="h-8 w-8" aria-hidden />
              </div>
            )}
          </div>
          <MentorFavoriteButton
            mentorId={card.mentorId}
            initialFavorited={props.isFavorited}
            isLoggedIn={isLoggedIn}
            loginNext={profileHref}
            className="!right-auto !top-auto !left-1/2 !-bottom-1 -translate-x-1/2 sm:!left-auto sm:!right-0 sm:!top-0 sm:translate-x-0"
          />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <Link href={profileHref} className="truncate text-lg font-black text-slate-900 hover:text-[#1A56DB]">
              {d.displayName}
            </Link>
            {verified ? (
              <span className="inline-flex items-center gap-0.5 rounded-md bg-[#1A56DB] px-1.5 py-0.5 text-[10px] font-black text-white">
                <BadgeCheck className="h-3 w-3" aria-hidden />
                인증
              </span>
            ) : null}
            {closed ? (
              <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-black text-slate-500">
                구독 마감
              </span>
            ) : null}
          </div>
          <p className="mt-0.5 text-sm font-medium text-slate-600">{mentorSchoolGradeLine(d)}</p>

          {chips.length > 0 ? (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {chips.map((c) => (
                <span
                  key={c}
                  className="rounded-md border border-[#1A56DB]/40 bg-white px-2 py-0.5 text-[10px] font-bold text-[#1A56DB]"
                >
                  {c}
                </span>
              ))}
            </div>
          ) : null}

          <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-slate-600">{intro}</p>
          <p className="mt-2 text-xs font-semibold text-slate-500">{formatStatLine(card)}</p>
        </div>

        <div className="w-full shrink-0 border-t border-slate-100 pt-4 sm:w-[240px] sm:border-t-0 sm:border-l sm:pl-5 sm:pt-0 lg:w-[280px]">
          <p className="text-[11px] font-extrabold uppercase tracking-wide text-slate-500">구독 요금제</p>
          <ul className="mt-2 space-y-2.5">
            {card.tierPrices.map((t) => (
              <li
                key={t.tier}
                className={`rounded-lg border px-2.5 py-2 ${
                  t.recommend ? "border-blue-200 bg-blue-50/60" : "border-slate-200 bg-white"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-black text-slate-800">
                    {t.label}
                    {t.recommend ? (
                      <span className="ml-1 rounded bg-[#1A56DB] px-1.5 py-px text-[9px] font-bold text-white">
                        추천
                      </span>
                    ) : null}
                  </span>
                  <span className="text-xs font-black tabular-nums text-slate-900">{t.cashLabel}</span>
                </div>
                <p className="mt-0.5 text-[10px] font-medium leading-snug text-slate-600">
                  {t.weeklyLabel}
                </p>
              </li>
            ))}
          </ul>
          {closed ? (
            <div className="mt-3 flex min-h-[40px] w-full cursor-not-allowed items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-sm font-extrabold text-slate-400">
              구독 마감
            </div>
          ) : (
            <Link
              href={isLoggedIn ? subscribeHref : `/login?next=${encodeURIComponent(subscribeHref)}`}
              className="mt-3 flex min-h-[40px] w-full items-center justify-center rounded-xl border border-[#1A56DB] bg-white text-sm font-extrabold text-[#1A56DB] hover:bg-blue-50"
            >
              구독하기
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}
