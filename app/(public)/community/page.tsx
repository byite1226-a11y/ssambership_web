import { CommunityHomeSections } from "@/components/community/CommunityHomeSections";
import { CommunityLayoutShell } from "@/components/community/CommunityLayoutShell";
import { getServerUserWithProfile } from "@/lib/auth/getServerUserWithProfile";
import { createClient } from "@/lib/supabase/server";
import { listCommunityBoardPosts } from "@/lib/community/communityBoardQueries";
import { listShortformFeed } from "@/lib/community/communityShortformQueries";

export default async function CommunityLandingPage() {
  const { user, profile } = await getServerUserWithProfile();
  const supabase = await createClient();

  const [shortform, popular] = await Promise.all([
    listShortformFeed(supabase, { limit: 5 }),
    listCommunityBoardPosts(supabase, { limit: 5 }),
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
