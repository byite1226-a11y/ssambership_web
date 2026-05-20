import { NextResponse } from "next/server";
import { requireMentorApiSession } from "@/lib/mentor/mentorPayoutsApiAuth";
import { loadMentorPayoutDetail, type PayoutLineType } from "@/lib/mentor/mentorPayoutsService";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const auth = await requireMentorApiSession();
  if (!auth.ok) return auth.response;

  const url = new URL(request.url);
  const month = url.searchParams.get("month");
  const typeRaw = url.searchParams.get("type");
  const type: PayoutLineType | "all" | null =
    typeRaw === "subscription" || typeRaw === "custom_request" ? typeRaw : typeRaw === "all" ? "all" : null;

  try {
    const supabase = await createClient();
    const detail = await loadMentorPayoutDetail(supabase, auth.user.id, { month, type });
    return NextResponse.json({ ok: true, ...detail });
  } catch (e) {
    console.error("[GET /api/mentor/payouts/detail]", e);
    return NextResponse.json({ ok: false, error: "상세 내역을 불러오지 못했습니다." }, { status: 500 });
  }
}
