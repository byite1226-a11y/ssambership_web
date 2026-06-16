import Link from "next/link";
import { BadgeCheck, Camera } from "lucide-react";
import { MentorContentsSection } from "@/components/mentor/MentorContentsList";
import { MentorDetailCTASection } from "@/components/mentor/MentorDetailCTASection";
import { MentorDetailHeaderActions } from "@/components/mentor/MentorDetailHeaderActions";
import { MentorDetailSubjectTabs } from "@/components/mentor/MentorDetailSubjectTabs";
import { MentorDetailSubscribeSidebar } from "@/components/mentor/MentorDetailSubscribeSidebar";
import { MentorReviewsCarousel } from "@/components/mentor/MentorReviewsCarousel";
import { mentorVerificationKo, type MentorProfileDisplay } from "@/lib/mentor/mentorDisplayFields";
import type { PublicMentorLoadResult } from "@/lib/mentor/publicMentorBundle";
import { assignPlansByTier } from "@/lib/subscribe/subscribePageQueries";
import {
  mentorIntroFallback,
  mentorIsVerified,
  mentorSchoolGradeLine,
  mentorSubjectChips,
} from "@/lib/mentor/mentorPublicProfileDisplay";
import type { AppRole, UserRow } from "@/lib/types/user";
import { ReviewEligibilityBanner } from "@/components/reviews/ReviewEligibilityBanner";
import { ReviewWriteModal } from "@/components/reviews/ReviewWriteModal";
import type { ReviewEligibilityResult } from "@/lib/reviews/checkReviewEligibility";
import {
  USER_UI_MENTOR_MEDIA_LOAD_FAILED,
  USER_UI_MENTOR_PROFILE_LOAD_FAILED,
  USER_UI_MENTOR_USER_LOAD_FAILED,
} from "@/lib/constants/userFacingMessages";
import {
  avgResponseHoursFromProfileRow,
  formatAvgResponseHoursLabel,
} from "@/lib/mentor/avgResponseHoursDisplay";

type Row = Record<string, unknown>;

function statFromProfile(row: Row | null, keys: string[]): number | null {
  if (!row) return null;
  for (const k of keys) {
    const v = row[k];
    if (typeof v === "number" && Number.isFinite(v)) return Math.round(v);
  }
  return null;
}

function mentorDetailStats(
  profileRow: Row | null,
  reviews: { count: number | null; avgRating: number | null },
  avgResponseHours?: number | null
) {
  const totalAnswers = statFromProfile(profileRow, [
    "total_answers",
    "cumulative_answers",
    "answer_count",
  ]);
  const connectedStudents = statFromProfile(profileRow, [
    "connected_students",
    "student_count",
    "active_students",
  ]);
  const responseHours = avgResponseHours ?? avgResponseHoursFromProfileRow(profileRow);
  const avgResponseLabel = formatAvgResponseHoursLabel(responseHours);
  const satisfactionLabel =
    reviews.avgRating != null
      ? `${Math.round((reviews.avgRating / 5) * 100)}%`
      : "—";

  return {
    totalAnswers,
    connectedStudents,
    avgResponseLabel,
    satisfactionLabel,
    reviewCount: reviews.count,
    avgRating: reviews.avgRating,
  };
}

