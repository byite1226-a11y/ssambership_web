import { PageScaffold } from "@/components/shell/PageScaffold";
import { MentorsListBody } from "@/components/mentor/MentorsListBody";
import { PUBLIC_MENTOR_DATA_MODEL, PUBLIC_MENTORS_LIST_DATA_MODEL } from "@/lib/mentor/mentorDataModel";
import { parseMentorsListFilters } from "@/lib/mentor/mentorsListSearchParams";
import { loadPublicMentorsList } from "@/lib/mentor/publicMentorsListQueries";
import { createClient } from "@/lib/supabase/server";

type Props = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function MentorsPage(props: Props) {
  const sp = (await props.searchParams) ?? {};
  const filters = parseMentorsListFilters(sp);
  const supabase = await createClient();
  const list = await loadPublicMentorsList(supabase, filters);

  return (
    <PageScaffold
      eyebrow="Public / Mentors"
      title="멘토 찾기"
      description="users(role=mentor) + mentor_profiles 배치 + reviews/plans 보강. 비로그인 접근 가능(데이터는 RLS에 따름). 더미 없음."
      ctas={[
        { href: `/login?next=${encodeURIComponent("/mentors")}`, label: "로그인·이용", tone: "slate" },
      ]}
      sections={[
        {
          title: "검색·필터·정렬",
          body: "GET 쿼리스트링 · subjects taxonomy는 후속.",
          status: "connected",
        },
        {
          title: "카드 그리드",
          body: `${list.cards.length}건 표시(상한 적용)`,
          status: list.usersError ? "skeleton" : "connected",
        },
        {
          title: "리뷰/요금제",
          body: "배치 probe — reviews_summary 우선.",
          status: "connected",
        },
        {
          title: "상세",
          body: "/mentors/[mentorId] 동일 display 매퍼.",
          status: "connected",
        },
      ]}
      emptyState="결과 없음 시 RLS·필터 안내."
      loadingState="loading.tsx 스켈레톤."
      errorState="users 조회 오류 시 본문 에러 박스."
      dataPoints={[...PUBLIC_MENTORS_LIST_DATA_MODEL, ...PUBLIC_MENTOR_DATA_MODEL]}
    >
      <MentorsListBody filters={filters} list={list} />
    </PageScaffold>
  );
}
