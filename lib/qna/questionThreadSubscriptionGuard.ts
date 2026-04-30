import type { SupabaseClient } from "@supabase/supabase-js";
import { findActiveSubscriptionForPair } from "@/lib/subscribe/subscribeCheckoutService";

const STU_KEYS = ["student_id", "student_user_id", "student_uid"] as const;
const MEN_KEYS = ["mentor_id", "mentor_user_id", "mentor_uid"] as const;

function pickUserId(row: Record<string, unknown>, keys: readonly string[]): string | null {
  for (const k of keys) {
    const v = row[k];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return null;
}

/**
 * TODO(질문 한도·잔여 횟수):
 * - `fetchSubscriptionForPair` / 구독 row의 `plan_id` + `mentor_plans`(또는 플랜 테이블)에서
 *   `weekly_new_questions`·`questions_per_week` 등(코드 후보는 `weeklyQuestionsLabel` 참고)을 읽고
 * - 동일 room(`roomId`)에 속한 `question_threads`를 `created_at`(또는 `updated_at`) 기준 주/월 윈도우로 집계해
 *   한도 대비 잔여를 계산한다. 기간 기준(주 시작일·구독 갱신일)은 제품 정책 확정 후 반영.
 * - 0 이하이면 `userMessage`에
 *   "사용 가능한 질문 수가 없습니다. 구독 상태를 확인하거나 요금제를 변경해 주세요." 를 사용.
 */
export async function assertThreadCreationSubscriptionAllowed(
  supabase: SupabaseClient,
  roomId: string,
  actor: "student" | "mentor"
): Promise<{ ok: true } | { ok: false; userMessage: string }> {
  const { data, error } = await supabase.from("mentor_student_rooms").select("*").eq("id", roomId).maybeSingle();
  if (error) {
    console.error("[assertThreadCreationSubscriptionAllowed] mentor_student_rooms", { roomId, message: error.message });
    return { ok: false, userMessage: "이 질문방을 확인하는 중 오류가 났습니다. 잠시 후 다시 시도해 주세요." };
  }
  if (!data) {
    return { ok: false, userMessage: "질문방을 찾을 수 없어요. 목록에서 다시 들어와 주세요." };
  }
  const row = data as Record<string, unknown>;
  const studentId = pickUserId(row, STU_KEYS);
  const mentorId = pickUserId(row, MEN_KEYS);
  if (!studentId || !mentorId) {
    return { ok: false, userMessage: "질문방 정보(학생·멘토)를 확인할 수 없어요. 잠시 후 다시 시도해 주세요." };
  }

  const active = await findActiveSubscriptionForPair(supabase, studentId, mentorId);
  if (!active) {
    const userMessage =
      actor === "student"
        ? "활성 구독을 찾을 수 없습니다. 멘토 구독 후 질문을 작성해 주세요."
        : "학생의 활성 구독이 없어 현재 답변을 작성할 수 없습니다.";
    return { ok: false, userMessage };
  }

  return { ok: true };
}
