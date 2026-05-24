import type { SupabaseClient } from "@supabase/supabase-js";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { findActiveSubscriptionForPair } from "@/lib/subscribe/subscribeCheckoutService";
import type { SubscribePlanTier } from "@/lib/subscribe/subscribePageQueries";
import { isSubscribePlanTier } from "@/lib/subscribe/subscribePageQueries";
import { pickExistingColumn } from "@/lib/qna/safeSelect";
import { QUESTION_THREADS_ROOM_FK_CANDIDATES } from "@/lib/qna/questionThreadRoomRef";

export type WeeklyUsageSnapshot = {
  used: number;
  limit: number;
  remaining: number;
  canAsk: boolean;
  limitLabel: string;
  planTier?: string | null;
  weekStart?: string | null;
  weekEnd?: string | null;
};

export type WeeklyQuestionUsage = {
  used: number;
  limit: number;
  remaining: number;
  canAsk: boolean;
  planTier: SubscribePlanTier | null;
  weekStart: string | null;
  weekEnd: string | null;
};

function limitForTier(tier: SubscribePlanTier | null): number {
  if (tier === "limited") return 4;
  if (tier === "standard") return 9;
  if (tier === "premium") return 999;
  return 0;
}

function seoulWeekBounds(): { start: Date; end: Date } {
  const now = new Date();
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
  }).formatToParts(now);
  const get = (t: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === t)?.value;
  const y = Number(get("year"));
  const m = Number(get("month"));
  const d = Number(get("day"));
  const wd = get("weekday");
  const dayMap: Record<string, number> = { Mon: 0, Tue: 1, Wed: 2, Thu: 3, Fri: 4, Sat: 5, Sun: 6 };
  const offset = wd ? dayMap[wd.slice(0, 3)] ?? 0 : 0;
  const startLocal = new Date(Date.UTC(y, m - 1, d - offset, 0, 0, 0));
  const endLocal = new Date(startLocal.getTime() + 7 * 24 * 60 * 60 * 1000);
  return { start: startLocal, end: endLocal };
}

function parseRpcWeeklyUsage(data: unknown): WeeklyQuestionUsage {
  const o =
    data && typeof data === "object" && !Array.isArray(data) ? (data as Record<string, unknown>) : {};
  const used = typeof o.used === "number" ? o.used : Number(o.used ?? 0);
  const limit = typeof o.limit === "number" ? o.limit : Number(o.limit ?? 0);
  const remaining =
    typeof o.remaining === "number" ? o.remaining : Math.max(0, limit - used);
  const canAsk = typeof o.can_ask === "boolean" ? o.can_ask : used < limit;
  const tierRaw = typeof o.plan_tier === "string" ? o.plan_tier : null;
  const planTier = tierRaw && isSubscribePlanTier(tierRaw) ? tierRaw : null;
  return {
    used: Number.isFinite(used) ? used : 0,
    limit: Number.isFinite(limit) ? limit : 0,
    remaining: Number.isFinite(remaining) ? remaining : 0,
    canAsk,
    planTier,
    weekStart: typeof o.week_start === "string" ? o.week_start : null,
    weekEnd: typeof o.week_end === "string" ? o.week_end : null,
  };
}

async function countConfirmedThisWeekFallback(
  supabase: SupabaseClient,
  studentId: string,
  mentorId: string
): Promise<number> {
  const { start, end } = seoulWeekBounds();
  const rooms = await supabase.from("mentor_student_rooms").select("id").eq("student_id", studentId).eq("mentor_id", mentorId);
  const roomIds = ((rooms.data as { id: string }[] | null) ?? []).map((r) => String(r.id));
  if (roomIds.length === 0) return 0;

  const { column: fkCol } = await pickExistingColumn(supabase, "question_threads", [...QUESTION_THREADS_ROOM_FK_CANDIDATES]);
  if (!fkCol) return 0;

  const { data, error } = await supabase
    .from("question_threads")
    .select("id, status, updated_at, created_at")
    .in(fkCol, roomIds)
    .eq("status", "confirmed");

  if (error) return 0;
  let count = 0;
  for (const row of (data as Record<string, unknown>[]) ?? []) {
    const ts = String(row.updated_at ?? row.created_at ?? "");
    const ms = Date.parse(ts);
    if (!Number.isNaN(ms) && ms >= start.getTime() && ms < end.getTime()) count += 1;
  }
  return count;
}

