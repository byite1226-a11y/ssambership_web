import { getServerUserWithProfile } from "@/lib/auth/getServerUserWithProfile";
import { createClient } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { User } from "@supabase/supabase-js";
import type { UserRow } from "@/lib/types/user";
import { partyUserIdFromRoomRow } from "@/lib/qna/questionRoomUiLabels";

export type QnaApiSession =
  | { ok: true; user: User; profile: UserRow; actor: "student" | "mentor"; supabase: SupabaseClient }
  | { ok: false; status: 401 | 403; error: string };

export async function getQnaApiSession(): Promise<QnaApiSession> {
  const { user, profile, error } = await getServerUserWithProfile();
  if (error || !user) {
    return { ok: false, status: 401, error: "로그인이 필요합니다." };
  }
  if (!profile || (profile.role !== "student" && profile.role !== "mentor")) {
    return { ok: false, status: 403, error: "학생 또는 멘토만 이용할 수 있습니다." };
  }
  const supabase = await createClient();
  return { ok: true, user, profile, actor: profile.role, supabase };
}

export async function assertRoomParty(
  supabase: SupabaseClient,
  roomId: string,
  userId: string,
  actor: "student" | "mentor"
): Promise<{ ok: true; row: Record<string, unknown> } | { ok: false; status: 403 | 404; error: string }> {
  const { data, error } = await supabase.from("mentor_student_rooms").select("*").eq("id", roomId).maybeSingle();
  if (error) {
    console.error("[assertRoomParty]", error);
    return { ok: false, status: 404, error: "질문방을 확인하는 중 오류가 났습니다." };
  }
  if (!data) {
    return { ok: false, status: 404, error: "질문방을 찾을 수 없습니다." };
  }
  const row = data as Record<string, unknown>;
  const studentId = partyUserIdFromRoomRow(row, "student");
  const mentorId = partyUserIdFromRoomRow(row, "mentor");
  if (!studentId || !mentorId) {
    return { ok: false, status: 404, error: "질문방 정보가 올바르지 않습니다." };
  }
  if (actor === "student" && studentId !== userId) {
    return { ok: false, status: 403, error: "이 질문방의 학생만 이용할 수 있습니다." };
  }
  if (actor === "mentor" && mentorId !== userId) {
    return { ok: false, status: 403, error: "이 질문방의 멘토만 이용할 수 있습니다." };
  }
  return { ok: true, row };
}
