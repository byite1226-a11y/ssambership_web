import type { SupabaseClient } from "@supabase/supabase-js";
import { findActiveSubscriptionForPair } from "@/lib/subscribe/subscribeCheckoutService";
import { isSubscribePlanTier } from "@/lib/subscribe/subscribePageQueries";
import { getSubscribeCatalogPlan } from "@/lib/subscribe/subscribePlanCatalog";
import { partyUserIdFromRoomRow } from "@/lib/qna/questionRoomUiLabels";
import { fetchMessagesForThreads, fetchThreadsForRooms } from "@/lib/qna/questionRoomQueries";
import { readQuestionThreadWorkflowStatus } from "@/lib/qna/questionThreadStatus";
import { threadMentorStudentRoomId } from "@/lib/qna/questionThreadRoomRef";
import { loadWeeklyUsageByMentorIds, weeklyUsageToSnapshot } from "@/lib/qna/weeklyQuestionUsage";
import type { WeeklyUsageSnapshot } from "@/lib/qna/weeklyQuestionUsage";

type Row = Record<string, unknown>;

export type QuestionRoomSubscriptionContext = {
  planTier: string | null;
  planLabel: string;
  subscribedAtLabel: string;
  weekRenewalLabel: string;
  nextRenewalLabel: string;
};

function formatKoDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("ko-KR", {
      timeZone: "Asia/Seoul",
      month: "long",
      day: "numeric",
    });
  } catch {
    return "—";
  }
}

function nextMondayLabel(): string {
  const now = new Date();
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    weekday: "short",
  }).formatToParts(now);
  const wd = parts.find((p) => p.type === "weekday")?.value?.slice(0, 3);
  const map: Record<string, number> = { Mon: 0, Tue: 1, Wed: 2, Thu: 3, Fri: 4, Sat: 5, Sun: 6 };
  const offset = wd ? (7 - (map[wd] ?? 0)) % 7 : 0;
  const days = offset === 0 ? 7 : offset;
  const next = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
  return next.toLocaleDateString("ko-KR", {
    timeZone: "Asia/Seoul",
    month: "long",
    day: "numeric",
    weekday: "short",
  });
}

export async function loadQuestionRoomSubscriptionContext(
  supabase: SupabaseClient,
  studentId: string,
  room: Row | null
): Promise<QuestionRoomSubscriptionContext> {
  const mentorId = room ? partyUserIdFromRoomRow(room, "mentor") : null;
  if (!mentorId) {
    return {
      planTier: null,
      planLabel: "—",
      subscribedAtLabel: "—",
      weekRenewalLabel: "월요일 00:00",
      nextRenewalLabel: nextMondayLabel(),
    };
  }

  const active = await findActiveSubscriptionForPair(supabase, studentId, mentorId);
  const tierRaw = active?.row.plan_tier;
  const planTier = typeof tierRaw === "string" && isSubscribePlanTier(tierRaw) ? tierRaw : null;
  const catalog = planTier ? getSubscribeCatalogPlan(planTier) : null;

  return {
    planTier,
    planLabel: catalog?.label ?? (planTier ? planTier.toUpperCase() : "구독 플랜"),
    subscribedAtLabel: formatKoDate(
      typeof active?.row.created_at === "string" ? active.row.created_at : null
    ),
    weekRenewalLabel: "매주 월요일 00:00 갱신",
    nextRenewalLabel: nextMondayLabel(),
  };
}

export async function loadMessageCountsByThreadId(
  supabase: SupabaseClient,
  threadIds: string[]
): Promise<Record<string, number>> {
  const out: Record<string, number> = {};
  for (const id of threadIds) out[id] = 0;
  if (threadIds.length === 0) return out;

  const pack = await fetchMessagesForThreads(supabase, threadIds);
  if (pack.error) return out;

  for (const m of pack.rows) {
    const tid =
      (typeof m.thread_id === "string" && m.thread_id) ||
      (typeof m.question_thread_id === "string" && m.question_thread_id) ||
      null;
    if (tid) out[tid] = (out[tid] ?? 0) + 1;
  }
  return out;
}

export async function loadUnreadCountsByRoomId(
  supabase: SupabaseClient,
  roomIds: string[]
): Promise<Record<string, number>> {
  const out: Record<string, number> = {};
  for (const id of roomIds) out[id] = 0;
  if (roomIds.length === 0) return out;

  const pack = await fetchThreadsForRooms(supabase, roomIds);
  if (pack.error) return out;

  for (const t of pack.rows) {
    const rid = threadMentorStudentRoomId(t) ?? "";
    if (!rid) continue;
    if (readQuestionThreadWorkflowStatus(t) === "answered") {
      out[rid] = (out[rid] ?? 0) + 1;
    }
  }
  return out;
}

export async function loadLastMessageByThreadId(
  supabase: SupabaseClient,
  threadIds: string[]
): Promise<Record<string, Row>> {
  const out: Record<string, Row> = {};
  if (threadIds.length === 0) return out;
  const pack = await fetchMessagesForThreads(supabase, threadIds);
  for (const m of pack.rows) {
    const tid =
      (typeof m.thread_id === "string" && m.thread_id) ||
      (typeof m.question_thread_id === "string" && m.question_thread_id) ||
      null;
    if (tid) out[tid] = m;
  }
  return out;
}

export async function loadInitialWeeklyUsageSnapshots(
  supabase: SupabaseClient,
  studentId: string,
  roomRows: Row[]
): Promise<Record<string, WeeklyUsageSnapshot>> {
  const mentorIds = [
    ...new Set(
      roomRows
        .map((r) => partyUserIdFromRoomRow(r, "mentor"))
        .filter((id): id is string => Boolean(id))
    ),
  ];
  const map = await loadWeeklyUsageByMentorIds(supabase, studentId, mentorIds);
  const out: Record<string, WeeklyUsageSnapshot> = {};
  for (const [mid, u] of Object.entries(map)) {
    out[mid] = weeklyUsageToSnapshot(u);
  }
  return out;
}