export function PublicMentorDetailBody(props: {
  mentorId: string;
  userRow: UserRow;
  display: MentorProfileDisplay;
  bundle: Extract<PublicMentorLoadResult, { kind: "ok" }>;
  viewer?: { userId: string; role: AppRole } | null;
  reviewEligibility?: ReviewEligibilityResult | null;
  isLoggedIn?: boolean;
  initialFavorited?: boolean;
  freeQuestionRemaining?: number | null;
  subscriptionClosed?: boolean;
  avgResponseHours?: number | null;
  individualQuestionPriceCents?: number | null;
}) {
  const { mentorId, display, bundle, viewer, reviewEligibility } = props;
  const isLoggedIn = props.isLoggedIn ?? Boolean(viewer);
  const { byTier, fillProbe } = assignPlansByTier(bundle.plans.rows as Row[]);
  const subscribeHref = `/subscribe?mentorId=${encodeURIComponent(mentorId)}`;
  const freeQuestionHref = isLoggedIn
    ? `/question-room?mentorId=${encodeURIComponent(mentorId)}`
    : `/login/student?next=${encodeURIComponent(`/mentors/${mentorId}`)}`;
  const individualQuestionHref =
    viewer?.role === "student"
      ? `/mentors/${encodeURIComponent(mentorId)}/individual-question/new`
      : `/login/student?next=${encodeURIComponent(`/mentors/${mentorId}/individual-question/new`)}`;

  const verified = mentorIsVerified(display.verification);
  const schoolLine = mentorSchoolGradeLine(display);
  const chips = mentorSubjectChips(display.subjects || display.tags, 8);
  const introShort = mentorIntroFallback(display.intro);
  const introLong =
    display.intro?.trim() ||
    "멘토 소개가 곧 업데이트될 예정이에요. 구독 전 궁금한 점은 무료 질문권으로 먼저 확인해 보세요.";

  const stats = mentorDetailStats(bundle.profileRow, {
    count: bundle.reviews.count,
    avgRating: bundle.reviews.avgRating,
  }, props.avgResponseHours);

  const photo = display.photoUrl?.trim();
  const verKo = mentorVerificationKo(display.verification);

  const statCards = [
    {
      label: "누적 답변 수",
      value:
        stats.totalAnswers != null
          ? `${stats.totalAnswers.toLocaleString("ko-KR")}개+`
          : "—",
      hint: "정성 답변 제공",
    },
    {
      label: "연결 학생 수",
      value:
        stats.connectedStudents != null
          ? `${stats.connectedStudents.toLocaleString("ko-KR")}명+`
          : "—",
      hint: "누적 학생 수",
    },
    {
      label: "평균 답변 시간",
      value: stats.avgResponseLabel,
      hint: "빠른 답변",
    },
    {
      label: "답변 만족도",
      value: stats.satisfactionLabel,
      hint: "실제 학생 평가",
    },
  ];

  const trustBadges = [
    {
      title: `${display.university || "대학"} 인증`,
      sub: verified ? "재학 인증 완료" : "인증 검토 중",
    },
    { title: "학생증 인증", sub: verified ? "본인 인증 완료" : "서류 제출 대기" },
    { title: "활동 인증", sub: verified ? "우수 멘토" : "활동 검증 예정" },
    {
      title:
        stats.avgRating != null
          ? `★ ${stats.avgRating.toFixed(1)}`
          : "★ —",
      sub:
        stats.reviewCount != null
          ? `(${stats.reviewCount.toLocaleString("ko-KR")}) · 만족도 ${stats.satisfactionLabel}`
          : `답변 만족도 ${stats.satisfactionLabel}`,
    },
  ];

  return (
    <div className="mx-auto w-full max-w-[1400px] px-4 pb-16 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/mentors"
          className="inline-flex items-center text-sm font-extrabold text-slate-600 transition hover:text-[#1A56DB]"
        >
          ← 멘토 찾기로 돌아가기
        </Link>
        <MentorDetailHeaderActions
          mentorId={mentorId}
          isLoggedIn={isLoggedIn}
          initialFavorited={props.initialFavorited ?? false}
        />
      </div>

      <div className="grid grid-cols-1 gap-8 xl:grid-cols-12 xl:gap-10">
        <div className="min-w-0 space-y-6 xl:col-span-8">
          {/* 프로필 헤더 */}
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex flex-col gap-5 sm:flex-row sm:gap-6">
              <div className="relative mx-auto h-[120px] w-[120px] shrink-0 sm:mx-0">
                <div className="h-[120px] w-[120px] overflow-hidden rounded-full border-4 border-white bg-slate-100 shadow-md ring-2 ring-slate-100">
                  {photo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={photo} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-200 to-slate-300 text-3xl font-black text-slate-600">
                      {(display.displayName || "멘").trim().slice(0, 1)}
                      <Camera className="absolute bottom-2 right-2 h-5 w-5 text-slate-400 opacity-0" aria-hidden />
                    </div>
                  )}
                </div>
              </div>
              <div className="min-w-0 flex-1 text-center sm:text-left">
                <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                  <h1 className="text-2xl font-black text-slate-900 sm:text-3xl">{display.displayName}</h1>
                  {verified ? (
                    <span className="inline-flex items-center gap-0.5 rounded-md bg-[#1A56DB] px-2 py-0.5 text-xs font-black text-white">
                      <BadgeCheck className="h-3.5 w-3.5" aria-hidden />
                      인증
                    </span>
                  ) : null}
                </div>
                <p className="mt-1 text-sm font-bold text-slate-700">{schoolLine}</p>
                {chips.length > 0 ? (
                  <ul className="mt-3 flex flex-wrap justify-center gap-1.5 sm:justify-start">
                    {chips.map((c) => (
                      <li
                        key={c}
                        className="rounded-md border border-[#1A56DB]/40 bg-blue-50/30 px-2 py-0.5 text-[11px] font-bold text-[#1A56DB]"
                      >
                        {c}
                      </li>
                    ))}
                  </ul>
                ) : null}
                <p className="mt-3 text-sm font-medium leading-relaxed text-slate-600">{introShort}</p>
                {bundle.userError ? (
                  <p className="mt-2 text-xs font-bold text-amber-800">{USER_UI_MENTOR_USER_LOAD_FAILED}</p>
                ) : null}
                {bundle.profileError ? (
                  <p className="mt-1 text-xs font-bold text-amber-800">{USER_UI_MENTOR_PROFILE_LOAD_FAILED}</p>
                ) : null}
              </div>
            </div>

            <ul className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {trustBadges.map((b) => (
                <li
                  key={b.title}
                  className="rounded-xl border border-slate-100 bg-slate-50/80 px-2.5 py-2.5 text-center sm:px-3"
                >
                  <p className="text-[11px] font-black text-slate-900">{b.title}</p>
                  <p className="mt-0.5 text-[10px] font-semibold text-slate-500">{b.sub}</p>
                </li>
              ))}
            </ul>
          </section>

          {/* 멘토 소개 */}
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <h2 className="text-lg font-black text-slate-900">멘토 소개</h2>
            <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">{introLong}</p>
            <p className="mt-3 text-xs text-slate-500">인증 상태: {verKo}</p>
          </section>

          {/* 통계 4카드 */}
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {statCards.map((s) => (
              <div
                key={s.label}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
              >
                <p className="text-[10px] font-bold text-slate-500">{s.label}</p>
                <p className="mt-1 text-lg font-black tabular-nums text-slate-900">{s.value}</p>
                <p className="mt-0.5 text-[10px] font-semibold text-[#1A56DB]">{s.hint}</p>
              </div>
            ))}
          </div>

          <MentorDetailSubjectTabs display={display} />

          <MentorContentsSection
            mentorId={mentorId}
            rows={bundle.media.rows}
            error={bundle.media.error}
            loadFailedMessage={USER_UI_MENTOR_MEDIA_LOAD_FAILED}
          />

          <MentorReviewsCarousel mentorId={mentorId} />

          {viewer?.role === "student" ? (
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-sm font-black text-slate-900">리뷰 작성</h2>
              <div className="mt-4 space-y-4">
                <ReviewEligibilityBanner
                  eligibilityKnown={reviewEligibility != null}
                  eligible={reviewEligibility?.eligible === true}
                />
                <ReviewWriteModal
                  mentorId={mentorId}
                  mentorName={display.displayName}
                  initialEligible={reviewEligibility?.eligible === true}
                  initialReason={
                    reviewEligibility && !reviewEligibility.eligible ? reviewEligibility.reason : undefined
                  }
                />
              </div>
            </section>
          ) : null}

          <MentorDetailCTASection
            mentorName={display.displayName}
            mentorId={mentorId}
            subscribeHref={subscribeHref}
            freeQuestionHref={freeQuestionHref}
            individualQuestionHref={individualQuestionHref}
            freeQuestionRemaining={props.freeQuestionRemaining}
            subscriptionClosed={props.subscriptionClosed}
            individualQuestionPriceCents={props.individualQuestionPriceCents}
          />
        </div>

        <div className="xl:col-span-4">
          <MentorDetailSubscribeSidebar
            mentorId={mentorId}
            byTier={byTier}
            plansError={bundle.plans.error}
            plansProbe={bundle.plans.probe}
            fillProbe={fillProbe}
            isLoggedIn={isLoggedIn}
            freeQuestionRemaining={props.freeQuestionRemaining}
            subscriptionClosed={props.subscriptionClosed}
            individualQuestionHref={individualQuestionHref}
            individualQuestionPriceCents={props.individualQuestionPriceCents}
          />
        </div>
      </div>
    </div>
  );
}

export function PublicMentorNotFoundBody(props: { title: string; message: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center sm:p-8">
      <p className="text-lg font-extrabold text-slate-900">{props.title}</p>
      <p className="mt-2 min-h-[1.25rem] text-sm text-slate-600">{props.message}</p>
      <Link
        href="/mentors"
        className="mt-5 inline-block min-h-[44px] rounded-lg bg-[#1A56DB] px-4 py-2.5 text-sm font-bold text-white"
      >
        멘토 찾기로
      </Link>
    </div>
  );
}
