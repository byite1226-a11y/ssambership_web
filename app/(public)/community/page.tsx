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

  const [feed, tags, popular, mentors] = await Promise.all([
    listCommunityBoardPosts(supabase, { category, limit: 12 }),
    listPopularHashtags(supabase, 6),
    listWeeklyPopularPosts(supabase, 3),
    loadCommunityPopularMentors(supabase),
  ]);

  if (feed.error) console.error("[community] feed", feed.error);

  return (
    <CommunityLayoutShell
      activeNav="home"
      rightAsidePromo="home"
      sidebarStats={communitySidebarStatsForUser(user?.id ?? null)}
      hashtags={tags.rows}
      popularPosts={popular.posts}
      popularMentors={mentors}
    >
      <header className="rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
        <h1 className="text-xl font-black text-slate-900">{"\uC258\uBC84\uC2ED \uCEE4\uBAE0\uB2C8\uD2F0"}</h1>
        <p className="mt-1 text-sm text-slate-600">
          {"\uD559\uC2B5\uBC95, \uB0B4\uC2E0, \uC9C4\uB85C \uC774\uC57C\uAE30\uB97C \uB098\uB204\uACE0 \uBA58\uD1A0\uC640 \uC5F0\uACB0\uD574 \uBCF4\uC138\uC694."}
        </p>
      </header>
      <Suspense fallback={<p className="text-sm text-slate-500">{"\uBD88\uB7EC\uC624\uB294 \uC911\u2026"}</p>}>
        <CommunityHomeFeed initialPosts={feed.posts} initialCursor={feed.nextCursor} initialCategory={category} />
      </Suspense>
    </CommunityLayoutShell>
  );
}
