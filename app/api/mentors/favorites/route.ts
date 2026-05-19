import { NextResponse } from "next/server";
import { getServerUserWithProfile } from "@/lib/auth/getServerUserWithProfile";
import { addMentorFavorite, loadFavoriteMentorIdsForUser, removeMentorFavorite } from "@/lib/mentor/mentorFavorites";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const { user, error: authError } = await getServerUserWithProfile();
  if (authError || !user) {
    return NextResponse.json({ ok: false, error: "로그인이 필요합니다." }, { status: 401 });
  }
  const supabase = await createClient();
  const { ids, error } = await loadFavoriteMentorIdsForUser(supabase, user.id);
  if (error) {
    return NextResponse.json({ ok: false, error }, { status: 500 });
  }
  return NextResponse.json({ ok: true, mentorIds: [...ids] });
}

export async function POST(req: Request) {
  const { user, error: authError } = await getServerUserWithProfile();
  if (authError || !user) {
    return NextResponse.json({ ok: false, error: "로그인이 필요합니다." }, { status: 401 });
  }
  let body: { mentorId?: string };
  try {
    body = (await req.json()) as { mentorId?: string };
  } catch {
    return NextResponse.json({ ok: false, error: "요청 형식이 올바르지 않습니다." }, { status: 400 });
  }
  const mentorId = typeof body.mentorId === "string" ? body.mentorId.trim() : "";
  if (!mentorId) {
    return NextResponse.json({ ok: false, error: "mentorId가 필요합니다." }, { status: 400 });
  }
  const supabase = await createClient();
  const result = await addMentorFavorite(supabase, user.id, mentorId);
  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error ?? "찜하기에 실패했습니다." }, { status: 500 });
  }
  return NextResponse.json({ ok: true, favorited: true });
}

export async function DELETE(req: Request) {
  const { user, error: authError } = await getServerUserWithProfile();
  if (authError || !user) {
    return NextResponse.json({ ok: false, error: "로그인이 필요합니다." }, { status: 401 });
  }
  const url = new URL(req.url);
  const mentorId = url.searchParams.get("mentorId")?.trim() ?? "";
  if (!mentorId) {
    return NextResponse.json({ ok: false, error: "mentorId가 필요합니다." }, { status: 400 });
  }
  const supabase = await createClient();
  const result = await removeMentorFavorite(supabase, user.id, mentorId);
  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error ?? "찜 해제에 실패했습니다." }, { status: 500 });
  }
  return NextResponse.json({ ok: true, favorited: false });
}
