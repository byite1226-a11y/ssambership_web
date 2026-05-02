import { CommunityHomeContent } from "@/components/community/CommunityHomeContent";
import { CommunityLayoutShell } from "@/components/community/CommunityLayoutShell";
import { CommunityPageHero } from "@/components/community/CommunityPageHero";
import { getServerUserWithProfile } from "@/lib/auth/getServerUserWithProfile";
import { buildCommunityHeroCtas } from "@/lib/community/communityHeroActions";
import type { AppRole } from "@/lib/types/user";
import { createClient } from "@/lib/supabase/server";
import { listBoardPosts, listShortformPosts } from "@/lib/community/communityQueries";

function communityHomeDescription(role: AppRole | null | undefined, loggedIn: boolean): string {
  if (role === "mentor") {
    return "멘토의 짧은 영상(숏폼)과 게시판을 한곳에서 관리·탐색할 수 있어요. 아래에서 새 게시글과 숏폼을 등록해 보세요.";
  }
  if (!loggedIn) {
    return "멘토의 짧은 영상(숏폼)과 게시글을 둘러볼 수 있어요. 댓글·스크랩은 로그인 후 이용할 수 있습니다.";
  }
  return "멘토의 짧은 영상과 게시글을 둘러보고, 댓글과 스크랩으로 학습 팁을 모아보세요. 좋은 콘텐츠는 스크랩하고, 문제가 있으면 신고해 주세요.";
}

export default async function CommunityLandingPage() {
  const { user, profile } = await getServerUserWithProfile();
  const loggedIn = user != null;
  const role = profile?.role;

  const supabase = await createClient();
  const [sh, br] = await Promise.all([listShortformPosts(supabase, 12), listBoardPosts(supabase, 16)]);
  if (sh.error) console.error("[community] listShortformPosts", sh.error);
  if (br.error) console.error("[community] listBoardPosts", br.error);

  return (
    <CommunityLayoutShell
      activeNav="home"
      hero={
        <CommunityPageHero
          eyebrow="커뮤니티"
          title="함께하는 학습 공간"
          description={communityHomeDescription(role, loggedIn)}
          ctas={buildCommunityHeroCtas({
            surface: "home",
            role,
            loggedIn,
            nextPath: "/community",
          })}
        />
      }
    >
      <CommunityHomeContent
        shortRows={sh.rows}
        shortFetchFailed={Boolean(sh.error)}
        boardRows={br.rows}
        boardFetchFailed={Boolean(br.error)}
      />
    </CommunityLayoutShell>
  );
}
