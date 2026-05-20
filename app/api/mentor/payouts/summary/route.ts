import { NextResponse } from "next/server";
import { requireMentorApiSession } from "@/lib/mentor/mentorPayoutsApiAuth";
import { loadMentorPayoutSummary } from "@/lib/mentor/mentorPayoutsService";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const auth = await requireMentorApiSession();
  if (!auth.ok) return auth.response;

  try {
    const supabase = await createClient();
    const summary = await loadMentorPayoutSummary(supabase, auth.user.id);
    return NextResponse.json({ ok: true, summary });
  } catch (e) {
    console.error("[GET /api/mentor/payouts/summary]", e);
    return NextResponse.json({ ok: false, error: "수익 요약을 불러오지 못했습니다." }, { status: 500 });
  }
}
