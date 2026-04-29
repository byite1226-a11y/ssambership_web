import Link from "next/link";
import type { MentorsListFilters } from "@/lib/mentor/mentorsListSearchParams";
import { filtersToHrefRecord } from "@/lib/mentor/mentorsListSearchParams";
import { PUBLIC_MENTORS_RLS_HINT, type PublicMentorsListResult } from "@/lib/mentor/publicMentorsListQueries";
import { MentorFilterPanel } from "@/components/mentor/MentorFilterPanel";
import { MentorGrid } from "@/components/mentor/MentorGrid";
import { MentorsListSidebar } from "@/components/mentor/MentorsListSidebar";
import { MentorSearchBar } from "@/components/mentor/MentorSearchBar";
import { MentorSortBar } from "@/components/mentor/MentorSortBar";

export function MentorsListBody(props: { filters: MentorsListFilters; list: PublicMentorsListResult }) {
  const { filters, list } = props;
  const hrefBase = filtersToHrefRecord(filters);

  if (list.usersError) {
    return (
      <div className="space-y-4">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
          <p className="text-sm font-extrabold text-red-900">목록을 불러오지 못했습니다</p>
          <p className="mt-1 text-sm text-red-800 break-words">{list.usersError}</p>
        </div>
        <details className="rounded-xl border border-slate-200 bg-white p-4 text-xs text-slate-600">
          <summary className="cursor-pointer font-bold text-slate-800">연결 진단(개발·운영)</summary>
          <ProbeList probes={list.probes} />
        </details>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-6 lg:grid lg:grid-cols-12 lg:items-start lg:gap-6">
        <aside className="order-1 min-w-0 space-y-3 lg:col-span-3 lg:sticky lg:top-4 lg:self-start">
          <form method="get" action="/mentors" className="space-y-3">
            <MentorSearchBar defaultValue={filters.q} />
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <h2 className="text-sm font-extrabold text-slate-900">필터</h2>
              <p className="mt-0.5 text-xs text-slate-500">이름·학과·인증 키워드로 좁힐 수 있어요</p>
              <div className="mt-3">
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

        <div className="order-2 min-w-0 space-y-4 lg:col-span-6">
          <MentorSortBar current={hrefBase} active={filters.sort} />

          {list.profilesError ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              <p className="font-extrabold">일부 멘토 메타를 불러오지 못했을 수 있어요</p>
              <p className="mt-1 text-xs break-words opacity-90">mentor_profiles: {list.profilesError}</p>
            </div>
          ) : null}

          {list.onlySelfVisibleHint ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
              현재 세션에서 보이는 멘토가 본인만일 수 있어요. {PUBLIC_MENTORS_RLS_HINT}
            </div>
          ) : null}

          {list.cards.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 sm:p-8">
              <p className="text-base font-extrabold text-slate-900 sm:text-lg">조건에 맞는 멘토가 없어요</p>
              <p className="mt-2 min-h-[1.25rem] text-sm leading-relaxed text-slate-600">
                멘토 데이터가 아직 충분하지 않거나, 필터가 너무 좁을 수 있어요. 조건을 바꿔 다시 시도하거나, 잠시 후에 다시
                확인해 주세요.
              </p>
              <p className="mt-3 text-xs text-slate-500">{PUBLIC_MENTORS_RLS_HINT}</p>
            </div>
          ) : (
            <MentorGrid cards={list.cards} />
          )}
        </div>

        <aside className="order-3 min-w-0 lg:col-span-3 lg:sticky lg:top-4 lg:self-start">
          <MentorsListSidebar cards={list.cards} />
        </aside>
      </div>

      <details className="rounded-xl border border-slate-200 bg-white p-4 text-xs text-slate-600">
        <summary className="cursor-pointer text-sm font-extrabold text-slate-800">Supabase·데이터 모델(개발/점검)</summary>
        <p className="mt-2 text-slate-500">공개 상세와 동일 필드 매퍼, 리뷰·가격은 서버에서 배치 조회합니다.</p>
        <ProbeList probes={list.probes} />
        <p className="mt-2 text-[11px] text-amber-800">
          멘토 편집 폼의 입력 항목과 일부 라벨은 다를 수 있어요(읽기 전용 표시·후속 정합).
        </p>
      </details>
    </div>
  );
}

function ProbeList(props: { probes: string[] }) {
  return (
    <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-slate-600">
      {props.probes.map((p) => (
        <li key={p} className="break-words">
          {p}
        </li>
      ))}
    </ul>
  );
}
