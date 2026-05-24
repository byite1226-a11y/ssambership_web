import type { SupabaseClient } from "@supabase/supabase-js";
import { listBoardPosts, listShortformPosts } from "@/lib/community/communityQueries";
import { loadPublicMentorsList, type PublicMentorsListResult } from "@/lib/mentor/publicMentorsListQueries";
import { parseMentorsListFilters } from "@/lib/mentor/mentorsListSearchParams";
import { assignPlansByTier, type PlansByTier } from "@/lib/subscribe/subscribePageQueries";

type Row = Record<string, unknown>;

const NOTICE_TABLES = ["notices", "site_notices", "promotions", "active_promotions"] as const;

const PLAN_TABLES = ["plans", "mentor_plans", "subscription_plans", "mentor_subscription_plans"] as const;

export type NoticeBannerLoad = {
  rows: Row[];
  table: string | null;
  probe: string;
  error: string | null;
};

export type GlobalPlansLoad = {
  rows: Row[];
  table: string | null;
  probe: string;
  error: string | null;
};

export type TrustMetric = {
  label: string;
  value: string;
  probe: string;
};

export type LandingPublicStats = {
  mentorCount: number | null;
  questionCount: number | null;
  satisfactionPercent: number | null;
  mentorProbe: string;
  questionProbe: string;
  satisfactionProbe: string;
};

async function fetchLandingPublicStats(supabase: SupabaseClient): Promise<LandingPublicStats> {
  const [mentors, questions, reviews] = await Promise.all([
    supabase.from("mentor_profiles").select("*", { count: "exact", head: true }),
    supabase.from("question_threads").select("*", { count: "exact", head: true }),
    supabase.from("reviews").select("rating").limit(500),
  ]);

  let satisfactionPercent: number | null = null;
  if (!reviews.error && reviews.data?.length) {
    const ratings = (reviews.data as { rating?: number }[])
      .map((r) => r.rating)
      .filter((v): v is number => typeof v === "number" && Number.isFinite(v));
    if (ratings.length) {
      satisfactionPercent = Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length / 5) * 100);
    }
  }

  return {
    mentorCount: mentors.error ? null : mentors.count,
    questionCount: questions.error ? null : questions.count,
    satisfactionPercent,
    mentorProbe: mentors.error ? mentors.error.message : "mentor_profiles count",
    questionProbe: questions.error ? questions.error.message : "question_threads count",
    satisfactionProbe: reviews.error ? reviews.error.message : `reviews avg (${reviews.data?.length ?? 0} rows)`,
  };
}

async function fetchNoticesHome(supabase: SupabaseClient): Promise<NoticeBannerLoad> {
  for (const table of NOTICE_TABLES) {
    const { error: pe } = await supabase.from(table).select("id").limit(1);
    if (pe) continue;
    const { data, error } = await supabase.from(table).select("*").limit(5);
    if (error) return { rows: [], table, probe: `${table}: ${error.message}`, error: error.message };
    return {
      rows: (data as Row[]) ?? [],
      table,
      probe: `${table} · 최대 5행`,
      error: null,
    };
  }
  return { rows: [], table: null, probe: "notices 계열 없음 또는 RLS", error: null };
}

async function fetchGlobalPlansSample(supabase: SupabaseClient): Promise<GlobalPlansLoad> {
  let last = "plans 테이블 없음";
  for (const table of PLAN_TABLES) {
    const { error: pe } = await supabase.from(table).select("id").limit(1);
    if (pe) {
      last = `${table}: ${pe.message}`;
      continue;
    }
    const { data, error } = await supabase.from(table).select("*").limit(15);
    if (error) {
      last = `${table}: ${error.message}`;
      continue;
    }
    return {
      rows: (data as Row[]) ?? [],
      table,
      probe: `${table} · 글로벌 샘플 15행(멘토별은 /subscribe)`,
      error: null,
    };
  }
  return { rows: [], table: null, probe: last, error: null };
}

async function fetchTrustMetrics(supabase: SupabaseClient): Promise<TrustMetric[]> {
  const out: TrustMetric[] = [];
  const m1 = await supabase.from("users").select("*", { count: "exact", head: true }).eq("role", "mentor");
  out.push({
    label: "멘토(등록)",
    value: m1.count != null ? String(m1.count) : "—",
    probe: m1.error ? m1.error.message : "users.role=mentor",
  });
  const m2 = await supabase.from("shortform_posts").select("*", { count: "exact", head: true });
  if (!m2.error) {
    out.push({
      label: "숏폼 글",
      value: m2.count != null ? String(m2.count) : "—",
      probe: "shortform_posts",
    });
  } else {
    out.push({ label: "숏폼 글", value: "—", probe: `shortform_posts: ${m2.error.message}` });
  }
  const m3 = await supabase.from("community_posts").select("*", { count: "exact", head: true });
  if (!m3.error) {
    out.push({
      label: "게시판 글",
      value: m3.count != null ? String(m3.count) : "—",
      probe: "community_posts",
    });
  } else {
    out.push({ label: "게시판 글", value: "—", probe: `community_posts: ${m3.error.message}` });
  }
  return out;
}

export type HomeLandingData = {
  notices: NoticeBannerLoad;
  mentors: PublicMentorsListResult;
  shorts: { rows: Row[]; table: string | null; error: string | null };
  boards: { rows: Row[]; table: string | null; error: string | null };
  plans: GlobalPlansLoad;
  pricingByTier: PlansByTier;
  pricingFillProbe: string;
  trust: TrustMetric[];
  publicStats: LandingPublicStats;
};

export async function loadHomeLandingData(supabase: SupabaseClient): Promise<HomeLandingData> {
  const filters = parseMentorsListFilters({});
  const [notices, mentors, shorts, boards, plans, trust, publicStats] = await Promise.all([
    fetchNoticesHome(supabase),
    loadPublicMentorsList(supabase, { ...filters, page: 1 }, { fetchLimit: 14, pageSize: 6 }),
    listShortformPosts(supabase, 4),
    listBoardPosts(supabase, 4),
    fetchGlobalPlansSample(supabase),
    fetchTrustMetrics(supabase),
    fetchLandingPublicStats(supabase),
  ]);
  const { byTier, fillProbe } = assignPlansByTier(plans.rows as Row[]);
  return {
    notices,
    mentors,
    shorts,
    boards,
    plans,
    pricingByTier: byTier,
    pricingFillProbe: fillProbe,
    trust,
    publicStats,
  };
}
