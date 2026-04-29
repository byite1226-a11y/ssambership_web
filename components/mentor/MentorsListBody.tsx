import Link from "next/link";
import type { MentorsListFilters } from "@/lib/mentor/mentorsListSearchParams";
import { filtersToHrefRecord } from "@/lib/mentor/mentorsListSearchParams";
import type { PublicMentorsListResult } from "@/lib/mentor/publicMentorsListQueries";
import { MentorFilterPanel } from "@/components/mentor/MentorFilterPanel";
import { MentorGrid } from "@/components/mentor/MentorGrid";
import { MentorsListSidebar } from "@/components/mentor/MentorsListSidebar";
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
    <div className="flex flex-col gap-4 sm:gap-5">
      <div className="flex flex-col gap-4 sm:gap-5 lg:grid lg:grid-cols-12 lg:items-start lg:gap-5">
        <aside className="order-1 min-w-0 space-y-2.5 lg:col-span-3 lg:sticky lg:top-3 lg:self-start">
          <form method="get" action="/mentors" className="space-y-2.5">
            <MentorSearchBar defaultValue={filters.q} />
            <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm sm:p-3.5">
              <h2 className="text-sm font-extrabold text-slate-900">필터</h2>
              <p className="mt-0.5 text-xs text-slate-500">이름·학과·인증 키워드로 좁힐 수 있어요</p>
              <div className="mt-2.5">
                <MentorFilterPanel
                  universityDefault={filters.university}
                  subjectDefault={filters.subject}
                  verificationDefault={filters.verification}
                />
              </div>
            </div>
            {filters.sort !== "new" ? <input type="hidden" name="sort" value={filters.sort} /> : null}
            <div className="flex flex-wrap gap-2">
              <button
                type="submit"
                className="min-h-[44px] rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-bold text-white hover:bg-slate-800"
              >
                필터 적용
              </button>
              <Link
                href="/mentors"
                className="inline-flex min-h-[44px] items-center rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-bold text-slate-800"
              >
                초기화
              </Link>
            </div>
          </form>
        </aside>

        <div className="order-2 min-w-0 space-y-3 lg:col-span-6">
          <MentorSortBar current={hrefBase} active={filters.sort} />

          {showListHint ? (
            <div className="rounded-xl border border-slate-200 bg-slate-50/90 px-3.5 py-2.5 text-sm text-slate-700 sm:px-4 sm:py-3">
              <p>{COPY_PUBLIC_LIST_HINT}</p>
            </div>
          ) : null}

          {list.profilesError ? (
            <div className="rounded-xl border border-slate-200 bg-slate-50/90 px-3.5 py-2.5 text-sm text-slate-700 sm:px-4 sm:py-3">
              <p>
                <span className="font-bold text-slate-800">일부 멘토</span>의 상세는 아직 이어지지 않았을 수 있어요. 보이는 항목
                기준으로 목록이 표시돼요.
              </p>
            </div>
          ) : null}

          {list.cards.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-5 sm:p-6">
              <p className="text-base font-extrabold text-slate-900 sm:text-lg">조건에 맞는 멘토가 없어요</p>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                필터를 조정하거나, 나중에 다시 확인해 주세요. {COPY_PUBLIC_LIST_HINT}
              </p>
            </div>
          ) : (
            <MentorGrid cards={list.cards} />
          )}
        </div>

        <aside className="order-3 min-w-0 lg:col-span-3 lg:sticky lg:top-3 lg:self-start">
          <MentorsListSidebar cards={list.cards} />
        </aside>
      </div>
    </div>
  );
}
