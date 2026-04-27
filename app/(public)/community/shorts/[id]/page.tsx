import { PageScaffold } from "@/components/shell/PageScaffold";
import { CommunityPostDetail } from "@/components/community/CommunityPostDetail";
import { createClient } from "@/lib/supabase/server";
import { COMMUNITY_DATA_POINTS, getShortformPost, pickTitle } from "@/lib/community/communityQueries";

type Props = { params: Promise<{ id: string }> };

export default async function CommunityShortDetailPage(props: Props) {
  const { id } = await props.params;
  const supabase = await createClient();
  const { row, error, table } = await getShortformPost(supabase, id);

  return (
    <PageScaffold
      eyebrow="Public / Community / Shorts / Detail"
      title="숏폼 상세"
      description="shortform_posts 1건. 게시판 상세와 분리."
      ctas={[
        { href: "/community/shorts", label: "목록", tone: "slate" },
        { href: "/community", label: "홈", tone: "slate" },
      ]}
      sections={[
        { title: "본문", body: "shortform.", status: "skeleton" },
        { title: "작성자", body: "role 뱃지.", status: "skeleton" },
        { title: "반응", body: "좋아요/댓글 자리.", status: "skeleton" },
        { title: "신고", body: "reports CTA.", status: "skeleton" },
      ]}
      emptyState="없는 id면 안내."
      loadingState="RSC."
      errorState="조회 실패."
      dataPoints={[...COMMUNITY_DATA_POINTS]}
    >
      <CommunityPostDetail
        variant="shortform"
        postId={id}
        title={row ? pickTitle(row) : "숏폼"}
        row={row}
        error={error}
        table={table}
        backHref="/community/shorts"
        listLabel="숏폼 목록"
      />
    </PageScaffold>
  );
}
