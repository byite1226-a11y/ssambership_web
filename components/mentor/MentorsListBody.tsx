import Link from "next/link";
import type { MentorsListFilters } from "@/lib/mentor/mentorsListSearchParams";
import { filtersToHrefRecord } from "@/lib/mentor/mentorsListSearchParams";
import { PUBLIC_MENTORS_RLS_HINT, type PublicMentorsListResult } from "@/lib/mentor/publicMentorsListQueries";
import { MentorFilterPanel } from "@/components/mentor/MentorFilterPanel";
import { MentorGrid } from "@/components/mentor/MentorGrid";
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
          <p className="mt-1 text-sm text-red-800">{list.usersError}</p>
        </div>
        <ProbeList probes={list.probes} />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <form method="get" action="/mentors" className="space-y-3">
        <MentorSearchBar defaultValue={filters.q} />
        <MentorFilterPanel
          universityDefault={filters.university}
          subjectDefault={filters.subject}
          verificationDefault={filters.verification}
        />
        {filters.sort !== "new" ? <input type="hidden" name="sort" value={filters.sort} /> : null}
        <div className="flex flex-wrap gap-2">
          <button type="submit" className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-bold text-white hover:bg-slate-800">
            필터 적용
          </button>
          <Link href="/mentors" className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-bold text-slate-800">
            초기화
          </Link>
        </div>
      </form>

      <MentorSortBar current={hrefBase} active={filters.sort} />

      {list.profilesError ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-900">
          mentor_profiles: {list.profilesError}
        </div>
      ) : null}

      {list.onlySelfVisibleHint ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          현재 세션에서 보이는 멘토가 본인 한 명뿐입니다. {PUBLIC_MENTORS_RLS_HINT}
        </div>
      ) : null}

      {list.cards.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-8">
          <p className="text-lg font-extrabold text-slate-900">멘토가 없거나 조건에 맞는 결과가 없습니다</p>
          <p className="mt-2 text-sm text-slate-600">
            필터를 바꾸거나, Supabase 공개 읽기 정책·RPC를 추가하면 비로그인 사용자에게도 목록이 채워집니다.
          </p>
          <p className="mt-3 text-xs font-bold text-slate-700">{PUBLIC_MENTORS_RLS_HINT}</p>
        </div>
      ) : (
        <MentorGrid cards={list.cards} />
      )}

      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <h3 className="text-sm font-extrabold text-slate-900">Supabase 연결 로그</h3>
        <ProbeList probes={list.probes} />
        <p className="mt-3 text-xs text-slate-500">
          공개 상세와 동일 필드: <span className="font-mono">buildMentorProfileDisplay</span> + 평점/리뷰/가격은 배치 probe.
        </p>
        <p className="mt-2 text-xs font-bold text-amber-900">
          편집 폼과 불일치: 이름은 users만(편집 입력 없음), 리뷰·요금제 카드는 목록/상세 전용.
        </p>
      </section>
    </div>
  );
}

function ProbeList(props: { probes: string[] }) {
  return (
    <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-slate-600">
      {props.probes.map((p) => (
        <li key={p}>{p}</li>
      ))}
    </ul>
  );
}
