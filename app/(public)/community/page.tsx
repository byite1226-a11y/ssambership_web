import { CommunityHomeSections } from "@/components/community/CommunityHomeSections";
import { CommunityLayoutShell } from "@/components/community/CommunityLayoutShell";
import { getServerUserWithProfile } from "@/lib/auth/getServerUserWithProfile";
import { createClient } from "@/lib/supabase/server";
import { listCommunityPopularPostsForHome } from "@/lib/community/communityBoardQueries";
import { listShortformFeed } from "@/lib/community/communityShortformQueries";

export default async function CommunityLandingPage() {
  const { user, profile } = await getServerUserWithProfile();
  const supabase = await createClient();

  // G4.1: 추천 숏폼 = 최신순 6개, 인기 게시글 = 좋아요 상위 5개(동률 시 최신). 결정적·랜덤 없음.
  const [shortform, popular] = await Promise.all([
    listShortformFeed(supabase, { limit: 6, sort: "latest" }),
    listCommunityPopularPostsForHome(supabase, 5),
  ]);

  if (shortform.error) console.error("[community] shortform", shortform.error);
  if (popular.error) console.error("[community] popular posts", popular.error);

  return (
    <CommunityLayoutShell activeNav="home">
      <header className="px-1 py-2">
        <h1 className="text-xl font-black text-slate-900">쌤버십 커뮤니티</h1>
        <p className="mt-1 text-sm leading-relaxed text-slate-700">
          학습법, 내신, 진로 이야기를 나누고 멘토와 연결해 보세요.
        </p>
      </header>
      <CommunityHomeSections
        shortforms={shortform.items}
        shortformError={shortform.error}
        popularPosts={popular.posts}
        boardError={popular.error}
        viewerRole={profile?.role}
        loggedIn={Boolean(user)}
      />
    </CommunityLayoutShell>
  );
}
