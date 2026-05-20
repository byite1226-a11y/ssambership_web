import { NextResponse } from "next/server";
import { getServerUserWithProfile } from "@/lib/auth/getServerUserWithProfile";
import { createReview, listMentorReviews } from "@/lib/reviews/reviewQueries";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const mentorId = url.searchParams.get("mentorId")?.trim();
  if (!mentorId) {
    return NextResponse.json({ ok: false, error: "mentorId가 필요합니다." }, { status: 400 });
  }

  const page = Number(url.searchParams.get("page") ?? "1");
  const limit = Number(url.searchParams.get("limit") ?? "10");

  try {
    const supabase = await createClient();
    const result = await listMentorReviews(supabase, mentorId, { page, limit });
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    console.error("[GET /api/reviews]", e);
    return NextResponse.json({ ok: false, error: "리뷰 목록을 불러오지 못했습니다." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const { user, profile, error: authError } = await getServerUserWithProfile();
  if (authError || !user) {
    return NextResponse.json({ ok: false, error: "로그인이 필요합니다." }, { status: 401 });
  }
  if (profile?.role !== "student") {
    return NextResponse.json({ ok: false, error: "학생만 리뷰를 작성할 수 있습니다." }, { status: 403 });
  }

  let body: { mentorId?: string; rating?: number; content?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ ok: false, error: "요청 형식이 올바르지 않습니다." }, { status: 400 });
  }

  const mentorId = body.mentorId?.trim();
  const rating = body.rating;
  const content = body.content ?? "";

  if (!mentorId) {
    return NextResponse.json({ ok: false, error: "멘토를 지정해 주세요." }, { status: 400 });
  }

  try {
    const supabase = await createClient();
    const result = await createReview(supabase, user.id, { mentorId, rating: Number(rating), content });
    if (!result.ok) {
      return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
    }
    return NextResponse.json({ ok: true, id: result.id });
  } catch (e) {
    console.error("[POST /api/reviews]", e);
    return NextResponse.json({ ok: false, error: "리뷰 저장에 실패했습니다." }, { status: 500 });
  }
}
