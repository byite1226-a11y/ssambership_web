import { CommunityLayoutShell } from "@/components/community/CommunityLayoutShell";
import { CommunityMeTabPanels, type CommunityMeActivityPayload } from "@/components/community/CommunityMeTabPanels";
import { CommunityMeOverviewSections } from "@/components/community/CommunityMeOverviewSections";
import { CommunityPageHero } from "@/components/community/CommunityPageHero";
import { getServerUserWithProfile } from "@/lib/auth/getServerUserWithProfile";
import { buildCommunityHeroPrimaryAction } from "@/lib/community/communityHeroActions";
import {
  buildCommunityMePostsList,
  countMyCommunityBoardPosts,
  countMyShortformPosts,
  loadMyCommunityBoardPosts,
  loadMyShortformPosts,
} from "@/lib/community/communityQueries";
import { communityMePath, parseCommunityMeTab } from "@/lib/community/communityMeTab";
import { createClient } from "@/lib/supabase/server";
import type { AppRole } from "@/lib/types/user";

function meDescription(role: AppRole | null | undefined, loggedIn: boolean): string {
  if (role === "mentor") {
    return "작성한 글·숏폼과 활동 요약을 탭으로 나눠 확인해 보세요.";
  }
  if (!loggedIn) {
    return "내 커뮤니티 활동은 로그인 후 이어갈 수 있어요.";
  }
  return "참여한 활동과 내 글을 탭에서 확인하세요.";
}

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function CommunityMePage(props: PageProps) {
  const sp = (await props.searchParams) ?? {};
  const tab = parseCommunityMeTab(sp.tab);
  const loginNextPath = communityMePath(tab);

  const { user, profile } = await getServerUserWithProfile();
  const loggedIn = user != null;
  const role = profile?.role;

  let activity: CommunityMeActivityPayload | null = null;
  if (loggedIn && user?.id) {
    const supabase = await createClient();
    const uid = user.id;
    const [boardRes, shortRes, boardCount, shortCount] = await Promise.all([
      loadMyCommunityBoardPosts(supabase, uid, 120),
      loadMyShortformPosts(supabase, uid, 120),
      countMyCommunityBoardPosts(supabase, uid),
      countMyShortformPosts(supabase, uid),
    ]);
    if (boardRes.error) console.error("[community/me] loadMyCommunityBoardPosts", boardRes.error);
    if (shortRes.error) console.error("[community/me] loadMyShortformPosts", shortRes.error);
    const loadFailed = Boolean(boardRes.error || shortRes.error);
    activity = {
      myPosts: buildCommunityMePostsList(boardRes.rows, shortRes.rows, 200),
      boardCount: boardCount,
      shortformCount: shortCount,
      recent: buildCommunityMePostsList(boardRes.rows, shortRes.rows, 3),
      loadFailed,
    };
  }

  return (
    <CommunityLayoutShell
      activeNav="me"
      hero={
        <CommunityPageHero
          eyebrow="커뮤니티"
          title="내 활동"
          description={meDescription(role, loggedIn)}
          primaryAction={buildCommunityHeroPrimaryAction({
            surface: "me",
            role,
            loggedIn,
            nextPath: loginNextPath,
          })}
        />
      }
    >
      <div className="space-y-5">
        <div className="rounded-xl border border-slate-200 bg-slate-50/90 px-4 py-3 text-sm text-slate-700 shadow-inner">
          <p className="font-extrabold text-slate-900">내 활동 안내</p>
          <p className="mt-1 text-xs leading-relaxed text-slate-600 sm:text-sm">
            {loggedIn
              ? "「내 게시글」에서 작성한 항목을 모아 볼 수 있어요. 스크랩·팔로우는 데이터 연결 전까지 짧은 안내만 보일 수 있어요."
              : "탭으로 영역을 나눠 두었어요. 로그인 후 내 글과 참여 내역을 이어 확인할 수 있어요."}
          </p>
        </div>

        {tab === "overview" ? (
          <CommunityMeOverviewSections activity={activity} />
        ) : (
          <CommunityMeTabPanels tab={tab} loggedIn={loggedIn} role={role} loginNextPath={loginNextPath} activity={activity} />
        )}
      </div>
    </CommunityLayoutShell>
  );
}
