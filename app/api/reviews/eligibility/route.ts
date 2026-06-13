import { NextResponse } from "next/server";
import { getServerUserWithProfile } from "@/lib/auth/getServerUserWithProfile";
import { checkReviewEligibility } from "@/lib/reviews/checkReviewEligibility";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { user, profile, error: authError } = await getServerUserWithProfile();
  if (authError || !user) {
    return NextResponse.json({ ok: false, error: "로그인이 필요합니다." }, { status: 401 });
  }
  if (profile?.role !== "student") {
    return NextResponse.json({ ok: true, eligible: false, reason: "학생만 리뷰를 작성할 수 있습니다." });
  }

  const mentorId = new URL(request.url).searchParams.get("mentorId")?.trim();
  if (!mentorId) {
    return NextResponse.json({ ok: false, error: "mentorId가 필요합니다." }, { status: 400 });
  }

  try {
    const supabase = await createClient();
    const result = await checkReviewEligibility(supabase, user.id, mentorId);
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    console.error("[GET /api/reviews/eligibility]", e);
    return NextResponse.json({ ok: false, error: "자격 확인에 실패했습니다." }, { status: 500 });
  }
}
