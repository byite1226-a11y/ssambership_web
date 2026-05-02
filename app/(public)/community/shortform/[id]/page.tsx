import { CommunityLayoutShell } from "@/components/community/CommunityLayoutShell";
import { CommunityPageHero } from "@/components/community/CommunityPageHero";
import { CommunityPostDetail } from "@/components/community/CommunityPostDetail";
import { getServerUserWithProfile } from "@/lib/auth/getServerUserWithProfile";
import { buildCommunityHeroCtas } from "@/lib/community/communityHeroActions";
import { createClient } from "@/lib/supabase/server";
import { getShortformPost, isCommunityPostUuid, loadCommunityComments, pickTitle } from "@/lib/community/communityQueries";
import type { AppRole } from "@/lib/types/user";

function shortformDetailDescription(role: AppRole | null | undefined, loggedIn: boolean): string {
  if (role === "mentor") {
    return "멘토가 올린 짧은 영상으로 학습 팁, 후기, 포트폴리오 노하우를 빠르게 확인해 보세요. 새 숏폼은 업로드 메뉴에서 등록할 수 있어요.";
  }
  if (!loggedIn) {
    return "멘토가 올린 짧은 영상으로 학습 팁, 후기, 포트폴리오 노하우를 확인해 보세요. 댓글·스크랩은 로그인 후 이용할 수 있습니다.";
  }
  return "멘토가 올린 짧은 영상으로 학습 팁, 후기, 포트폴리오 노하우를 빠르게 확인해 보세요.";
}

type Props = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function CommunityShortformDetailPage(props: Props) {
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
    const res = await getShortformPost(supabase, id);
    if (res.error) {
      console.error("[community/shortform/detail] getShortformPost", id, res.error);
      loadError = "숏폼을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.";
    } else {
      row = res.row;
    }
  }

  const missingPost = !idOk || (idOk && !row && !loadError);
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
          description={shortformDetailDescription(profile?.role, loggedIn)}
          ctas={buildCommunityHeroCtas({
            surface: "shortform_detail",
            role: profile?.role,
            loggedIn,
            nextPath: returnPath,
          })}
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
          loadError={loadError}
          missingPost={missingPost}
          backHref="/community/shortform"
          listLabel="숏폼 목록"
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
