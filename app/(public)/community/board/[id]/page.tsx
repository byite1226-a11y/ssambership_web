import { PageScaffold } from "@/components/shell/PageScaffold";
import { CommunityPostDetail } from "@/components/community/CommunityPostDetail";
import { getServerAuthUser } from "@/lib/auth/getCurrentUser";
import { createClient } from "@/lib/supabase/server";
import { getBoardPost, loadCommunityComments, pickTitle } from "@/lib/community/communityQueries";

type Props = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function CommunityBoardDetailPage(props: Props) {
  const { id } = await props.params;
  const sp = (await props.searchParams) ?? {};
  const cErr = sp.commentError;
  const commentErrorCode = typeof cErr === "string" ? cErr : Array.isArray(cErr) ? cErr[0] : null;

  const supabase = await createClient();
  const { user } = await getServerAuthUser();
  const canComment = user != null;

  const { row, error } = await getBoardPost(supabase, id);
  const { rows: comments, error: commentsQueryError } = row
    ? await loadCommunityComments(supabase, "board", id)
    : { rows: [], error: null as string | null };
  const returnPath = `/community/board/${id}`;

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
        { title: "댓글", body: "댓글로 소통해 보세요", status: row ? "connected" : "skeleton" },
      ]}
      emptyState="이 게시글이 아직 없거나, 볼 수 없을 수 있어요."
      loadingState="불러오는 중이에요."
      errorState="다시 시도하거나, 목록에서 다른 글을 둘러봐 주세요."
      dataPoints={[]}
    >
      <CommunityPostDetail
        variant="board"
        postId={id}
        returnPath={returnPath}
        title={row ? pickTitle(row) : "게시글"}
        row={row}
        error={error}
        backHref="/community/board"
        listLabel="게시판 목록"
        comments={comments}
        commentsQueryError={commentsQueryError}
        canComment={canComment}
        commentErrorCode={commentErrorCode}
      />
    </PageScaffold>
  );
}
