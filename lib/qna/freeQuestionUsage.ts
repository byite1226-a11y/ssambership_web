import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import {
  FREE_QUESTION_EXPIRY_DAYS,
  FREE_QUESTION_PER_MENTOR_LIMIT,
  FREE_QUESTION_TOTAL_LIMIT,
} from "@/lib/mentor/freeQuestionPolicy";

const TABLE = "free_question_usage" as const;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

export type FreeQuestionGateResult =
  | { ok: true; usedFreeQuota: true }
  | { ok: false; userMessage: string };

function freeQuestionExpiryInstant(signupCreatedAt: string | Date): number {
  const signupMs = new Date(signupCreatedAt).getTime();
  if (!Number.isFinite(signupMs)) {
    return 0;
  }
  return signupMs + FREE_QUESTION_EXPIRY_DAYS * MS_PER_DAY;
}

/** 가입일(users.created_at) 기준 무료 질문권 유효 여부 */
export async function isFreeQuestionQuotaExpired(
  supabase: SupabaseClient,
  studentId: string
): Promise<{ expired: boolean; error: string | null }> {
  const { data, error } = await supabase.from("users").select("created_at").eq("id", studentId).maybeSingle();
  if (error) {
    if (/relation|does not exist|schema cache/i.test(error.message)) {
      return { expired: false, error: null };
    }
    return { expired: false, error: error.message };
  }
  const createdAt = (data as { created_at?: string } | null)?.created_at;
  if (!createdAt) {
    return { expired: false, error: "student created_at missing" };
  }
  return { expired: Date.now() >= freeQuestionExpiryInstant(createdAt), error: null };
}

export async function countFreeQuestionsTotal(
  supabase: SupabaseClient,
  studentId: string
): Promise<{ count: number; error: string | null }> {
  const { count, error } = await supabase
    .from(TABLE)
    .select("id", { count: "exact", head: true })
    .eq("student_id", studentId);
  if (error) {
    if (/relation|does not exist|schema cache/i.test(error.message)) {
      return { count: 0, error: null };
    }
    return { count: 0, error: error.message };
  }
  return { count: count ?? 0, error: null };
}

export async function countFreeQuestionsForMentor(
  supabase: SupabaseClient,
  studentId: string,
  mentorId: string
): Promise<{ count: number; error: string | null }> {
  const { count, error } = await supabase
    .from(TABLE)
    .select("id", { count: "exact", head: true })
    .eq("student_id", studentId)
    .eq("mentor_id", mentorId);
  if (error) {
    if (/relation|does not exist|schema cache/i.test(error.message)) {
      return { count: 0, error: null };
    }
    return { count: 0, error: error.message };
  }
  return { count: count ?? 0, error: null };
}

/** 멘토 상세 UI: 남은 무료 질문권 (0~3). 비로그인은 null. */
export async function loadFreeQuestionRemainingForMentor(
  supabase: SupabaseClient,
  studentId: string | null | undefined,
  mentorId: string
): Promise<number | null> {
  if (!studentId) {
    return null;
  }
  const expiry = await isFreeQuestionQuotaExpired(supabase, studentId);
  if (expiry.error) {
    return null;
  }
  if (expiry.expired) {
    return 0;
  }
  const { count, error } = await countFreeQuestionsForMentor(supabase, studentId, mentorId);
  if (error) {
    return null;
  }
  return Math.max(0, FREE_QUESTION_PER_MENTOR_LIMIT - count);
}

/** 활성 구독이 없을 때 새 질문 스레드 허용 여부(차감 없음). */
export async function assertFreeQuestionAllowed(
  supabase: SupabaseClient,
  studentId: string,
  mentorId: string
): Promise<FreeQuestionGateResult> {
  const expiry = await isFreeQuestionQuotaExpired(supabase, studentId);
  if (expiry.error) {
    console.error("[assertFreeQuestionAllowed] expiry check", expiry.error);
    return { ok: false, userMessage: "무료 질문권을 확인하지 못했습니다. 잠시 후 다시 시도해 주세요." };
  }
  if (expiry.expired) {
    return {
      ok: false,
      userMessage: `무료 질문권은 가입 후 ${FREE_QUESTION_EXPIRY_DAYS}일까지만 사용할 수 있습니다. 멘토를 구독한 뒤 질문해 주세요.`,
    };
  }

  const total = await countFreeQuestionsTotal(supabase, studentId);
  if (total.error) {
    console.error("[assertFreeQuestionAllowed] total count", total.error);
    return { ok: false, userMessage: "무료 질문권을 확인하지 못했습니다. 잠시 후 다시 시도해 주세요." };
  }
  if (total.count >= FREE_QUESTION_TOTAL_LIMIT) {
    return {
      ok: false,
      userMessage: `무료 질문권을 모두 사용했습니다(최대 ${FREE_QUESTION_TOTAL_LIMIT}회). 멘토를 구독한 뒤 질문해 주세요.`,
    };
  }

  const perMentor = await countFreeQuestionsForMentor(supabase, studentId, mentorId);
  if (perMentor.error) {
    console.error("[assertFreeQuestionAllowed] mentor count", perMentor.error);
    return { ok: false, userMessage: "무료 질문권을 확인하지 못했습니다. 잠시 후 다시 시도해 주세요." };
  }
  if (perMentor.count >= FREE_QUESTION_PER_MENTOR_LIMIT) {
    return {
      ok: false,
      userMessage: `이 멘토에게는 무료 질문권을 ${FREE_QUESTION_PER_MENTOR_LIMIT}회까지 사용할 수 있습니다. 구독 후 질문해 주세요.`,
    };
  }

  return { ok: true, usedFreeQuota: true };
}

export async function recordFreeQuestionUsage(
  supabase: SupabaseClient,
  studentId: string,
  mentorId: string
): Promise<{ ok: true } | { ok: false; userMessage: string }> {
  const { error: insErr } = await supabase.from(TABLE).insert({
    student_id: studentId,
    mentor_id: mentorId,
  });
  if (insErr) {
    if (insErr.code === "P0001") {
      return { ok: false, userMessage: "이 멘토에게 사용할 수 있는 무료 질문권을 모두 사용했습니다." };
    }
    if (insErr.code === "P0002") {
      return { ok: false, userMessage: "무료 질문권을 모두 사용했습니다." };
    }
    if (insErr.code === "P0003") {
      return {
        ok: false,
        userMessage: `무료 질문권은 가입 후 ${FREE_QUESTION_EXPIRY_DAYS}일까지만 사용할 수 있습니다. 멘토를 구독한 뒤 질문해 주세요.`,
      };
    }
    console.error("[recordFreeQuestionUsage] insert", insErr.message);
    return { ok: false, userMessage: "무료 질문권 차감에 실패했습니다. 잠시 후 다시 시도해 주세요." };
  }
  return { ok: true };
}

/** 게이트 통과 직후 차감(폼 액션 등). */
export async function assertFreeQuestionAllowedAndRecord(
  supabase: SupabaseClient,
  studentId: string,
  mentorId: string
): Promise<FreeQuestionGateResult> {
  const allowed = await assertFreeQuestionAllowed(supabase, studentId, mentorId);
  if (!allowed.ok) {
    return allowed;
  }
  const recorded = await recordFreeQuestionUsage(supabase, studentId, mentorId);
  if (!recorded.ok) {
    return { ok: false, userMessage: recorded.userMessage };
  }
  return { ok: true, usedFreeQuota: true };
}
