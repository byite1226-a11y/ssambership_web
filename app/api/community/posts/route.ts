import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { COMMUNITY_POST_PAGE_SIZE } from "@/lib/community/communityBoardConstants";
import { listCommunityBoardPosts, type CommunityBoardFeedSort } from "@/lib/community/communityBoardQueries";
import type { CommunityPostCategorySlug } from "@/lib/community/communityBoardConstants";
import { parseCommunityBoardSortTab } from "@/lib/community/communityBoardSort";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const category = (searchParams.get("category") ?? "all") as CommunityPostCategorySlug;
  const sort = parseCommunityBoardSortTab(searchParams.get("tab") ?? undefined) as CommunityBoardFeedSort;
  const cursor = searchParams.get("cursor");
  const limitRaw = Number(searchParams.get("limit") ?? COMMUNITY_POST_PAGE_SIZE);
  const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(limitRaw, 1), 24) : COMMUNITY_POST_PAGE_SIZE;

  const supabase = await createClient();
  const { posts, nextCursor, error } = await listCommunityBoardPosts(supabase, {
    category,
    cursor,
    limit,
    sort,
  });

  if (error) {
    return NextResponse.json({ posts: [], nextCursor: null, error: "load_failed" }, { status: 200 });
  }

  return NextResponse.json({ posts, nextCursor, error: null });
}
