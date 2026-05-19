import Link from "next/link";
import type { MentorsListFilters } from "@/lib/mentor/mentorsListSearchParams";
import { filtersToHrefRecord, mentorsListHref } from "@/lib/mentor/mentorsListSearchParams";
import type { PublicMentorsListResult } from "@/lib/mentor/publicMentorsListQueries";
import { MentorGrid } from "@/components/mentor/MentorGrid";
import { MentorsListFilterSidebar } from "@/components/mentor/MentorsListFilterSidebar";
import { MentorsListTopFilterBar } from "@/components/mentor/MentorsListTopFilterBar";

const COPY_PUBLIC_LIST_HINT =
  "현재 공개된 멘토 정보만 표시하고 있어요. 더 많은 멘토는 순차적으로 준비 중이에요.";

export function MentorsListBody(props: {
  filters: MentorsListFilters;
  list: PublicMentorsListResult;
  favoriteIds: string[];
  isLoggedIn: boolean;
}) {
  const { filters, list } = props;
  const hrefBase = filtersToHrefRecord(filters);
  const favoriteSet = new Set(props.favoriteIds);
  const showListHint = list.onlySelfVisibleHint && list.cards.length === 0;
  const from = list.totalCount === 0 ? 0 : (list.page - 1) * list.pageSize + 1;
  const to = Math.min(list.page * list.pageSize, list.totalCount);

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
    <div className="mx-auto w-full max-w-[1600px] min-w-0 px-4 pb-12 sm:px-5 lg:px-6">
      <header className="mb-6 border-b border-slate-100 pb-5">
        <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-[#1A56DB]">멤버십</p>
        <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">멘토 찾기</h1>
        <p className="mt-2 max-w-2xl text-sm font-medium leading-relaxed text-slate-600">
          필터와 검색으로 맞는 멘토를 찾고, 프로필에서 구독·질문을 이어가요.
        </p>
      </header>

      <MentorsListTopFilterBar filters={filters} />

      <div className="mt-6 flex flex-col gap-6 lg:grid lg:grid-cols-12 lg:items-start">
        <aside className="hidden lg:col-span-3 lg:block lg:sticky lg:top-6 lg:self-start">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-[15px] font-black text-slate-900">상세 필터</h2>
            <p className="mt-1 text-[11px] font-medium text-slate-500">과목·학교·가격·인증으로 좁혀 보세요.</p>
            <div className="mt-4">
              <MentorsListFilterSidebar filters={filters} />
            </div>
          </div>
        </aside>

        <main className="min-w-0 lg:col-span-9">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
            <p className="text-sm font-bold text-slate-700">
              {list.totalCount > 0 ? (
                <>
                  총 <span className="font-black text-[#1A56DB]">{list.totalCount}</span>명 · {from}–{to}번째
                </>
              ) : (
                "조건에 맞는 멘토 0명"
              )}
            </p>
            {list.profilesError ? (
              <p className="text-[11px] font-medium text-amber-800">일부 프로필 정보가 누락될 수 있어요.</p>
            ) : null}
          </div>

          {showListHint ? (
            <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50/90 px-4 py-3 text-sm text-slate-700">
              {COPY_PUBLIC_LIST_HINT}
            </div>
          ) : null}

          {list.cards.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 p-10 text-center">
              <p className="text-lg font-black text-slate-900">조건에 맞는 멘토가 없어요</p>
              <p className="mt-2 text-sm text-slate-600">필터를 조정하거나 검색어를 바꿔 보세요.</p>
              <Link href="/mentors" className="mt-4 inline-block text-sm font-bold text-[#1A56DB] underline">
                필터 초기화
              </Link>
            </div>
          ) : (
            <>
              <MentorGrid cards={list.cards} favoriteIds={favoriteSet} isLoggedIn={props.isLoggedIn} />
              <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                {list.page > 1 ? (
                  <Link
                    href={mentorsListHref(hrefBase, { page: String(list.page - 1) })}
                    className="min-h-[44px] rounded-xl border border-slate-200 bg-white px-5 text-sm font-extrabold text-slate-800 hover:bg-slate-50"
                  >
                    이전
                  </Link>
                ) : null}
                <span className="text-sm font-bold text-slate-500">
                  {list.page} / {Math.max(1, Math.ceil(list.totalCount / list.pageSize))}
                </span>
                {list.hasMore ? (
                  <Link
                    href={mentorsListHref(hrefBase, { page: String(list.page + 1) })}
                    className="min-h-[44px] rounded-xl bg-[#1A56DB] px-6 text-sm font-extrabold text-white hover:bg-[#1648c0]"
                  >
                    더 보기
                  </Link>
                ) : null}
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
