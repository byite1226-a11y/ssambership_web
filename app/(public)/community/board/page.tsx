import { Suspense } from "react";
import { CommunityHomeFeed } from "@/components/community/CommunityHomeFeed";
import { CommunityLayoutShell } from "@/components/community/CommunityLayoutShell";
import { getServerUserWithProfile } from "@/lib/auth/getServerUserWithProfile";
import { createClient } from "@/lib/supabase/server";
import type { CommunityPostCategorySlug } from "@/lib/community/communityBoardConstants";
import { listCommunityBoardPosts } from "@/lib/community/communityBoardQueries";
import { loadCommunityWeeklyTopMentor } from "@/lib/community/communitySidebarData";

type Props = { searchParams?: Promise<Record<string, string | string[] | undefined>> };

export default async function CommunityBoardPage(props: Props) {
  const sp = (await props.searchParams) ?? {};
  const catRaw = sp.category;
  const category = (typeof catRaw === "string" ? catRaw : "all") as CommunityPostCategorySlug;

  const { user } = await getServerUserWithProfile();
  const supabase = await createClient();

  const [feed, weeklyMentor] = await Promise.all([
    listCommunityBoardPosts(supabase, { category, limit: 12 }),
    loadCommunityWeeklyTopMentor(supabase),
  ]);

  if (feed.error) console.error("[community/board] feed", feed.error);

  return (
    <CommunityLayoutShell activeNav="board" weeklyTopMentor={weeklyMentor}>
      <header className="rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
        <h1 className="text-xl font-black text-slate-900">게시판</h1>
        <p className="mt-1 text-sm text-slate-600">
          공부법, 해설, 후기, 학습 팁을 카테고리별로 모아 봤어요.
        </p>
      </header>
      <Suspense fallback={<p className="text-sm text-slate-500">불러오는 중…</p>}>
        <CommunityHomeFeed
          initialPosts={feed.posts}
          initialCursor={feed.nextCursor}
          initialCategory={category}
          basePath="/community/board"
        />
      </Suspense>
    </CommunityLayoutShell>
  );
}
