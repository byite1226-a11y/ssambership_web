import Link from "next/link";
import { CommunityLayoutShell } from "@/components/community/CommunityLayoutShell";
import { CommunityPageHero } from "@/components/community/CommunityPageHero";
import { getServerUserWithProfile } from "@/lib/auth/getServerUserWithProfile";
import { buildCommunityHeroCtas } from "@/lib/community/communityHeroActions";
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

export default async function CommunityMePage() {
  const { user, profile } = await getServerUserWithProfile();
  const loggedIn = user != null;
  const role = profile?.role;

  return (
    <CommunityLayoutShell
      activeNav="me"
      hero={
        <CommunityPageHero
          eyebrow="커뮤니티"
          title="내 공간"
          description={meDescription(role, loggedIn)}
          ctas={buildCommunityHeroCtas({
            surface: "me",
            role,
            loggedIn,
            nextPath: "/community/me",
          })}
        />
      }
    >
      <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-700 shadow-sm">
        {loggedIn ? (
          <p>로그인되었습니다. 왼쪽 메뉴에서 커뮤니티 홈·게시판·숏폼 영상을 둘러보실 수 있어요.</p>
        ) : (
          <p>
            <Link href={`/login?next=${encodeURIComponent("/community/me")}`} className="font-bold text-blue-800 underline">
              로그인
            </Link>
            후 이 영역에서 개인화 기능을 이용할 수 있습니다.
          </p>
        )}
      </div>
    </CommunityLayoutShell>
  );
}
