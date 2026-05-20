import type { ReactNode } from "react";
import Link from "next/link";
import { PlanComparisonCards } from "@/components/subscribe/PlanComparisonCards";
import { mentorVerificationKo, type MentorProfileDisplay } from "@/lib/mentor/mentorDisplayFields";
import type { PublicMentorLoadResult } from "@/lib/mentor/publicMentorBundle";
import { assignPlansByTier } from "@/lib/subscribe/subscribePageQueries";
import { getStringField } from "@/lib/qna/safeSelect";
import type { AppRole, UserRow } from "@/lib/types/user";
import { MentorReviewList } from "@/components/mentor/MentorReviewList";
import { ReviewEligibilityBanner } from "@/components/reviews/ReviewEligibilityBanner";
import { ReviewWriteModal } from "@/components/reviews/ReviewWriteModal";
import { ReviewReportButton } from "@/components/reviews/ReviewReportButton";
import type { ReviewEligibilityResult } from "@/lib/reviews/checkReviewEligibility";
import {
  USER_UI_MENTOR_MEDIA_LOAD_FAILED,
  USER_UI_MENTOR_PROFILE_LOAD_FAILED,
  USER_UI_MENTOR_REVIEWS_LOAD_FAILED,
  USER_UI_MENTOR_USER_LOAD_FAILED,
} from "@/lib/constants/userFacingMessages";

function mentorAccountStatusKo(raw: string | null | undefined): string {
  const s = (raw ?? "").trim().toLowerCase();
  if (!s) return "—";
  if (s === "active") return "이용 중";
  if (s === "inactive" || s === "disabled" || s === "suspended") return "이용 제한";
  if (s === "pending" || s === "invited") return "확인 중";
  return "회원";
}

function tagPills(tags: string, max = 10): string[] {
  if (!tags.trim()) return [];
  return tags
    .split(/[,，、·]/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
    .slice(0, max);
}

function Field(props: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50/90 px-3 py-2.5">
      <p className="text-[10px] font-extrabold uppercase tracking-wide text-slate-500">{props.label}</p>
      <p className={`mt-1 min-h-[1.25rem] text-sm font-bold text-slate-900 ${props.mono ? "font-mono text-xs break-all" : ""}`}>
        {props.value || "—"}
      </p>
    </div>
  );
}

function SectionShell(props: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <section className="rounded-3xl border border-slate-200/90 bg-white p-5 shadow-sm sm:p-6">
      <div className="border-b border-slate-100 pb-4">
        <h2 className="text-lg font-black text-slate-900">{props.title}</h2>
        {props.subtitle ? <p className="mt-1 text-sm font-medium text-slate-500">{props.subtitle}</p> : null}
      </div>
      <div className="pt-5">{props.children}</div>
    </section>
  );
}

