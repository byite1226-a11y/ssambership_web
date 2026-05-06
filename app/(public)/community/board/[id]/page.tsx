import { CommunityLayoutShell } from "@/components/community/CommunityLayoutShell";
import { CommunityPageHero } from "@/components/community/CommunityPageHero";
import { CommunityPostDetail } from "@/components/community/CommunityPostDetail";
import { getServerUserWithProfile } from "@/lib/auth/getServerUserWithProfile";
import { buildCommunityHeroPrimaryAction } from "@/lib/community/communityHeroActions";
import { createClient } from "@/lib/supabase/server";
import { getBoardPost, isCommunityPostUuid, loadCommunityComments, pickTitle } from "@/lib/community/communityQueries";
import type { AppRole } from "@/lib/types/user";

function boardDetailDescription(role: AppRole | null | undefined, loggedIn: boolean): string {
  if (role === "mentor") {
    return "멘토와 학습자가 올린 게시글을 확인해 보세요. 필요하면 새 게시글을 작성할 수 있어요.";
  }
  if (!loggedIn) {
    return "멘토와 학습자가 올린 게시글을 확인해 보세요. 댓글·스크랩은 로그인 후 이용할 수 있습니다.";
  }
  return "멘토와 학습자가 올린 게시글을 확인해 보세요.";
}

type Props = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function CommunityBoardDetailPage(props: Props) {
  const { id } = await props.params;
  const sp = (await props.searchParams) ?? {};
  const cErr = sp.commentError;
  const commentErrorCode = typeof cErr === "string" ? cErr : Array.isArray(cErr) ? cErr[0] : null;
  const reportOkRaw = sp.reportOk;
  const reportOk =
    reportOkRaw === "1" ||
    reportOkRaw === "true" ||
    (Array.isArray(reportOkRaw) && (reportOkRaw[0] === "1" || reportOkRaw[0] === "true"));
  const rErr = sp.reportError;
  const reportErrorCode = typeof rErr === "string" ? rErr : Array.isArray(rErr) ? rErr[0] : null;

  const supabase = await createClient();
  const { user, profile } = await getServerUserWithProfile();
  const loggedIn = user != null;
  const canComment = loggedIn;
  const canReport = loggedIn;

  const idOk = isCommunityPostUuid(id);
  let row: Record<string, unknown> | null = null;
  let loadError: string | null = null;

  if (idOk) {
    const res = await getBoardPost(supabase, id);
    if (res.error) {
      console.error("[community/board/detail] getBoardPost", id, res.error);
      loadError = "게시글을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.";
    } else {
      row = res.row;
    }
  }

  const missingPost = !idOk || (idOk && !row && !loadError);
  const { rows: comments, error: commentsQueryError } = row
    ? await loadCommunityComments(supabase, "board", id)
    : { rows: [], error: null as string | null };
  const returnPath = `/community/board/${id}`;

  return (
    <CommunityLayoutShell
      activeNav="board"
      rightAsidePromo="shortform"
      hero={
        <CommunityPageHero
          eyebrow="커뮤니티 · 게시판"
          title="게시글"
          description={boardDetailDescription(profile?.role, loggedIn)}
          primaryAction={buildCommunityHeroPrimaryAction({
            surface: "board_detail",
            role: profile?.role,
            loggedIn,
            nextPath: returnPath,
          })}
        />
      }
    >
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <CommunityPostDetail
          variant="board"
          postId={id}
          returnPath={returnPath}
          title={row ? pickTitle(row) : "게시글"}
          row={row}
          loadError={loadError}
          missingPost={missingPost}
          backHref="/community/board"
          listLabel="게시판 목록"
          comments={comments}
          commentsQueryError={commentsQueryError}
          canComment={canComment}
          canReport={canReport}
          commentErrorCode={commentErrorCode}
          reportOk={reportOk}
          reportErrorCode={reportErrorCode}
        />
      </div>
    </CommunityLayoutShell>
  );
}
