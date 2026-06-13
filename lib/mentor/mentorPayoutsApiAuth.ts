import { NextResponse } from "next/server";
import { getServerUserWithProfile } from "@/lib/auth/getServerUserWithProfile";

export async function requireMentorApiSession() {
  const { user, profile, error } = await getServerUserWithProfile();
  if (error || !user) {
    return {
      ok: false as const,
      response: NextResponse.json({ ok: false, error: "로그인이 필요합니다." }, { status: 401 }),
    };
  }
  if (profile?.role !== "mentor") {
    return {
      ok: false as const,
      response: NextResponse.json({ ok: false, error: "멘토 계정만 이용할 수 있습니다." }, { status: 403 }),
    };
  }
  return { ok: true as const, user, profile };
}
