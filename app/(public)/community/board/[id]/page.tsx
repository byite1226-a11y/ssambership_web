import { PageScaffold } from "@/components/shell/PageScaffold";
import { CommunityPostDetail } from "@/components/community/CommunityPostDetail";
import { createClient } from "@/lib/supabase/server";
import { COMMUNITY_DATA_POINTS, getBoardPost, pickTitle } from "@/lib/community/communityQueries";

type Props = { params: Promise<{ id: string }> };

export default async function CommunityBoardDetailPage(props: Props) {
  const { id } = await props.params;
  const supabase = await createClient();
  const { row, error, table } = await getBoardPost(supabase, id);

  return (
    <PageScaffold
      eyebrow="Public / Community / Board / Detail"
      title="게시글"
      description="community_posts 1건. 숏폼과 분리."
      ctas={[
        { href: "/community/board", label: "목록", tone: "slate" },
        { href: "/community", label: "홈", tone: "slate" },
      ]}
      sections={[
        { title: "본문", body: "community_posts.", status: "skeleton" },
        { title: "댓글", body: "comments.", status: "skeleton" },
        { title: "신고", body: "reports CTA.", status: "skeleton" },
        { title: "출처", body: "source/rights 필드 (작성 시).", status: "skeleton" },
      ]}
      emptyState="권한/없음."
      loadingState="RSC."
      errorState="오류."
      dataPoints={[...COMMUNITY_DATA_POINTS]}
    >
      <CommunityPostDetail
        variant="board"
        postId={id}
        title={row ? pickTitle(row) : "게시글"}
        row={row}
        error={error}
        table={table}
        backHref="/community/board"
        listLabel="게시판 목록"
      />
    </PageScaffold>
  );
}
