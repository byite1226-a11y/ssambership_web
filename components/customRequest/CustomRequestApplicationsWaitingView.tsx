"use client";

import Link from "next/link";
import { CustomRequestStudentPostFlowStepper } from "@/components/customRequest/CustomRequestStudentPostFlowStepper";
import { WaitingCountdown } from "@/components/customRequest/WaitingCountdown";
import { formatMentorRatingLabel } from "@/lib/mentor/mentorPublicProfileDisplay";

export type WaitingApplicationItem = {
  id: string;
  mentorName: string;
  schoolLine: string;
  subjectTags: string[];
  avgRating: number | null;
  appliedAtLabel: string;
  photoUrl: string | null;
  verified: boolean;
};

export type WaitingPostSummary = {
  title: string;
  category: string;
  budgetLine: string;
  deadline: string;
  deadlineIso: string | null;
};

export type CustomRequestApplicationsWaitingViewProps = {
  postId: string;
  post: WaitingPostSummary;
  applications: WaitingApplicationItem[];
  applicantCount: number;
  maxApplicants: number;
  listError: string | null;
};

function StarRating(props: { avgRating: number | null }) {
  const label = formatMentorRatingLabel(props.avgRating);
  const filled = props.avgRating != null ? Math.round(props.avgRating) : 0;
  return (
    <span className="inline-flex items-center gap-1 text-sm font-bold text-slate-700">
      <span className="text-[#F59E0B]" aria-hidden>
        {"★".repeat(Math.min(5, filled))}
        {"☆".repeat(Math.max(0, 5 - filled))}
      </span>
      <span>{label}</span>
    </span>
  );
}

