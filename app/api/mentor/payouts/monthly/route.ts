import { NextResponse } from "next/server";
import { requireMentorApiSession } from "@/lib/mentor/mentorPayoutsApiAuth";
import { loadMentorPayoutMonthlyCards } from "@/lib/mentor/mentorPayoutsService";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const auth = await requireMentorApiSession();
  if (!auth.ok) return auth.response;

  try {
    const supabase = await createClient();
    const months = await loadMentorPayoutMonthlyCards(supabase, auth.user.id, 6);
    return NextResponse.json({ ok: true, months });
  } catch (e) {
    console.error("[GET /api/mentor/payouts/monthly]", e);
    return NextResponse.json({ ok: false, error: "월별 내역을 불러오지 못했습니다." }, { status: 500 });
  }
}
