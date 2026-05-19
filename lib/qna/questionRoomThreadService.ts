import type { SupabaseClient } from "@supabase/supabase-js";
import { partyUserIdFromRoomRow } from "@/lib/qna/questionRoomUiLabels";
import { assertRoomParty } from "@/lib/qna/questionRoomApiAuth";
import { createQuestionThread } from "@/lib/qna/questionRoomMutations";
import { updateQuestionThreadStatus } from "@/lib/qna/questionThreadMutations";
import { readQuestionThreadWorkflowStatus, WEEKLY_QUESTION_LIMIT_MESSAGE } from "@/lib/qna/questionThreadStatus";
import { fetchWeeklyQuestionUsage } from "@/lib/qna/weeklyQuestionUsage";
import { findActiveSubscriptionForPair } from "@/lib/subscribe/subscribeCheckoutService";
import { threadRowBelongsToMentorStudentRoom } from "@/lib/qna/questionThreadRoomRef";

export async function resolveMentorIdForRoom(
  supabase: SupabaseClient,
  roomId: string
): Promise<{ mentorId: string | null; studentId: string | null; error: string | null }> {
  const { data, error } = await supabase.from("mentor_student_rooms").select("*").eq("id", roomId).maybeSingle();
  if (error || !data) {
    return { mentorId: null, studentId: null, error: error?.message ?? "질문방을 찾을 수 없습니다." };
  }
  const row = data as Record<string, unknown>;
  return {
    mentorId: partyUserIdFromRoomRow(row, "mentor"),
    studentId: partyUserIdFromRoomRow(row, "student"),
    error: null,
  };
}

export async function assertStudentCanCreateThread(
  supabase: SupabaseClient,
  studentId: string,
  roomId: string
): Promise<{ ok: true; mentorId: string } | { ok: false; status: 403 | 404 | 429; error: string }> {
  const party = await assertRoomParty(supabase, roomId, studentId, "student");
  if (!party.ok) {
    return { ok: false, status: party.status, error: party.error };
  }
  const mentorId = partyUserIdFromRoomRow(party.row, "mentor");
  if (!mentorId) {
    return { ok: false, status: 404, error: "멘토 정보를 확인할 수 없습니다." };
  }

  const active = await findActiveSubscriptionForPair(supabase, studentId, mentorId);
  if (!active) {
    return {
      ok: false,
      status: 403,
      error: "활성 구독을 찾을 수 없습니다. 멘토 구독 후 질문을 작성해 주세요.",
    };
  }

  const { usage, error: usageError } = await fetchWeeklyQuestionUsage(supabase, studentId, mentorId);
  if (usageError) {
    console.error("[assertStudentCanCreateThread] get_weekly_question_usage", usageError);
    return {
      ok: false,
      status: 403,
      error: "질문 한도를 확인하지 못했습니다. 잠시 후 다시 시도해 주세요.",
    };
  }
  if (!usage?.canAsk) {
    return { ok: false, status: 429, error: WEEKLY_QUESTION_LIMIT_MESSAGE };
  }

  return { ok: true, mentorId };
}

export async function createStudentQuestionThread(
  supabase: SupabaseClient,
  studentId: string,
  roomId: string,
  title: string,
  subjectTag?: string | null
): Promise<
  | { ok: true; threadId: string | null }
  | { ok: false; status: 400 | 403 | 404 | 429 | 500; error: string }
> {
  const gate = await assertStudentCanCreateThread(supabase, studentId, roomId);
  if (!gate.ok) {
    return { ok: false, status: gate.status, error: gate.error };
  }

  const trimmed = title.trim();
  if (!trimmed) {
    return { ok: false, status: 400, error: "질문 주제 제목을 입력해 주세요." };
  }

  const result = await createQuestionThread({
    supabase,
    role: "student",
    userId: studentId,
    roomId,
    title: trimmed,
    subjectTag: subjectTag?.trim() || null,
  });

  if (!result.ok) {
    return { ok: false, status: 500, error: result.error };
  }
  return { ok: true, threadId: result.threadId };
}

export async function assertThreadInRoom(
  supabase: SupabaseClient,
  roomId: string,
  threadId: string
): Promise<{ ok: true; row: Record<string, unknown> } | { ok: false; status: 404; error: string }> {
  const { data, error } = await supabase.from("question_threads").select("*").eq("id", threadId).maybeSingle();
  if (error || !data) {
    return { ok: false, status: 404, error: "질문을 찾을 수 없습니다." };
  }
  const row = data as Record<string, unknown>;
  if (!threadRowBelongsToMentorStudentRoom(row, roomId)) {
    return { ok: false, status: 404, error: "이 질문은 현재 질문방에 속하지 않습니다." };
  }
  return { ok: true, row };
}

export async function confirmQuestionThreadForStudent(
  supabase: SupabaseClient,
  studentId: string,
  roomId: string,
  threadId: string
): Promise<{ ok: true } | { ok: false; status: 400 | 403 | 404 | 500; error: string }> {
  const party = await assertRoomParty(supabase, roomId, studentId, "student");
  if (!party.ok) {
    return { ok: false, status: party.status === 403 ? 403 : 404, error: party.error };
  }
  const inRoom = await assertThreadInRoom(supabase, roomId, threadId);
  if (!inRoom.ok) {
    return { ok: false, status: inRoom.status, error: inRoom.error };
  }

  const workflow = readQuestionThreadWorkflowStatus(inRoom.row);
  if (workflow === "confirmed") {
    return { ok: true };
  }
  if (workflow !== "answered") {
    return { ok: false, status: 400, error: "멘토 답변이 도착한 뒤에만 확인할 수 있습니다." };
  }

  const updated = await updateQuestionThreadStatus(supabase, threadId, "confirmed");
  if (!updated.ok) {
    return { ok: false, status: 500, error: updated.error };
  }
  return { ok: true };
}

export async function markQuestionThreadAnsweredForMentor(
  supabase: SupabaseClient,
  mentorId: string,
  roomId: string,
  threadId: string
): Promise<{ ok: true } | { ok: false; status: 400 | 403 | 404 | 500; error: string }> {
  const party = await assertRoomParty(supabase, roomId, mentorId, "mentor");
  if (!party.ok) {
    return { ok: false, status: party.status === 403 ? 403 : 404, error: party.error };
  }
  const inRoom = await assertThreadInRoom(supabase, roomId, threadId);
  if (!inRoom.ok) {
    return { ok: false, status: inRoom.status, error: inRoom.error };
  }

  const workflow = readQuestionThreadWorkflowStatus(inRoom.row);
  if (workflow === "confirmed") {
    return { ok: true };
  }
  if (workflow === "answered") {
    return { ok: true };
  }

  const updated = await updateQuestionThreadStatus(supabase, threadId, "answered");
  if (!updated.ok) {
    return { ok: false, status: 500, error: updated.error };
  }
  return { ok: true };
}
