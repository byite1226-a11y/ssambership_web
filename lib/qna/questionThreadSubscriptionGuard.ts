import type { SupabaseClient } from "@supabase/supabase-js";
import { findActiveSubscriptionForPair } from "@/lib/subscribe/subscribeCheckoutService";
import { fetchPlansForMentor } from "@/lib/mentor/publicMentorBundle";
import { pickExistingColumn } from "@/lib/qna/safeSelect";
import { QUESTION_THREADS_ROOM_FK_CANDIDATES } from "./questionThreadRoomRef";

const STU_KEYS = ["student_id", "student_user_id", "student_uid"] as const;
const MEN_KEYS = ["mentor_id", "mentor_user_id", "mentor_uid"] as const;

function pickUserId(row: Record<string, unknown>, keys: readonly string[]): string | null {
  for (const k of keys) {
    const v = row[k];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return null;
}

function parseQuestionsLimitFromPlanRow(row: Record<string, unknown> | null): number {
  if (!row) return 0;
  
  const keys = [
    "weekly_new_questions",
    "weekly_question_limit",
    "questions_per_week",
    "quota_per_week",
    "new_questions_per_week",
    "weekly_questions",
    "question_limit",
    "monthly_questions",
    "max_questions"
  ] as const;

  for (const k of keys) {
    const v = row[k];
    if (typeof v === "number") return v;
    if (typeof v === "string") {
      const match = v.match(/\d+/);
      if (match) {
        const n = parseInt(match[0], 10);
        if (Number.isFinite(n)) return n;
      }
    }
  }
  return 0;
}

export async function assertThreadCreationSubscriptionAllowed(
  supabase: SupabaseClient,
  roomId: string,
  actor: "student" | "mentor",
  options?: { isNewThread?: boolean }
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

  // Only validate question tier limits when creating a new thread as a student
  if (options?.isNewThread && actor === "student") {
    // 1. Fetch plans for the mentor
    const plans = await fetchPlansForMentor(supabase, mentorId);
    let planRow: Record<string, unknown> | null = null;
    
    if (plans.rows.length > 0) {
      const planIdRef = active.row.plan_id || active.row.mentor_plan_id || active.row.subscription_plan_id || active.row.id;
      if (planIdRef) {
        planRow = plans.rows.find(r => String(r.id) === String(planIdRef)) ?? null;
      }
      if (!planRow) {
        const tierTitle = String(active.row.title || active.row.name || active.row.plan_name || active.row.tier || "").toLowerCase();
        if (/limited|리미티드|라이트|light/.test(tierTitle)) {
          planRow = plans.rows.find(r => /limited|리미티드|라이트|light/i.test(String(r.title || r.name || r.plan_name || ""))) ?? null;
        } else if (/standard|스탠다드/i.test(tierTitle)) {
          planRow = plans.rows.find(r => /standard|스탠다드/i.test(String(r.title || r.name || r.plan_name || ""))) ?? null;
        } else if (/premium|프리미엄|pro|프로/i.test(tierTitle)) {
          planRow = plans.rows.find(r => /premium|프리미엄|pro|프로/i.test(String(r.title || r.name || r.plan_name || ""))) ?? null;
        }
      }
      if (!planRow) {
        planRow = plans.rows[0];
      }
    }

    // 2. Parse the limit from the plan row
    const limit = parseQuestionsLimitFromPlanRow(planRow);
    
    // 3. Count recent question threads within 7 days rolling window
    // NOTE: Renewal logic / weekly alignment will be defined upon product policy finalization. Currently rolling 7-day window.
    const threadsTable = "question_threads";
    const { column: fkCol } = await pickExistingColumn(supabase, threadsTable, [...QUESTION_THREADS_ROOM_FK_CANDIDATES]);
    const { column: dateCol } = await pickExistingColumn(supabase, threadsTable, ["created_at", "inserted_at", "updated_at"]);
    
    if (fkCol && dateCol) {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const { count, error: countError } = await supabase
        .from(threadsTable)
        .select("id", { count: "exact", head: true })
        .eq(fkCol, roomId)
        .gte(dateCol, sevenDaysAgo);

      if (countError) {
        console.error("[assertThreadCreationSubscriptionAllowed] count query failed", countError);
      } else {
        const currentCount = count ?? 0;
        if (currentCount >= limit) {
          return {
            ok: false,
            userMessage: "사용 가능한 질문 수가 없습니다. 구독 상태를 확인하거나 요금제를 변경해 주세요."
          };
        }
      }
    }
  }

  return { ok: true };
}
