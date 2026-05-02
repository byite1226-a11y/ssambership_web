import { CommunityLayoutShell } from "@/components/community/CommunityLayoutShell";
import { CommunityMeTabNav } from "@/components/community/CommunityMeTabNav";
import { CommunityMeTabPanels } from "@/components/community/CommunityMeTabPanels";
import { CommunityPageHero } from "@/components/community/CommunityPageHero";
import { getServerUserWithProfile } from "@/lib/auth/getServerUserWithProfile";
import { buildCommunityHeroCtas } from "@/lib/community/communityHeroActions";
import { communityMePath, parseCommunityMeTab } from "@/lib/community/communityMeTab";
import type { AppRole } from "@/lib/types/user";

function meDescription(role: AppRole | null | undefined, loggedIn: boolean): string {
  if (role === "mentor") {
    return "게시글·숏폼 작성과 목록 탐색, 내 활동을 한곳에서 이어가 보세요.";
  }
  if (!loggedIn) {
    return "스크랩, 댓글, 팔로우 등 내 커뮤니티 활동은 로그인 후 이용할 수 있어요.";
  }
  return "스크랩, 댓글, 팔로우 등 내 커뮤니티 활동을 확인하세요.";
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

  return (
    <CommunityLayoutShell
      activeNav="me"
      meTab={tab}
      hero={
        <CommunityPageHero
          eyebrow="커뮤니티"
          title="내 공간"
          description={meDescription(role, loggedIn)}
          ctas={buildCommunityHeroCtas({
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
            탭으로 영역을 나눠 두었어요. 실제 스크랩·팔로우 목록은 데이터가 연결되면 각 탭에 표시됩니다.
          </p>
        </div>

        <CommunityMeTabNav active={tab} />

        <CommunityMeTabPanels tab={tab} loggedIn={loggedIn} role={role} loginNextPath={loginNextPath} />
      </div>
    </CommunityLayoutShell>
  );
}
