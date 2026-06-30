import { Suspense } from "react";
import { CommunityHomeFeed } from "@/components/community/CommunityHomeFeed";
import { CommunityLayoutShell } from "@/components/community/CommunityLayoutShell";
import { parseCommunityBoardSortTab } from "@/lib/community/communityBoardSort";
import { createClient } from "@/lib/supabase/server";
import type { CommunityPostCategorySlug } from "@/lib/community/communityBoardConstants";
import { listCommunityBoardPosts } from "@/lib/community/communityBoardQueries";
import { SURFACE_CARD } from "@/lib/ui/surfaceCard";

type Props = { searchParams?: Promise<Record<string, string | string[] | undefined>> };

export default async function CommunityBoardPage(props: Props) {
  const sp = (await props.searchParams) ?? {};
  const catRaw = sp.category;
  const category = (typeof catRaw === "string" ? catRaw : "all") as CommunityPostCategorySlug;
  const sortTab = parseCommunityBoardSortTab(typeof sp.tab === "string" ? sp.tab : undefined);

  const supabase = await createClient();

  const feed = await listCommunityBoardPosts(supabase, { category, limit: 12, sort: sortTab });

  if (feed.error) console.error("[community/board] feed", feed.error);

  return (
    <CommunityLayoutShell activeNav="board">
      <header className={SURFACE_CARD}>
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
          initialSort={sortTab}
          showSortTabs
          basePath="/community/board"
          paginate
        />
      </Suspense>
    </CommunityLayoutShell>
  );
}
