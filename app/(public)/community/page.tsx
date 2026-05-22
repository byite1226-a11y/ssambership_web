import { Suspense } from "react";
import { CommunityHomeFeed } from "@/components/community/CommunityHomeFeed";
import { CommunityLayoutShell } from "@/components/community/CommunityLayoutShell";
import { getServerUserWithProfile } from "@/lib/auth/getServerUserWithProfile";
import { createClient } from "@/lib/supabase/server";
import type { CommunityPostCategorySlug } from "@/lib/community/communityBoardConstants";
import { listCommunityBoardPosts, listPopularHashtags, listWeeklyPopularPosts } from "@/lib/community/communityBoardQueries";
import { communitySidebarStatsForUser, loadCommunityPopularMentors } from "@/lib/community/communitySidebarData";

type Props = { searchParams?: Promise<Record<string, string | string[] | undefined>> };

export default async function CommunityLandingPage(props: Props) {
  const sp = (await props.searchParams) ?? {};
  const catRaw = sp.category;
  const category = (typeof catRaw === "string" ? catRaw : "all") as CommunityPostCategorySlug;

  const { user } = await getServerUserWithProfile();
  const supabase = await createClient();

  const [feed, tags, popular, mentors, sidebarStats] = await Promise.all([
    listCommunityBoardPosts(supabase, { category, limit: 12 }),
    listPopularHashtags(supabase, 6),
    listWeeklyPopularPosts(supabase, 3),
    loadCommunityPopularMentors(supabase),
    communitySidebarStatsForUser(supabase, user?.id ?? null),
  ]);

  if (feed.error) console.error("[community] feed", feed.error);

  return (
    <CommunityLayoutShell
      activeNav="home"
      rightAsidePromo="home"
      sidebarStats={sidebarStats}
      hashtags={tags.rows}
      popularPosts={popular.posts}
      popularMentors={mentors}
    >
      <header className="rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
        <h1 className="text-xl font-black text-slate-900">쌤버십 커뮤니티</h1>
        <p className="mt-1 text-sm text-slate-600">
          학습법, 내신, 진로 이야기를 나누고 멘토와 연결해 보세요.
        </p>
      </header>
      <Suspense fallback={<p className="text-sm text-slate-500">불러오는 중…</p>}>
        <CommunityHomeFeed
          initialPosts={feed.posts}
          initialCursor={feed.nextCursor}
          initialCategory={category}
          basePath="/community"
        />
      </Suspense>
    </CommunityLayoutShell>
  );
}
