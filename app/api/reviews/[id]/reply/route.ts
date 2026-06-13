import { NextResponse } from "next/server";
import { getServerUserWithProfile } from "@/lib/auth/getServerUserWithProfile";
import { replyToReview } from "@/lib/reviews/reviewQueries";
import { createClient } from "@/lib/supabase/server";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const { user, profile, error: authError } = await getServerUserWithProfile();
  if (authError || !user) {
    return NextResponse.json({ ok: false, error: "로그인이 필요합니다." }, { status: 401 });
  }
  if (profile?.role !== "mentor") {
    return NextResponse.json({ ok: false, error: "멘토만 답글을 작성할 수 있습니다." }, { status: 403 });
  }

  const { id: reviewId } = await context.params;
  let body: { reply?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ ok: false, error: "요청 형식이 올바르지 않습니다." }, { status: 400 });
  }

  try {
    const supabase = await createClient();
    const result = await replyToReview(supabase, user.id, reviewId, body.reply ?? "");
    if (!result.ok) {
      return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[PATCH /api/reviews/[id]/reply]", e);
    return NextResponse.json({ ok: false, error: "답글 저장에 실패했습니다." }, { status: 500 });
  }
}
