import type { MentorProfileDisplay } from "@/lib/mentor/mentorDisplayFields";
import { mentorVerificationKo } from "@/lib/mentor/mentorDisplayFields";

/** 과목·태그 CSV → 칩 배열 (멘토 찾기·미리보기 공통) */
export function mentorSubjectChips(text: string, max = 5): string[] {
  if (!text.trim()) return [];
  return text
    .split(/[,，、·]/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
    .slice(0, max);
}

export function mentorIntroFallback(intro: string | undefined | null): string {
  const t = intro?.trim();
  return t || "한 줄 소개는 준비 중이에요.";
}

export function mentorSchoolLine(display: MentorProfileDisplay): string {
  if (display.university && display.department) {
    return `${display.university} · ${display.department}`;
  }
  return display.university || display.department || "학교·전공 준비 중";
}

export function mentorVerificationBadgeClass(verification: string | null | undefined): string {
  const verKo = mentorVerificationKo(verification);
  if (/완료|승인/i.test(verKo)) {
    return "border-emerald-200 bg-emerald-50 text-emerald-800";
  }
  if (/검토|대기|미등록/i.test(verKo)) {
    return "border-amber-200 bg-amber-50 text-amber-900";
  }
  return "border-slate-200 bg-slate-50 text-slate-700";
}

export type MentorPublicProfileStats = {
  avgRating?: number | null;
  reviewCount?: number | null;
  priceLabel?: string | null;
  mediaCount?: number;
  byTier?: Record<string, Record<string, unknown> | null> | null;
};

export function formatMentorRatingLabel(avg: number | null | undefined): string {
  return avg != null && Number.isFinite(avg) ? avg.toFixed(1) : "—";
}

export function formatMentorReviewCountLabel(count: number | null | undefined): string {
  return count != null && Number.isFinite(count) ? `${count}건` : "—";
}

export function formatMentorPriceLabel(priceLabel: string | null | undefined): string {
  const t = priceLabel?.trim();
  return t && t.length > 0 ? t : "구독 요금·플랜 확인 필요";
}

/** 실제 플랜/가격 문자열이 연결된 경우만 true */
export function mentorHasRealPriceLabel(priceLabel: string | null | undefined): boolean {
  const t = priceLabel?.trim();
  if (!t) return false;
  return !t.includes("확인 필요");
}
