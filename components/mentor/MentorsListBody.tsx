import Link from "next/link";
import type { MentorsListFilters } from "@/lib/mentor/mentorsListSearchParams";
import { filtersToHrefRecord } from "@/lib/mentor/mentorsListSearchParams";
import type { PublicMentorsListResult } from "@/lib/mentor/publicMentorsListQueries";
import { MentorFilterPanel } from "@/components/mentor/MentorFilterPanel";
import { MentorGrid } from "@/components/mentor/MentorGrid";
import { MentorsListSidebar } from "@/components/mentor/MentorsListSidebar";
import { MentorResultsSummaryBar } from "@/components/mentor/MentorResultsSummaryBar";
import { MentorSearchBar } from "@/components/mentor/MentorSearchBar";
import { MentorSortBar } from "@/components/mentor/MentorSortBar";

const COPY_PUBLIC_LIST_HINT =
  "현재 공개된 멘토 정보만 표시하고 있어요. 더 많은 멘토는 순차적으로 준비 중이에요.";

export function MentorsListBody(props: { filters: MentorsListFilters; list: PublicMentorsListResult }) {
  const { filters, list } = props;
  const hrefBase = filtersToHrefRecord(filters);
  const showListHint = list.onlySelfVisibleHint && list.cards.length === 0;

  if (list.usersError) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-4 sm:p-5">
        <p className="text-sm font-extrabold text-red-900">멘토 목록을 불러오지 못했어요</p>
        <p className="mt-2 text-sm text-red-800/95">
          잠시 후 다시 시도하거나, 로그인한 뒤에도 동일하면 고객센터로 문의해 주세요.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[1600px] min-w-0 px-4 sm:px-5 lg:px-6">
      <header className="mb-6 border-b border-slate-100 pb-5">
        <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-slate-500">멤버십</p>
        <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">멘토 찾기</h1>
        <p className="mt-2 max-w-2xl text-sm font-medium leading-relaxed text-slate-600">
          필터와 검색으로 맞는 멘토를 찾고, 프로필에서 구독·질문을 이어가요.
        </p>
      </header>
      <div className="flex flex-col gap-6 lg:grid lg:grid-cols-12 lg:items-start lg:gap-6">
        {/* 좌: 검색·필터 */}
        <aside className="order-1 min-w-0 lg:col-span-3 lg:sticky lg:top-6 lg:self-start">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
            <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-blue-700/90">탐색</p>
            <h2 className="mt-1 text-lg font-black text-slate-900">검색·필터</h2>
            <p className="mt-2 text-xs font-medium leading-relaxed text-slate-600">키워드와 학교·과목·인증으로 멘토를 좁혀요.</p>
            <form method="get" action="/mentors" className="mt-5 space-y-4">
              <MentorSearchBar defaultValue={filters.q} />
              <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-3.5 sm:p-4">
                <h3 className="text-sm font-extrabold text-slate-900">상세 필터</h3>
                <div className="mt-3">
                  <MentorFilterPanel
                    universityDefault={filters.university}
                    subjectDefault={filters.subject}
                    verificationDefault={filters.verification}
                  />
                </div>
              </div>
              {filters.sort !== "new" ? <input type="hidden" name="sort" value={filters.sort} /> : null}
              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  type="submit"
                  className="min-h-[48px] flex-1 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-extrabold text-white shadow-sm transition hover:bg-slate-800 sm:flex-none sm:px-6"
                >
                  필터 적용
                </button>
                <Link
                  href="/mentors"
                  className="inline-flex min-h-[48px] flex-1 items-center justify-center rounded-xl border-2 border-slate-200 bg-white px-4 py-2.5 text-sm font-extrabold text-slate-800 transition hover:border-slate-300 sm:flex-none sm:px-6"
                >
                  초기화
                </Link>
              </div>
            </form>
          </div>
        </aside>

        {/* 중: 요약 + 정렬 + 리스트 */}
        <div className="order-2 min-w-0 space-y-4 lg:col-span-6 lg:min-w-0">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
            <MentorResultsSummaryBar filters={filters} total={list.cards.length} profilesError={Boolean(list.profilesError)} />
            <div className="mt-4">
              <MentorSortBar current={hrefBase} active={filters.sort} />
            </div>

            {showListHint ? (
              <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50/90 px-3.5 py-2.5 text-sm text-slate-700 sm:px-4 sm:py-3">
                <p>{COPY_PUBLIC_LIST_HINT}</p>
              </div>
            ) : null}

            {list.profilesError ? (
              <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50/90 px-3.5 py-2.5 text-sm text-amber-950 sm:px-4 sm:py-3">
                <p>
                  <span className="font-bold">일부 멘토</span>의 상세는 아직 이어지지 않았을 수 있어요. 보이는 항목 기준으로 목록이
                  표시돼요.
                </p>
              </div>
            ) : null}

            <div className="mt-5">
              {list.cards.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 p-8 text-center sm:p-10">
                  <p className="text-lg font-black text-slate-900">조건에 맞는 멘토가 없어요</p>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">
                    필터를 조정하거나, 나중에 다시 확인해 주세요. {COPY_PUBLIC_LIST_HINT}
                  </p>
                </div>
              ) : (
                <MentorGrid cards={list.cards} />
              )}
            </div>
          </div>
        </div>

        {/* 우: 안내·태그·CTA */}
        <aside className="order-3 min-w-0 lg:col-span-3 lg:sticky lg:top-6 lg:self-start">
          <MentorsListSidebar cards={list.cards} />
        </aside>
      </div>
    </div>
  );
}
