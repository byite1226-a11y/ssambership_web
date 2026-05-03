"use client";

import Link from "next/link";
import { useState } from "react";
import type { MentorPublicListCard } from "@/lib/mentor/publicMentorsListQueries";
import { mentorVerificationKo } from "@/lib/mentor/mentorDisplayFields";

function subjectChips(text: string, max = 5): string[] {
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
  const [photoFailed, setPhotoFailed] = useState(false);
  const verKo = mentorVerificationKo(d.verification);
  const chipClass =
    /완료|승인/i.test(verKo) || /verified|approved/i.test(d.verification ?? "")
      ? "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200"
      : /검토|대기|미등록|pending|review/i.test(verKo) || /pending|review/i.test(d.verification ?? "")
        ? "bg-amber-50 text-amber-900 ring-1 ring-amber-200"
        : "bg-slate-100 text-slate-700 ring-1 ring-slate-200";

  const ratingLabel =
    card.avgRating != null && Number.isFinite(card.avgRating) ? card.avgRating.toFixed(1) : "—";
  const reviewLabel =
    card.reviewCount != null && Number.isFinite(card.reviewCount) ? `${card.reviewCount}건` : "집계 전";
  const chips = subjectChips(d.subjects || d.tags);
  const schoolLine =
    d.university && d.department
      ? `${d.university} · ${d.department}`
      : d.university || d.department || "학교·전공 준비 중";
  const introLines = d.intro?.trim() ? d.intro.trim() : "한 줄 소개는 준비 중이에요.";
  const hasPrice = Boolean(card.priceLabel && card.priceLabel.trim().length > 0);
  const photo = d.photoUrl?.trim();

  const questionHref = `/login/student?next=${encodeURIComponent(`/question-room`)}`;

  return (
    <article className="group flex h-full min-w-0 flex-col overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-[0_2px_14px_rgba(15,23,42,0.06)] transition hover:border-sky-200/80 hover:shadow-lg">
      <div className="flex flex-1 flex-col gap-4 p-4 sm:p-5">
        <div className="flex gap-4">
          <div className="relative h-16 w-16 shrink-0 sm:h-[4.5rem] sm:w-[4.5rem]">
            {photo && !photoFailed ? (
              // eslint-disable-next-line @next/next/no-img-element -- Supabase 등 외부 URL, 별도 remotePatterns 없이 표시
              <img
                src={photo}
                alt=""
                className="h-full w-full rounded-full border border-slate-200 object-cover"
                onError={() => setPhotoFailed(true)}
              />
            ) : (
              <div
                className="flex h-full w-full items-center justify-center rounded-full border-2 border-slate-200 bg-gradient-to-br from-slate-100 to-slate-200 text-xl font-black text-slate-700"
                aria-hidden
              >
                {initialName(d.displayName)}
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-black tracking-tight text-slate-900 sm:text-xl">{d.displayName}</h2>
              <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-extrabold sm:text-xs ${chipClass}`}>{verKo}</span>
            </div>
            <p className="mt-1 text-sm font-bold text-slate-800">{schoolLine}</p>
            <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-slate-600">{introLines}</p>
            {chips.length > 0 ? (
              <ul className="mt-3 flex flex-wrap gap-1.5">
                {chips.map((c) => (
                  <li
                    key={c}
                    className="rounded-lg border border-sky-100 bg-sky-50/90 px-2 py-1 text-[11px] font-bold text-sky-950"
                  >
                    {c}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-xs font-medium text-slate-500">과목·태그는 준비 중이에요</p>
            )}
          </div>
        </div>

        <div className="grid min-w-0 grid-cols-3 gap-2 rounded-xl border border-slate-100 bg-slate-50/80 p-3 text-center sm:text-left">
          <div className="min-w-0">
            <p className="text-[10px] font-extrabold uppercase tracking-wide text-slate-500">평점</p>
            <p className="mt-0.5 min-h-[1.5rem] text-base font-black tabular-nums text-slate-900">{ratingLabel}</p>
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-extrabold uppercase tracking-wide text-slate-500">리뷰</p>
            <p className="mt-0.5 min-h-[1.5rem] text-base font-black tabular-nums text-slate-900">{reviewLabel}</p>
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-extrabold uppercase tracking-wide text-slate-500">답변율</p>
            <p className="mt-0.5 min-h-[1.5rem] text-sm font-bold text-slate-500">준비 중</p>
          </div>
        </div>

        <div className="rounded-xl border border-blue-100/80 bg-gradient-to-r from-blue-50/60 to-white px-3 py-2.5">
          <p className="text-[10px] font-extrabold uppercase tracking-wide text-blue-800/80">대표 플랜</p>
          <p className="mt-0.5 text-base font-black text-slate-900">
            {hasPrice ? card.priceLabel : "가격·플랜 준비 중"}
          </p>
        </div>
      </div>

      <div className="mt-auto flex min-w-0 flex-col gap-2 border-t border-slate-100 bg-slate-50/50 p-4 sm:flex-row sm:flex-wrap sm:items-stretch sm:justify-end sm:gap-3 sm:px-5">
        <Link
          href={`/mentors/${card.mentorId}`}
          className="inline-flex min-h-[48px] w-full min-w-0 flex-1 items-center justify-center rounded-xl bg-blue-600 px-4 text-sm font-extrabold text-white shadow-sm transition hover:bg-blue-700 sm:w-auto sm:max-w-[13rem]"
        >
          프로필 보기
        </Link>
        <div className="flex min-w-0 w-full flex-1 flex-col gap-2 sm:w-auto sm:max-w-[13rem] sm:flex-none">
          <Link
            href={questionHref}
            className="inline-flex min-h-[48px] w-full items-center justify-center rounded-xl border-2 border-slate-300 bg-white px-4 text-sm font-extrabold text-slate-800 transition hover:border-blue-300 hover:bg-blue-50/50"
          >
            질문하기
          </Link>
          {d.subOpen ? (
            <Link
              href={`/subscribe?mentorId=${encodeURIComponent(card.mentorId)}`}
              className="inline-flex min-h-[44px] w-full items-center justify-center rounded-xl border border-blue-200 bg-blue-50/90 text-xs font-extrabold text-blue-900 transition hover:bg-blue-100"
            >
              구독·결제 보기
            </Link>
          ) : null}
        </div>
      </div>
    </article>
  );
}