export async function fetchWeeklyQuestionUsageWithFallback(
  supabase: SupabaseClient,
  studentId: string,
  mentorId: string
): Promise<{ usage: WeeklyQuestionUsage; error: string | null }> {
  const { data, error } = await supabase.rpc("get_weekly_question_usage", {
    p_student_id: studentId,
    p_mentor_id: mentorId,
  });

  if (!error && data) {
    const parsed = parseRpcWeeklyUsage(data);
    if (parsed.limit > 0 || parsed.planTier) {
      return { usage: parsed, error: null };
    }
  }

  const active = await findActiveSubscriptionForPair(supabase, studentId, mentorId);
  const tierRaw = active?.row.plan_tier;
  const planTier =
    typeof tierRaw === "string" && isSubscribePlanTier(tierRaw) ? tierRaw : null;
  const limit = limitForTier(planTier);
  const used = await countConfirmedThisWeekFallback(supabase, studentId, mentorId);
  const { start, end } = seoulWeekBounds();

  return {
    usage: {
      used,
      limit,
      remaining: Math.max(0, limit - used),
      canAsk: used < limit,
      planTier,
      weekStart: start.toISOString(),
      weekEnd: end.toISOString(),
    },
    error: error?.message ?? null,
  };
}

export async function fetchWeeklyQuestionUsage(
  supabase: SupabaseClient,
  studentId: string,
  mentorId: string
): Promise<{ usage: WeeklyQuestionUsage | null; error: string | null }> {
  const r = await fetchWeeklyQuestionUsageWithFallback(supabase, studentId, mentorId);
  return { usage: r.usage, error: r.error };
}

export async function loadWeeklyUsageByMentorIds(
  supabase: SupabaseClient,
  studentId: string,
  mentorIds: string[]
): Promise<Record<string, WeeklyQuestionUsage>> {
  const out: Record<string, WeeklyQuestionUsage> = {};
  await Promise.all(
    mentorIds.map(async (mid) => {
      const { usage } = await fetchWeeklyQuestionUsageWithFallback(supabase, studentId, mid);
      out[mid] = usage;
    })
  );
  return out;
}

export async function fetchWeeklyQuestionUsageServiceRole(
  studentId: string,
  mentorId: string
): Promise<{ usage: WeeklyQuestionUsage | null; error: string | null }> {
  try {
    const admin = createServiceRoleClient();
    return fetchWeeklyQuestionUsage(admin, studentId, mentorId);
  } catch (e) {
    const m = e instanceof Error ? e.message : String(e);
    return { usage: null, error: m };
  }
}

export function weeklyUsageDisplayLimit(usage: WeeklyQuestionUsage): string {
  if (usage.limit >= 999) return "무제한";
  return String(usage.limit);
}

/** 질문방 UI — 주간 한도 표기 (예: 주 4개 질문 · 1/4) */
export function weeklyQuestionQuotaLabel(
  usage: Pick<WeeklyQuestionUsage, "used" | "limit"> | WeeklyUsageSnapshot | null | undefined
): string {
  if (!usage) return "주 —개 질문";
  if (usage.limit >= 999) return `주 무제한 질문 · ${usage.used} 사용`;
  return `주 ${usage.limit}개 질문 · ${usage.used}/${usage.limit}`;
}

export function weeklyUsageToSnapshot(usage: WeeklyQuestionUsage): WeeklyUsageSnapshot {
  return {
    used: usage.used,
    limit: usage.limit,
    remaining: usage.remaining,
    canAsk: usage.canAsk,
    limitLabel: weeklyUsageDisplayLimit(usage),
    planTier: usage.planTier,
    weekStart: usage.weekStart,
    weekEnd: usage.weekEnd,
  };
}
