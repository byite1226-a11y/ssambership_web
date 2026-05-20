import { CommunityBoardDetail } from "@/components/community/CommunityBoardDetail";
import { CommunityLayoutShell } from "@/components/community/CommunityLayoutShell";
import { getServerUserWithProfile } from "@/lib/auth/getServerUserWithProfile";
import { createClient } from "@/lib/supabase/server";
import {
  getCommunityBoardPost,
  getPostReactionFlags,
  loadBoardComments,
  listPopularHashtags,
} from "@/lib/community/communityBoardQueries";
import { isCommunityPostUuid } from "@/lib/community/communityQueries";
import { incrementPostView } from "@/lib/community/communityBoardMutations";
import { communitySidebarStatsForUser, loadCommunityPopularMentors } from "@/lib/community/communitySidebarData";

type Props = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function CommunityBoardDetailPage(props: Props) {
  const { id } = await props.params;
  const sp = (await props.searchParams) ?? {};
  const commentErrorCode = typeof sp.commentError === "string" ? sp.commentError : null;
  const reportOk = sp.reportOk === "1" || sp.reportOk === "true";
  const reportErrorCode = typeof sp.reportError === "string" ? sp.reportError : null;

  const supabase = await createClient();
  const { user } = await getServerUserWithProfile();
  const loggedIn = user != null;
  const returnPath = `/community/board/${id}`;

  const idOk = isCommunityPostUuid(id);
  let post = null;
  let row: Record<string, unknown> | null = null;
  let loadError: string | null = null;

  if (idOk) {
    const res = await getCommunityBoardPost(supabase, id);
    if (res.error) {
      loadError = "\uAC8C\uC2DC\uAE00\uC744 \uBD88\uB7EC\uC624\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4.";
    } else if (res.post && res.row) {
      post = res.post;
      row = res.row;
      await incrementPostView(supabase, id);
    }
  }

  const missing = !idOk || (!post && !loadError);
  const { nodes: comments, error: commentsError } = post
    ? await loadBoardComments(supabase, id, user?.id ?? null)
    : { nodes: [], error: null };

  const reactions = post ? await getPostReactionFlags(supabase, id, user?.id ?? null) : { liked: false, scrapped: false };

  const [tags, mentors] = await Promise.all([listPopularHashtags(supabase, 6), loadCommunityPopularMentors(supabase)]);

  return (
    <CommunityLayoutShell
      activeNav="board"
      rightAsidePromo="board"
      sidebarStats={communitySidebarStatsForUser(user?.id ?? null)}
      hashtags={tags.rows}
      popularMentors={mentors}
    >
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        {loadError ? <p className="text-sm font-semibold text-red-800">{loadError}</p> : null}
        {missing ? (
          <p className="text-sm text-slate-600">{"\uAC8C\uC2DC\uAE00\uC744 \uCC3E\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4."}</p>
        ) : post && row ? (
          <CommunityBoardDetail
            post={post}
            row={row}
            postId={id}
            returnPath={returnPath}
            comments={comments}
            commentsError={commentsError}
            canInteract={loggedIn}
            liked={reactions.liked}
            scrapped={reactions.scrapped}
            commentErrorCode={commentErrorCode}
            reportOk={reportOk}
            reportErrorCode={reportErrorCode}
          />
        ) : null}
      </div>
    </CommunityLayoutShell>
  );
}
