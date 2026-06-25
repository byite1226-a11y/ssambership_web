import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { incrementPostView } from "@/lib/community/communityBoardMutations";
import { isCommunityPostUuid } from "@/lib/community/communityQueries";

/**
 * 게시글 조회수 +1 — 클라이언트(BoardViewTracker)가 세션당 1회만 호출.
 * 카운팅 외 부수효과 없음(데이터 변경 없음).
 */
export async function POST(req: Request) {
  let postId = "";
  try {
    const body = (await req.json()) as { postId?: unknown };
    postId = typeof body?.postId === "string" ? body.postId : "";
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  if (!isCommunityPostUuid(postId)) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  try {
    const supabase = await createClient();
    await incrementPostView(supabase, postId);
  } catch {
    return NextResponse.json({ ok: false }, { status: 200 });
  }

  return NextResponse.json({ ok: true });
}
