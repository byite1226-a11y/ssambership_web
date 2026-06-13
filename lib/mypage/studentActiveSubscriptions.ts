import type { SupabaseClient } from "@supabase/supabase-js";
import { getMentorUserPublic, loadMentorProfilesForDirectory } from "@/lib/auth/mentorPublicRead";
import { buildMentorProfileDisplay } from "@/lib/mentor/mentorDisplayFields";
import { pickExistingColumn, rowsFromSupabaseData } from "@/lib/qna/safeSelect";
import { getSubscribeCatalogPlan } from "@/lib/subscribe/subscribePlanCatalog";
import {
  isSubscribePlanTier,
  type SubscribePlanTier,
} from "@/lib/subscribe/subscribePageQueries";
import {
  SUBSCRIPTIONS_ORDER_COLUMN,
  SUBSCRIPTIONS_SELECT,
  SUBSCRIPTIONS_TABLE,
} from "@/lib/subscribe/subscriptionsTable";

type Row = Record<string, unknown>;

const USAGE_COUNTERS_TABLE = "subscription_usage_counters";

export type ActiveSubscriptionCard = {
  subscriptionId: string;
  mentorId: string;
  mentorName: string;
  photoUrl: string | null;
  mentorInitial: string;
  planTier: SubscribePlanTier | null;
  planLabel: string;
  subscribedAt: string;
  subscribedAtLabel: string;
  questionsRemainingLabel: string;
};

function parsePlanTier(v: unknown): SubscribePlanTier | null {
  if (isSubscribePlanTier(v)) return v;
  const s = String(v ?? "").toLowerCase().trim();
  return isSubscribePlanTier(s) ? s : null;
}

function mentorInitialFromName(name: string): string {
  const t = name.trim();
  if (!t) return "멘";
  return t.slice(0, 1).toUpperCase();
}

export function formatSubscriptionStartedAt(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}

export function formatQuestionsRemainingLabel(
  counterRow: Row | null | undefined,
  tier: SubscribePlanTier | null
): string {
  if (counterRow) {
    for (const k of ["weekly_questions_remaining", "questions_remaining", "remaining_questions"] as const) {
      const v = counterRow[k];
      if (typeof v === "number" && Number.isFinite(v)) {
        if (tier === "premium" && v >= 999) return "주 무제한 질문";
        const cap =
          tier === "limited" ? 4 : tier === "standard" ? 9 : tier === "premium" ? 999 : null;
        if (cap != null && cap < 999) {
          const used = Math.max(0, cap - v);
          return `주 ${cap}개 질문 · ${used}/${cap}`;
        }
        return `남은 질문 ${v}회`;
      }
    }
  }
  if (tier === "premium") return "주 무제한 질문";
  if (tier === "standard") return "주 9개 질문 (플랜 기준)";
  if (tier === "limited") return "주 4개 질문 (플랜 기준)";
  return "—";
}

async function fetchUsageCountersBySubscriptionId(
  supabase: SupabaseClient,
  subscriptionIds: string[]
): Promise<Map<string, Row>> {
  const out = new Map<string, Row>();
  if (subscriptionIds.length === 0) return out;

  const { error: pe } = await supabase.from(USAGE_COUNTERS_TABLE).select("id").limit(1);
  if (pe) return out;

  const { column: subCol } = await pickExistingColumn(supabase, USAGE_COUNTERS_TABLE, [
    "subscription_id",
  ]);
  if (!subCol) return out;

  const { data, error } = await supabase
    .from(USAGE_COUNTERS_TABLE)
    .select("*")
    .in(subCol, subscriptionIds);
  if (error) {
    console.error("[fetchUsageCountersBySubscriptionId]", error.message);
    return out;
  }

  const usageRows = rowsFromSupabaseData(data) as Row[];
  for (const row of usageRows) {
    const sid = row[subCol];
    if (typeof sid === "string" && sid.trim()) out.set(sid.trim(), row);
  }
  return out;
}

export async function loadActiveSubscriptionsForStudent(
  supabase: SupabaseClient,
  studentId: string
): Promise<{ items: ActiveSubscriptionCard[]; error: string | null }> {
  const { data, error } = await supabase
    .from(SUBSCRIPTIONS_TABLE)
    .select(SUBSCRIPTIONS_SELECT)
    .eq("student_id", studentId)
    .eq("status", "active")
    .order(SUBSCRIPTIONS_ORDER_COLUMN, { ascending: false });

  if (error) {
    return { items: [], error: error.message };
  }

  const rows = rowsFromSupabaseData(data) as Row[];
  const mentorIds = [...new Set(rows.map((r) => String(r.mentor_id ?? "").trim()).filter(Boolean))];
  const subscriptionIds = rows.map((r) => String(r.id ?? "").trim()).filter(Boolean);

  const [profilesLoad, usageBySubId] = await Promise.all([
    loadMentorProfilesForDirectory(supabase, mentorIds),
    fetchUsageCountersBySubscriptionId(supabase, subscriptionIds),
  ]);

  const usersByMentor = new Map<string, Awaited<ReturnType<typeof getMentorUserPublic>>["data"]>();
  await Promise.all(
    mentorIds.map(async (mentorId) => {
      const { data: userRow } = await getMentorUserPublic(supabase, mentorId);
      usersByMentor.set(mentorId, userRow);
    })
  );

  const items: ActiveSubscriptionCard[] = rows.map((row) => {
    const subscriptionId = String(row.id ?? "");
    const mentorId = String(row.mentor_id ?? "");
    const profileRow = profilesLoad.byUser.get(mentorId) ?? null;
    const userRow = usersByMentor.get(mentorId) ?? null;
    const display = buildMentorProfileDisplay(profileRow, userRow);
    const tier = parsePlanTier(row.plan_tier);
    const planLabel = tier ? `${getSubscribeCatalogPlan(tier).label} 플랜` : "구독 플랜";
    const subscribedAt = String(row.created_at ?? "");
    const counterRow = usageBySubId.get(subscriptionId);

    return {
      subscriptionId,
      mentorId,
      mentorName: display.displayName,
      photoUrl: display.photoUrl?.trim() ? display.photoUrl.trim() : null,
      mentorInitial: mentorInitialFromName(display.displayName),
      planTier: tier,
      planLabel,
      subscribedAt,
      subscribedAtLabel: subscribedAt ? formatSubscriptionStartedAt(subscribedAt) : "—",
      questionsRemainingLabel: formatQuestionsRemainingLabel(counterRow, tier),
    };
  });

  if (profilesLoad.error) {
    console.warn("[loadActiveSubscriptionsForStudent] mentor profiles", profilesLoad.error);
  }

  return { items, error: null };
}

export async function countActiveSubscriptionsForStudent(
  supabase: SupabaseClient,
  studentId: string
): Promise<{ count: number; error: string | null }> {
  const { count, error } = await supabase
    .from(SUBSCRIPTIONS_TABLE)
    .select("id", { count: "exact", head: true })
    .eq("student_id", studentId)
    .eq("status", "active");

  if (error) return { count: 0, error: error.message };
  return { count: count ?? 0, error: null };
}
