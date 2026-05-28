import { CommunityHomeSections } from "@/components/community/CommunityHomeSections";
import { CommunityLayoutShell } from "@/components/community/CommunityLayoutShell";
import { getServerUserWithProfile } from "@/lib/auth/getServerUserWithProfile";
import { createClient } from "@/lib/supabase/server";
import { listCommunityBoardPosts, listBoardPostsThisWeek } from "@/lib/community/communityBoardQueries";
import { listShortformFeed } from "@/lib/community/communityShortformQueries";
import { loadCommunityWeeklyTopMentor } from "@/lib/community/communitySidebarData";

export default async function CommunityLandingPage() {
  const { user, profile } = await getServerUserWithProfile();
  const supabase = await createClient();

  const [shortform, popular, weekly, weeklyMentor] = await Promise.all([
    listShortformFeed(supabase, { limit: 5 }),
    listCommunityBoardPosts(supabase, { limit: 5 }),
    listBoardPostsThisWeek(supabase, 3),
    loadCommunityWeeklyTopMentor(supabase),
  ]);

  if (shortform.error) console.error("[community] shortform", shortform.error);
  if (popular.error) console.error("[community] popular posts", popular.error);
  if (weekly.error) console.error("[community] weekly posts", weekly.error);

  return (
    <CommunityLayoutShell activeNav="home" weeklyTopMentor={weeklyMentor}>
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
        weeklyPosts={weekly.posts}
        weeklyError={weekly.error}
        viewerRole={profile?.role}
        loggedIn={Boolean(user)}
      />
    </CommunityLayoutShell>
  );
}
