import { CommunityLayoutShell } from "@/components/community/CommunityLayoutShell";
import { CommunityPageHero } from "@/components/community/CommunityPageHero";
import { CommunityPostDetail } from "@/components/community/CommunityPostDetail";
import { getServerAuthUser } from "@/lib/auth/getCurrentUser";
import { createClient } from "@/lib/supabase/server";
import { getShortformPost, loadCommunityComments, pickTitle } from "@/lib/community/communityQueries";

type Props = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function CommunityShortformDetailPage(props: Props) {
  const { id } = await props.params;
  const sp = (await props.searchParams) ?? {};
  const cErr = sp.commentError;
  const commentErrorCode = typeof cErr === "string" ? cErr : Array.isArray(cErr) ? cErr[0] : null;

  const supabase = await createClient();
  const { user } = await getServerAuthUser();
  const canComment = user != null;

  const { row, error } = await getShortformPost(supabase, id);
  const { rows: comments, error: commentsQueryError } = row
    ? await loadCommunityComments(supabase, "shortform", id)
    : { rows: [], error: null as string | null };
  const returnPath = `/community/shortform/${id}`;

  return (
    <CommunityLayoutShell
      activeNav="shortform"
      hero={
        <CommunityPageHero
          eyebrow="커뮤니티 · 숏폼"
          title="숏폼"
          description="짧은 영상과 함께 읽는 커뮤니티 글이에요."
          ctas={[
            { href: "/community/shortform", label: "목록", tone: "slate" },
            { href: "/community", label: "커뮤니티 홈", tone: "slate" },
          ]}
        />
      }
    >
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <CommunityPostDetail
          variant="shortform"
          postId={id}
          returnPath={returnPath}
          title={row ? pickTitle(row) : "숏폼"}
          row={row}
          error={error}
          backHref="/community/shortform"
          listLabel="숏폼 목록"
          comments={comments}
          commentsQueryError={commentsQueryError}
          canComment={canComment}
          commentErrorCode={commentErrorCode}
        />
      </div>
    </CommunityLayoutShell>
  );
}
