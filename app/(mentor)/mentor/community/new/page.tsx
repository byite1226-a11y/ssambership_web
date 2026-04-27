import { PageScaffold } from "@/components/shell/PageScaffold";
import { MentorCommunityComposeForm } from "@/components/community/MentorCommunityComposeForm";
import { COMMUNITY_DATA_POINTS } from "@/lib/community/communityQueries";

type PageProps = {
  searchParams?: Promise<{ error?: string }>;
};

export default async function MentorCommunityNewPage(props: PageProps) {
  const sp = (await props.searchParams) ?? {};
  const errorMessage = typeof sp.error === "string" && sp.error.length ? sp.error : null;

  return (
    <PageScaffold
      eyebrow="Mentor / Community / New"
      title="커뮤니티 작성"
      description="멘토 전용 작성. 숏폼(shortform_posts)과 게시판(community_posts) 중 선택해 저장합니다. 질문방·캐시와 무관."
      ctas={[
        { href: "/community/shorts", label: "숏폼 보기", tone: "slate" },
        { href: "/community/board", label: "게시판 보기", tone: "slate" },
        { href: "/mentor/dashboard", label: "대시보드", tone: "slate" },
      ]}
      sections={[
        { title: "제출", body: "submitMentorCommunityPost → shortform_posts | community_posts.", status: "connected" },
        { title: "권한", body: "requireRole(mentor) + RLS", status: "connected" },
        { title: "권리·출처", body: "source + rightsAck 필수.", status: "connected" },
        { title: "검수", body: "admin·reports 연동 예정.", status: "skeleton" },
      ]}
      emptyState="—"
      loadingState="—"
      errorState="—"
      dataPoints={[...COMMUNITY_DATA_POINTS]}
    >
      <MentorCommunityComposeForm errorMessage={errorMessage} />
    </PageScaffold>
  );
}
