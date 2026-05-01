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
      sections={[]}
      dataPoints={[]}
      hideFooterPlaceholderCards
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
