import { NextResponse } from "next/server";
import { getServerUserWithProfile } from "@/lib/auth/getServerUserWithProfile";
import { loadActiveSubscriptionsForStudent } from "@/lib/mypage/studentActiveSubscriptions";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const { user, profile, error: authError } = await getServerUserWithProfile();
    if (authError || !user) {
      return NextResponse.json(
        { ok: false, error: "로그인이 필요합니다." },
        { status: 401 }
      );
    }
    if (profile?.role !== "student") {
      return NextResponse.json(
        { ok: false, error: "학생 계정만 이용할 수 있습니다." },
        { status: 403 }
      );
    }

    const supabase = await createClient();
    const result = await loadActiveSubscriptionsForStudent(supabase, user.id);
    if (result.error) {
      return NextResponse.json({ ok: false, error: result.error }, { status: 500 });
    }

    return NextResponse.json({ ok: true, items: result.items });
  } catch (e) {
    const message = e instanceof Error ? e.message : "구독 목록을 불러오지 못했습니다.";
    console.error("[GET /api/mypage/active-subscriptions]", e);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