export function PublicMentorDetailBody(props: {
  mentorId: string;
  userRow: UserRow;
  display: MentorProfileDisplay;
  bundle: Extract<PublicMentorLoadResult, { kind: "ok" }>;
  viewer?: { userId: string; role: AppRole } | null;
  reviewEligibility?: ReviewEligibilityResult | null;
}) {
  const { mentorId, userRow, display, bundle, viewer, reviewEligibility } = props;
  const mediaRows = bundle.media.rows;
  const { byTier, fillProbe } = assignPlansByTier(bundle.plans.rows as Record<string, unknown>[]);
  const subscribeHref = `/subscribe?mentorId=${encodeURIComponent(mentorId)}`;
  const questionHref = `/login/student?next=${encodeURIComponent(`/question-room`)}`;
  const verLabel = mentorVerificationKo(display.verification);
  const schoolLine =
    display.university && display.department
      ? `${display.university} · ${display.department}`
      : display.university || display.department || "학교·학과 정보가 아직 없어요";
  const pills = tagPills(display.tags || display.subjects || "");

  return (
    <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
      <div className="space-y-8 pb-10 lg:space-y-10">
        {/* 1) 상단 히어로 */}
        <section className="overflow-hidden rounded-3xl border border-slate-200/90 bg-gradient-to-br from-slate-50 via-white to-sky-50/50 shadow-[0_8px_36px_rgba(15,23,42,0.08)] ring-1 ring-slate-900/[0.04]">
          <div className="relative px-5 py-8 sm:px-8 sm:py-10 lg:px-10 lg:py-11">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-36 bg-gradient-to-b from-blue-500/[0.07] to-transparent" aria-hidden />
            <div className="relative flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex min-w-0 flex-1 gap-5 sm:gap-6">
                <div
                  className="flex h-24 w-24 shrink-0 items-center justify-center rounded-3xl border-2 border-white bg-gradient-to-br from-slate-200 to-slate-300 text-3xl font-black text-slate-800 shadow-md sm:h-[5.5rem] sm:w-[5.5rem]"
                  aria-hidden
                >
                  {(display.displayName || "멘").trim().slice(0, 1)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-blue-700/90">멘토 프로필</p>
                  <h1 className="mt-2 text-3xl font-black leading-tight tracking-tight text-slate-900 sm:text-4xl lg:text-[2.35rem] lg:leading-[1.12]">
                    {display.displayName}
                  </h1>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-extrabold text-slate-800 ring-1 ring-slate-200">
                      {verLabel}
                    </span>
                  </div>
                  <p className="mt-3 text-base font-bold text-slate-800">{schoolLine}</p>
                  <p className="mt-1 text-sm font-semibold text-slate-600">지도·과목: {display.subjects?.trim() || "준비 중"}</p>
                  {pills.length > 0 ? (
                    <ul className="mt-3 flex flex-wrap gap-2" aria-label="대표 태그">
                      {pills.map((p) => (
                        <li
                          key={p}
                          className="rounded-lg border border-sky-100 bg-sky-50/90 px-2.5 py-1 text-[11px] font-bold text-sky-950 sm:text-xs"
                        >
                          {p}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                  <p className="mt-4 max-w-2xl text-base leading-relaxed text-slate-700">
                    {display.intro?.trim() || "대표 소개는 준비 중이에요. 아래 콘텐츠·리뷰·멤버십을 참고해 주세요."}
                  </p>
                  {bundle.userError ? <p className="mt-2 text-xs font-bold text-amber-800">{USER_UI_MENTOR_USER_LOAD_FAILED}</p> : null}
                  {bundle.profileError ? <p className="mt-1 text-xs font-bold text-amber-800">{USER_UI_MENTOR_PROFILE_LOAD_FAILED}</p> : null}
                </div>
              </div>
              <div className="flex w-full shrink-0 flex-col gap-2.5 sm:max-w-md lg:w-56 lg:shrink-0 xl:w-60">
                <Link
                  href={questionHref}
                  className="inline-flex min-h-[52px] w-full items-center justify-center rounded-2xl bg-blue-600 px-5 text-sm font-extrabold text-white shadow-md transition hover:bg-blue-700"
                >
                  질문하기
                </Link>
                <Link
                  href="#membership-rail"
                  className="inline-flex min-h-[48px] w-full items-center justify-center rounded-2xl border border-slate-200 bg-white/90 px-5 text-sm font-bold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
                >
                  요금제 비교
                </Link>
                <Link
                  href="/mentors"
                  className="inline-flex min-h-[44px] w-full items-center justify-center rounded-xl border border-slate-200 bg-white/90 px-4 text-sm font-bold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50"
                >
                  목록으로
                </Link>
              </div>
            </div>
            {display.photoUrl ? (
              <p className="relative mt-6 border-t border-slate-200/80 pt-4 text-xs text-slate-500">
                프로필 이미지:{" "}
                <a className="font-mono font-bold text-blue-700 underline break-all" href={display.photoUrl} target="_blank" rel="noreferrer">
                  열기
                </a>
              </p>
            ) : null}
          </div>
        </section>

        {/* 2) 본문 2열 */}
        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12 lg:gap-10 xl:gap-12">
          <div className="min-w-0 space-y-6 lg:col-span-7 xl:col-span-8">
            <SectionShell title="소개·노출 정보" subtitle="학생에게 보이는 요약입니다.">
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="인증" value={verLabel} />
                <Field label="멘토 계정" value={mentorAccountStatusKo(userRow.status)} />
                <Field label="구독 안내" value={display.subOpen ? "구독 신청을 받을 수 있어요" : "구독은 준비 중이거나 비공개예요"} />
                <Field label="과목·지도" value={display.subjects} />
                <Field label="대표 태그" value={display.tags} />
              </div>
            </SectionShell>

            <SectionShell title="대표 콘텐츠" subtitle="채널에서 연결된 콘텐츠가 여기에 표시돼요.">
              {bundle.media.error ? <p className="text-sm font-bold text-red-800">{USER_UI_MENTOR_MEDIA_LOAD_FAILED}</p> : null}
              {!mediaRows.length && !bundle.media.error ? (
                <p className="text-sm leading-relaxed text-slate-600">아직 소개할 콘텐츠가 없어요. 멘토가 준비하면 이곳에 채워져요.</p>
              ) : (
                <ul className="grid gap-2 sm:grid-cols-2">
                  {mediaRows.map((r, i) => {
                    const id = r.id != null ? String(r.id) : `row-${i}`;
                    const t = getStringField(r as Record<string, unknown>, ["title", "name", "caption", "label"]) ?? id;
                    return (
                      <li key={id} className="rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-3 text-sm font-bold text-slate-800">
                        {t}
                      </li>
                    );
                  })}
                </ul>
              )}
            </SectionShell>

            <SectionShell title="리뷰" subtitle="학생들이 남긴 평가를 모아 보여 드려요.">
              {bundle.reviews.error ? <p className="mb-3 text-sm font-bold text-amber-800">{USER_UI_MENTOR_REVIEWS_LOAD_FAILED}</p> : null}
              <MentorReviewList mentorId={mentorId} />
              {viewer?.role === "student" ? (
                <div className="mt-6 space-y-4 border-t border-slate-100 pt-5">
                  <ReviewEligibilityBanner
                    eligibilityKnown={reviewEligibility != null}
                    eligible={reviewEligibility?.eligible === true}
                  />
                  <ReviewWriteModal
                    mentorId={mentorId}
                    mentorName={display.displayName}
                    initialEligible={reviewEligibility?.eligible === true}
                    initialReason={reviewEligibility && !reviewEligibility.eligible ? reviewEligibility.reason : undefined}
                  />
                  <ReviewReportButton disabledReason="리뷰 신고 접수 API는 별도 연동이 필요합니다. 커뮤니티 신고는 해당 게시 화면을 이용해 주세요." />
                </div>
              ) : null}
            </SectionShell>

            <SectionShell title="자주 묻는 질문" subtitle="이용 전 궁금한 점을 정리했어요.">
              <p className="text-sm leading-relaxed text-slate-600">
                구독·환불·질문 한도 등은 결제·플랜 화면과 운영 정책을 함께 확인해 주세요.
              </p>
              <ul className="mt-4 list-inside list-disc space-y-2 text-sm text-slate-600">
                <li>질문방·멤버십은 구독 상태에 따라 달라질 수 있어요.</li>
                <li>결제는 안내된 구독 전용 흐름을 따라 진행돼요.</li>
              </ul>
            </SectionShell>

            <details className="rounded-2xl border border-amber-100 bg-amber-50/50 p-4 text-sm text-amber-950">
              <summary className="cursor-pointer font-extrabold">편집 화면과 항목이 다를 수 있어요(참고)</summary>
              <ul className="mt-2 list-inside list-disc space-y-1 text-xs">
                <li>이름·표시: 공개는 계정/프로필에서 온 값을 씁니다.</li>
                <li>리뷰·요금: 공개 화면에 보이는 값은 조회 시점 기준이며, 멘토용 편집 화면과 항목이 다를 수 있어요.</li>
              </ul>
            </details>
          </div>

          <aside
            id="membership-rail"
            className="min-w-0 scroll-mt-28 lg:col-span-5 xl:col-span-4 lg:sticky lg:top-24 lg:self-start"
          >
            <div className="w-full min-w-0 rounded-3xl border border-slate-200/90 bg-gradient-to-b from-white to-slate-50/90 p-5 shadow-[0_6px_28px_rgba(15,23,42,0.07)] sm:p-6">
              <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-blue-700">구독 플랜</p>
              <h2 className="mt-1 text-xl font-black text-slate-900">플랜 비교</h2>
              <p className="mt-2 text-sm font-medium leading-relaxed text-slate-600">
                티어별 요금과 질문 한도를 비교한 뒤, 원하는 플랜으로 구독·결제 화면으로 이동해 주세요.
              </p>
              <div className="mt-5 min-w-0">
                <PlanComparisonCards
                  mentorId={mentorId}
                  byTier={byTier}
                  selectedTier="standard"
                  plansError={bundle.plans.error}
                  plansProbe={bundle.plans.probe}
                  fillProbe={fillProbe}
                  layout="rail"
                />
              </div>
              <Link
                href={subscribeHref}
                className="mt-5 flex min-h-[50px] w-full items-center justify-center rounded-2xl bg-blue-600 px-4 text-sm font-extrabold text-white shadow-md transition hover:bg-blue-700"
              >
                구독·결제 화면으로
              </Link>
              <p className="mt-3 text-center text-xs font-medium leading-relaxed text-slate-500">
                로그인이 필요하면 아래에서 이어갈 수 있어요.
              </p>
              <Link
                href={`/login/student?next=${encodeURIComponent(subscribeHref)}`}
                className="mt-2 block text-center text-sm font-semibold text-slate-600 underline decoration-slate-300 underline-offset-2 hover:text-slate-900"
              >
                학생 로그인 후 구독하기
              </Link>
            </div>
          </aside>
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
        className="mt-5 inline-block min-h-[44px] rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-bold text-white"
      >
        멘토 찾기로
      </Link>
    </div>
  );
}
