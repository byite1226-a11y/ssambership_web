import { PageScaffold } from "@/components/shell/PageScaffold";
import { MentorsListBody } from "@/components/mentor/MentorsListBody";
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

  if (list.usersError) {
    console.error("[mentors] PUBLIC MENTOR LIST (USERS) ERROR:", list.usersError, "PROBES:", list.probes);
  }
  if (list.profilesError) {
    console.error("[mentors] PUBLIC MENTOR PROFILE ERROR:", list.profilesError, "PROBES:", list.probes);
  }
  return (
    <PageScaffold
      hideHero
      hideFooterPlaceholderCards
      eyebrow="멤버십"
      title="멘토 찾기"
      description="필터와 검색으로 맞는 멘토를 찾고, 프로필에서 구독·질문을 이어가요."
      ctas={[{ href: `/login?next=${encodeURIComponent("/mentors")}`, label: "로그인", tone: "slate" }]}
      sections={[]}
      dataPoints={[]}
      emptyState=""
      loadingState=""
      errorState=""
    >
      <MentorsListBody filters={filters} list={list} />
    </PageScaffold>
  );
}