export function CustomRequestApplicationsWaitingView(props: CustomRequestApplicationsWaitingViewProps) {
  const { postId, post, applications, applicantCount, maxApplicants, listError } = props;

  return (
    <div className="w-full space-y-4 sm:space-y-5">
      <CustomRequestStudentPostFlowStepper activeStep={3} />

      <section className="overflow-hidden rounded-2xl border border-sky-100/90 bg-gradient-to-r from-sky-50/70 via-white to-slate-50/30 p-4 shadow-[0_2px_10px_rgba(15,23,42,0.05)] sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between lg:gap-6">
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-extrabold uppercase tracking-wide text-slate-500">요청 요약</p>
            <p className="mt-1 break-words text-lg font-black leading-snug text-slate-900 sm:text-xl">{post.title}</p>
            {post.category && post.category !== "—" ? (
              <span className="mt-2 inline-flex h-7 items-center rounded-full border border-slate-200 bg-white px-2.5 text-xs font-bold text-slate-800">
                {post.category}
              </span>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm font-medium text-slate-700">
            <div>
              <p className="text-[11px] font-extrabold uppercase tracking-wide text-slate-500">예산</p>
              <p className="mt-0.5 font-bold text-slate-900">{post.budgetLine}</p>
            </div>
            <div>
              <p className="text-[11px] font-extrabold uppercase tracking-wide text-slate-500">마감일</p>
              <p className="mt-0.5 font-bold text-slate-900">{post.deadline}</p>
            </div>
          </div>
          <Link
            href={`/custom-request/${postId}`}
            className="inline-flex h-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-extrabold text-slate-700 shadow-sm hover:bg-slate-50"
          >
            요청 내용 보기
          </Link>
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(260px,320px)] lg:gap-6">
        <div className="min-w-0 space-y-4 sm:space-y-5">
          <section className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm sm:p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm font-extrabold text-slate-900">지원 현황</p>
                <p className="mt-1 text-2xl font-black text-[#1A56DB]">
                  {applicantCount}
                  <span className="text-base font-bold text-slate-500"> / 최대 {maxApplicants}명</span>
                </p>
                <p className="mt-1 text-sm font-medium text-slate-600">멘토가 제안을 내면 아래 목록에 표시돼요.</p>
              </div>
              <div className="shrink-0">
                <p className="text-[11px] font-extrabold uppercase tracking-wide text-slate-500">마감까지</p>
                <WaitingCountdown deadlineIso={post.deadlineIso} className="mt-2" />
              </div>
            </div>
            <button
              type="button"
              className="mt-4 inline-flex min-h-[40px] items-center justify-center rounded-lg border border-[#1A56DB]/30 bg-[#1A56DB]/5 px-4 text-sm font-extrabold text-[#1A56DB] hover:bg-[#1A56DB]/10"
            >
              알림 설정
            </button>
          </section>

          {listError ? (
            <div className="rounded-2xl border border-red-200 bg-red-50/90 px-4 py-4 text-sm text-red-900 sm:px-5 sm:py-5">
              <p className="font-extrabold">지원서를 불러오지 못했어요</p>
              <p className="mt-1.5">{listError}</p>
            </div>
          ) : null}

          <section>
            <h2 className="text-lg font-extrabold text-slate-900 sm:text-xl">지원서 목록</h2>
            <p className="mt-1 text-sm font-medium text-slate-600">최신 지원 순으로 정렬돼요.</p>

            {applications.length === 0 && !listError ? (
              <div className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 px-4 py-8 text-center sm:px-6">
                <p className="text-sm font-extrabold text-slate-800">아직 지원한 멘토가 없어요</p>
                <p className="mt-1.5 text-sm font-medium text-slate-600">마감일까지 멘토들의 제안을 기다려 주세요.</p>
              </div>
            ) : (
              <ul className="mt-4 space-y-4">
                {applications.map((app) => (
                  <li
                    key={app.id}
                    className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                      <div className="flex min-w-0 flex-1 gap-3 sm:gap-4">
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-slate-100 text-lg font-black text-slate-500">
                          {app.photoUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={app.photoUrl} alt="" className="h-full w-full object-cover" />
                          ) : (
                            (app.mentorName[0] ?? "M").toUpperCase()
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-base font-extrabold text-slate-900">{app.mentorName}</p>
                            {app.verified ? (
                              <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-black text-blue-800">
                                인증
                              </span>
                            ) : null}
                          </div>
                          {app.schoolLine ? (
                            <p className="mt-0.5 text-sm font-medium text-slate-600">{app.schoolLine}</p>
                          ) : null}
                          {app.subjectTags.length > 0 ? (
                            <div className="mt-2 flex flex-wrap gap-1.5">
                              {app.subjectTags.map((tag) => (
                                <span
                                  key={tag}
                                  className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-bold text-slate-700"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          ) : null}
                          <div className="mt-2 flex flex-wrap items-center gap-3 text-sm">
                            <StarRating avgRating={app.avgRating} />
                            <span className="text-xs font-medium text-slate-400">지원 {app.appliedAtLabel}</span>
                          </div>
                          <p className="mt-2 text-[11px] font-medium text-slate-500">
                            연락처는 선택 후에만 확인할 수 있어요
                          </p>
                        </div>
                      </div>
                      <Link
                        href={`/custom-request/${postId}/applications`}
                        className="inline-flex min-h-[44px] shrink-0 items-center justify-center rounded-xl bg-[#1A56DB] px-4 text-sm font-extrabold text-white hover:bg-blue-700"
                      >
                        자세히 보기
                      </Link>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <aside className="space-y-4">
          <section className="rounded-2xl border border-amber-200/90 bg-amber-50/60 p-4 shadow-sm sm:p-5">
            <p className="text-sm font-extrabold text-amber-950">마감 안내</p>
            <p className="mt-2 text-sm font-medium leading-relaxed text-amber-900/90">
              마감일 자정 이후에는 지원이 마감되며, 멘토를 선택하지 않으면 요청이 자동으로 취소될 수 있어요.
            </p>
          </section>

          <section className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm sm:p-5">
            <p className="text-sm font-extrabold text-slate-900">이용 안내</p>
            <ul className="mt-2 space-y-2 text-sm font-medium leading-relaxed text-slate-600">
              <li>· 요청 내용 수정은 의뢰 상세 화면에서 확인해 주세요.</li>
              <li>· 멘토를 선택하기 전까지 연락처는 공개되지 않아요.</li>
              <li>· 지원이 모이면 비교·선택 화면에서 한 분을 고를 수 있어요.</li>
            </ul>
          </section>

          <button
            type="button"
            className="flex w-full min-h-[44px] items-center justify-center rounded-xl bg-[#1A56DB] px-4 text-sm font-extrabold text-white hover:bg-blue-700"
          >
            새로운 지원 알림 설정하기
          </button>
        </aside>
      </div>
    </div>
  );
}
