"use client";

import { Camera, HelpCircle, PlayCircle } from "lucide-react";
import type { MentorProfileDisplay } from "@/lib/mentor/mentorDisplayFields";
import { mentorVerificationKo } from "@/lib/mentor/mentorDisplayFields";
import { getSubscribeCatalogPlan } from "@/lib/subscribe/subscribePlanCatalog";
import { priceLabelFromPlanRow } from "@/lib/subscribe/subscribePageQueries";
import {
  formatMentorPriceLabel,
  formatMentorRatingLabel,
  formatMentorReviewCountLabel,
  mentorHasRealPriceLabel,
  mentorIntroFallback,
  mentorSchoolLine,
  mentorSubjectChips,
  mentorVerificationBadgeClass,
  type MentorPublicProfileStats,
} from "@/lib/mentor/mentorPublicProfileDisplay";

export type MentorPublicProfilePreviewVariant = "preview" | "compact" | "hub";

export type MentorPublicProfilePreviewCardProps = {
  display: MentorProfileDisplay;
  stats?: MentorPublicProfileStats;
  variant?: MentorPublicProfilePreviewVariant;
  mediaPreviewSlots?: number;
  footerNote?: string | null;
  showVerificationBadge?: boolean;
  className?: string;
};

export function MentorPublicProfilePreviewCard(props: MentorPublicProfilePreviewCardProps) {
  const {
    display: d,
    stats = {},
    variant = "preview",
    mediaPreviewSlots = 0,
    footerNote,
    showVerificationBadge = true,
    className = "",
  } = props;

  const isCompact = variant === "compact";
  const isHub = variant === "hub";
  const isDense = isCompact || isHub;

  const intro = mentorIntroFallback(d.intro);
  const chips = mentorSubjectChips(d.subjects || d.tags, isDense ? 4 : 5);
  const verKo = mentorVerificationKo(d.verification);
  const photo = d.photoUrl?.trim();
  const ratingLabel = formatMentorRatingLabel(stats.avgRating);
  const reviewLabel = formatMentorReviewCountLabel(stats.reviewCount);
  // preview(학생 시점 미리보기): 빈 값을 휑하게 두지 않고 신규/0건으로. (공용 포맷터는 미터치)
  const previewRatingText =
    stats.avgRating != null && Number.isFinite(stats.avgRating) ? stats.avgRating.toFixed(1) : "신규";
  const previewReviewText = `${stats.reviewCount ?? 0}건`;
  const priceLabel = formatMentorPriceLabel(stats.priceLabel);
  const showPrice = mentorHasRealPriceLabel(stats.priceLabel);
  const mediaCount = stats.mediaCount ?? 0;

  const bannerH = isDense ? "h-14" : "h-28";
  const avatarSize = isDense ? "h-14 w-14 -mt-8 mb-2 border-2" : "h-24 w-24 -mt-12 mb-4 border-4";
  const padX = isDense ? "px-4 pb-4" : "px-6 pb-8";
  const nameCls = isDense ? "text-base font-black" : "text-xl font-black";
  const introClamp = isHub ? "line-clamp-3" : isCompact ? "line-clamp-2" : "line-clamp-3";
  const cardRadius = "rounded-2xl";
  // preview(프로필 편집 미리보기): 다른 카드와 톤 통일 — 사방 균일 1.5px slate-300 + 옅은 그림자, 좌측 액센트 바 없음.
  // dense(hub/compact)는 기존 외형 유지.
  const shadowCls = isDense ? "shadow-sm" : "shadow-[0_1px_4px_rgba(0,0,0,0.05)]";
  const borderCls = isDense ? "border border-slate-200" : "border border-slate-300";

  return (
    <div className={`overflow-hidden ${borderCls} bg-white ${cardRadius} ${shadowCls} ${className}`}>
      <div className={`${bannerH} bg-gradient-to-br from-slate-100 via-slate-50 to-white`} aria-hidden />
      <div className={`relative ${padX}`}>
        <div className={`${avatarSize} overflow-hidden rounded-2xl border-white bg-white shadow-md`}>
          {photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photo} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-slate-100 text-slate-300">
              <Camera className={isDense ? "h-5 w-5" : "h-8 w-8"} aria-hidden />
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <h3 className={`${nameCls} text-slate-900`}>{d.displayName}</h3>
          {showVerificationBadge ? (
            <span
              className={`rounded-full border px-2 py-0.5 text-[10px] font-extrabold ${mentorVerificationBadgeClass(d.verification)}`}
            >
              {verKo}
            </span>
          ) : null}
        </div>

        <div className="mt-1.5 flex flex-wrap gap-1">
          {d.university ? (
            <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-bold text-slate-700">
              {d.university}
            </span>
          ) : null}
          {d.department ? (
            <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-bold text-slate-700">
              {d.department}
            </span>
          ) : null}
          {!isCompact && d.highSchool ? (
            <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-bold text-slate-700">
              {d.highSchool}
            </span>
          ) : null}
        </div>

        <p className={`mt-2 text-sm font-medium leading-relaxed text-slate-600 ${introClamp}`}>{intro}</p>

        {chips.length > 0 ? (
          <ul className="mt-2 flex flex-wrap gap-1">
            {chips.map((c) => (
              <li
                key={c}
                className="rounded-md border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] font-bold text-slate-700"
              >
                {c}
              </li>
            ))}
          </ul>
        ) : null}

        <div
          className={`grid grid-cols-3 gap-1.5 text-center ${
            isDense ? "mt-3 rounded-lg border border-slate-100 p-2" : "mt-4 border-t border-slate-100 pt-4"
          }`}
        >
          <div>
            <p className="text-[9px] font-extrabold uppercase tracking-wide text-slate-500">평점</p>
            <p className={`mt-0.5 font-black tabular-nums text-slate-900 ${isDense ? "text-sm" : "text-base"}`}>
              {isDense ? ratingLabel : previewRatingText}
            </p>
          </div>
          <div>
            <p className="text-[9px] font-extrabold uppercase tracking-wide text-slate-500">리뷰</p>
            <p className={`mt-0.5 font-black tabular-nums text-slate-900 ${isDense ? "text-sm" : "text-base"}`}>
              {isDense ? reviewLabel : previewReviewText}
            </p>
          </div>
          <div>
            <p className="text-[9px] font-extrabold uppercase tracking-wide text-slate-500">구독</p>
            <p className="mt-0.5 text-[10px] font-bold leading-snug text-slate-800">
              {d.subOpen ? "받기 가능" : "비공개"}
            </p>
          </div>
        </div>

        {!isCompact ? (
          <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-slate-100 pt-4 text-xs">
            <div>
              <dt className="font-bold text-slate-500">학교·전공</dt>
              <dd className="mt-0.5 font-extrabold leading-snug text-slate-800">{mentorSchoolLine(d)}</dd>
            </div>
            <div>
              <dt className="font-bold text-slate-500">학년</dt>
              <dd className="mt-0.5 font-extrabold text-slate-800">{d.grade || "—"}</dd>
            </div>
          </dl>
        ) : null}

        {isCompact || isHub || stats?.byTier ? (
          <div
            className={
              isDense
                ? "mt-3 rounded-xl border border-slate-100 bg-slate-50/70 p-2"
                : "mt-4 border-t border-slate-100 pt-4"
            }
          >
            {!isCompact ? (
              <p className="mb-2 text-[9px] font-extrabold uppercase tracking-wide text-slate-500">구독 요금제</p>
            ) : null}
            <div className="grid grid-cols-3 gap-1.5 text-center sm:gap-2">
              {(["limited", "standard", "premium"] as const).map((tier) => {
                const row = stats?.byTier?.[tier] ?? null;
                const price = priceLabelFromPlanRow(row, tier);
                const label = getSubscribeCatalogPlan(tier).label;
                const badgeColor = isDense
                  ? tier === "limited"
                    ? "bg-emerald-50 text-emerald-800 border-emerald-100"
                    : tier === "standard"
                      ? "bg-blue-50 text-blue-800 border-blue-100"
                      : "bg-violet-50 text-violet-800 border-violet-100"
                  : tier === "standard"
                    ? "bg-blue-50 text-[#1A56DB] border-blue-100"
                    : "bg-slate-50 text-slate-600 border-slate-200";

                return (
                  <div key={tier} className="min-w-0 rounded-lg border border-slate-200 bg-white p-1.5 sm:p-2">
                    <span
                      className={`inline-block rounded-full border px-1 py-0.5 text-[8px] font-black ${badgeColor}`}
                    >
                      {label}
                    </span>
                    <p className="mt-1 truncate text-[10px] font-black tabular-nums text-slate-900">{price}</p>
                  </div>
                );
              })}
            </div>
          </div>
        ) : showPrice ? (
          <div className={`mt-3 rounded-lg border border-slate-100 bg-slate-50/80 ${isDense ? "px-2.5 py-2" : "px-3 py-2.5"}`}>
            <p className="text-[9px] font-extrabold uppercase tracking-wide text-slate-500">대표 플랜</p>
            <p className={`mt-0.5 font-black text-slate-900 ${isDense ? "text-xs" : "text-sm"}`}>{priceLabel}</p>
          </div>
        ) : (
          <div className="mt-3 rounded-lg border border-slate-100 bg-slate-50/80 p-2.5 text-center">
            <p className="text-[9px] font-extrabold uppercase tracking-wide text-slate-500">구독 요금제</p>
            <p className="mt-0.5 text-xs font-semibold text-slate-400">요금 확인 필요</p>
          </div>
        )}

        {variant === "preview" && mediaPreviewSlots > 0 ? (
          <div className="mt-5 space-y-2">
            <div className="flex items-center gap-1">
              <h4 className="text-xs font-black text-slate-900">대표 콘텐츠</h4>
              <HelpCircle className="h-3 w-3 text-slate-300" aria-hidden />
            </div>
            <div className="grid grid-cols-3 gap-2">
              {Array.from({ length: Math.min(mediaPreviewSlots, 3) }).map((_, i) => (
                <div
                  key={i}
                  className="relative flex aspect-video items-center justify-center overflow-hidden rounded-lg bg-slate-100 ring-1 ring-slate-200"
                >
                  <PlayCircle className="h-6 w-6 text-slate-300" aria-hidden />
                </div>
              ))}
            </div>
          </div>
        ) : isHub && mediaCount > 0 ? (
          <p className="mt-3 text-[11px] font-medium text-slate-500">대표 콘텐츠 {mediaCount}개</p>
        ) : null}

        {variant === "preview" ? (
          <div className="mt-5 space-y-1 border-t border-slate-100 pt-4">
            <h4 className="text-xs font-black text-slate-900">소개</h4>
            <p className="line-clamp-4 text-[11px] leading-relaxed text-slate-600">{intro}</p>
          </div>
        ) : null}

        {footerNote ? (
          <p className="mt-3 text-[11px] font-medium text-slate-500">{footerNote}</p>
        ) : null}
      </div>
    </div>
  );
}
