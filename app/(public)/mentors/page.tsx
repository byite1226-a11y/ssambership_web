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
      eyebrow="멤버십"
      title="멘토 찾기"
      description="멘토를 둘러보고, 상세에서 구독·질문으로 이어가요. 공개 읽기 범위는 정책(로그인·RLS)에 따릅니다. 더 데이터가 없는 경우엔 ‘준비 중’ 안내로 표시돼요."
      ctas={[
        { href: `/login?next=${encodeURIComponent("/mentors")}`, label: "로그인", tone: "slate" },
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
