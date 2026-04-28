import { PageScaffold } from "@/components/shell/PageScaffold";
import { CommunityPostDetail } from "@/components/community/CommunityPostDetail";
import { createClient } from "@/lib/supabase/server";
import { getBoardPost, pickTitle } from "@/lib/community/communityQueries";

type Props = { params: Promise<{ id: string }> };

export default async function CommunityBoardDetailPage(props: Props) {
  const { id } = await props.params;
  const supabase = await createClient();
  const { row, error } = await getBoardPost(supabase, id);

  return (
    <PageScaffold
      eyebrow="커뮤니티 · 게시글"
      title="게시글"
      description="멘토와 학습자가 올린 게시글을 확인해 보세요."
      ctas={[
        { href: "/community/board", label: "목록", tone: "slate" },
        { href: "/community", label: "홈", tone: "slate" },
      ]}
      sections={[
        { title: "글", body: "제목·본문·작성자 정보", status: row ? "connected" : "skeleton" },
        { title: "소통", body: "댓글·신고는 순차 지원됩니다.", status: "skeleton" },
      ]}
      emptyState="이 게시글이 아직 없거나, 볼 수 없을 수 있어요."
      loadingState="불러오는 중이에요."
      errorState="다시 시도하거나, 목록에서 다른 글을 둘러봐 주세요."
      dataPoints={[]}
    >
      <CommunityPostDetail
        variant="board"
        title={row ? pickTitle(row) : "게시글"}
        row={row}
        error={error}
        backHref="/community/board"
        listLabel="게시판 목록"
      />
    </PageScaffold>
  );
}
