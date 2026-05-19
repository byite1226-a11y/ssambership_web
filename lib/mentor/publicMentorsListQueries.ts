import type { SupabaseClient } from "@supabase/supabase-js";
import { loadMentorDirectoryUserRows, loadMentorProfilesForDirectory } from "@/lib/auth/mentorPublicRead";
import { buildMentorProfileDisplay, type MentorProfileDisplay } from "@/lib/mentor/mentorDisplayFields";
import type { MentorsListFilters, MentorsListSort } from "@/lib/mentor/mentorsListSearchParams";
import { probePublicReviewVisibilityColumns } from "@/lib/mentor/publicReviewVisibility";
import { pickExistingColumn } from "@/lib/qna/safeSelect";
import { assignPlansByTier, type PlansByTier } from "@/lib/subscribe/subscribePageQueries";
type Row = Record<string, unknown>;

export const PUBLIC_MENTORS_RLS_HINT =
  "멘토 목록을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요. 문제가 계속되면 고객 지원으로 문의해 주세요.";

export type MentorPublicListCard = {
  mentorId: string;
  display: MentorProfileDisplay;
  userStatus: string;
  userCreatedAt: string | null;
  reviewCount: number | null;
  avgRating: number | null;
  reviewsProbe: string;
  priceLabel: string | null;
  byTier: PlansByTier | null;
  plansProbe: string;
};

export type PublicMentorsListResult = {
  cards: MentorPublicListCard[];
  usersError: string | null;
  profilesError: string | null;
  probes: string[];
  onlySelfVisibleHint: boolean;
};

const PLAN_TABLES = ["plans", "mentor_plans", "subscription_plans", "mentor_subscription_plans"] as const;
const PLAN_FK = ["mentor_id", "mentor_user_id", "user_id", "owner_id"] as const;

function parsePriceNumber(row: Row): number | null {
  for (const k of ["amount_cents", "price_cents", "monthly_price_cents"]) {
    const v = row[k];
    if (typeof v === "number" && Number.isFinite(v)) return v;
  }
  for (const k of ["price", "monthly_price", "amount", "price_krw"]) {
    const v = row[k];
    if (typeof v === "number" && Number.isFinite(v)) return v;
    if (typeof v === "string") {
      const n = Number.parseFloat(v.replace(/[^0-9.]/g, ""));
      if (Number.isFinite(n)) return n;
    }
  }
  return null;
}

async function batchReviewStats(
  supabase: SupabaseClient,
  mentorIds: string[]
): Promise<{ map: Map<string, { count: number | null; avg: number | null }>; probe: string }> {
  const empty = new Map<string, { count: number | null; avg: number | null }>();
  if (!mentorIds.length) return { map: empty, probe: "멘토 id 없음" };

  const summaryTables = ["reviews_summary", "mentor_review_stats", "mentor_reviews_summary"] as const;
  for (const table of summaryTables) {
    const { error: pe } = await supabase.from(table).select("*").limit(1);
    if (pe) continue;
    const { column: mid } = await pickExistingColumn(supabase, table, ["mentor_id", "mentor_user_id", "user_id"]);
    if (!mid) continue;
    const { data, error } = await supabase.from(table).select("*").in(mid, mentorIds);
    if (error) continue;
    const map = new Map<string, { count: number | null; avg: number | null }>();
    for (const row of (data as unknown as Row[]) ?? []) {
      const id = String(row[mid]);
      const cnt =
        typeof row.review_count === "number"
          ? row.review_count
          : typeof row.count === "number"
            ? row.count
            : typeof row.reviews_count === "number"
              ? row.reviews_count
              : null;
      const avg =
        typeof row.avg_rating === "number"
          ? row.avg_rating
          : typeof row.average_rating === "number"
            ? row.average_rating
            : typeof row.rating_avg === "number"
              ? row.rating_avg
              : null;
      map.set(id, { count: cnt, avg });
    }
    return { map, probe: `${table} · in(${mid})` };
  }

  for (const table of ["reviews", "mentor_reviews", "subscription_reviews"] as const) {
    const { error: pe } = await supabase.from(table).select("id").limit(1);
    if (pe) continue;
    const { column: mid } = await pickExistingColumn(supabase, table, [
      "mentor_id",
      "mentor_user_id",
      "reviewee_id",
      "to_user_id",
      "target_user_id",
    ]);
    if (!mid) continue;
    const { column: ratingCol } = await pickExistingColumn(supabase, table, ["rating", "score", "stars"]);
    const vis = await probePublicReviewVisibilityColumns(supabase, table);
    let batchQ = supabase.from(table).select("*").in(mid, mentorIds).limit(2500);
    if (vis.isHidden) batchQ = batchQ.eq(vis.isHidden, false);
    if (vis.isBlinded) batchQ = batchQ.eq(vis.isBlinded, false);
    const { data, error } = await batchQ;
    if (error) continue;
    const acc = new Map<string, { c: number; rs: number; rn: number }>();
    for (const row of (data as unknown as Row[]) ?? []) {
      const id = String(row[mid]);
      const s = acc.get(id) ?? { c: 0, rs: 0, rn: 0 };
      s.c += 1;
      if (ratingCol && typeof row[ratingCol] === "number") {
        s.rs += row[ratingCol] as number;
        s.rn += 1;
      }
      acc.set(id, s);
    }
    const map = new Map<string, { count: number | null; avg: number | null }>();
    for (const [id, s] of acc) {
      map.set(id, { count: s.c, avg: s.rn ? s.rs / s.rn : null });
    }
    return { map, probe: `${table} · in(${mid}) · 최대 2500행 집계` };
  }

  return { map: empty, probe: "reviews_summary / reviews 계열 미가용 또는 RLS" };
}

type MentorPlanBatch = { label: string; byTier: PlansByTier; probe: string };

async function batchPlanLabels(
  supabase: SupabaseClient,
  mentorIds: string[]
): Promise<{ byMentor: Map<string, MentorPlanBatch>; probe: string }> {
  let lastProbe = "plans 테이블 없음 또는 RLS";

  for (const table of PLAN_TABLES) {
    const { error: pe } = await supabase.from(table).select("id").limit(1);
    if (pe) {
      lastProbe = `${table}: ${pe.message}`;
      continue;
    }
    const { column: fk, error: fkErr } = await pickExistingColumn(supabase, table, PLAN_FK);
    if (!fk) {
      lastProbe = `${table}: ${fkErr ?? "FK 컬럼 없음"}`;
      continue;
    }
    const { data, error } = await supabase.from(table).select("*").in(fk, mentorIds).limit(800);
    if (error) {
      lastProbe = `${table}.${fk}: ${error.message}`;
      continue;
    }
    const rows = (data as unknown as Row[]) ?? [];
    const rowsByMentor = new Map<string, Row[]>();
    for (const row of rows) {
      const mid = String(row[fk]);
      if (!mentorIds.includes(mid)) continue;
      const list = rowsByMentor.get(mid) ?? [];
      list.push(row);
      rowsByMentor.set(mid, list);
    }
    const out = new Map<string, MentorPlanBatch>();
    for (const [mid, mentorRows] of rowsByMentor) {
      const { byTier } = assignPlansByTier(mentorRows);
      const standardPrice = byTier.standard ? parsePriceNumber(byTier.standard) : null;
      let minPrice: number | null = null;
      for (const tier of ["limited", "standard", "premium"] as const) {
        const p = byTier[tier] ? parsePriceNumber(byTier[tier]!) : null;
        if (p != null) minPrice = minPrice == null ? p : Math.min(minPrice, p);
      }
      const label =
        standardPrice != null
          ? `Standard ${formatMoney(standardPrice)}`
          : minPrice != null
            ? `대표 ${formatMoney(minPrice)}~`
            : null;
      out.set(mid, {
        label: label ?? "",
        byTier,
        probe: `${table}.${fk}`,
      });
    }
    return { byMentor: out, probe: `${table}.${fk} · 행 ${rows.length}` };
  }

  return { byMentor: new Map(), probe: lastProbe };
}

function formatMoney(n: number): string {
  if (n >= 1000 && n === Math.floor(n)) return `${Math.round(n).toLocaleString("ko-KR")}원`;
  return `${n}`;
}

function cardMatchesFilters(f: MentorsListFilters, d: MentorProfileDisplay): boolean {
  if (f.q) {
    const blob = [d.displayName, d.intro, d.subjects, d.tags, d.university, d.department, d.highSchool]
      .join(" ")
      .toLowerCase();
    if (!blob.includes(f.q.toLowerCase())) return false;
  }
  if (f.university && !d.university.toLowerCase().includes(f.university.toLowerCase())) return false;
  if (f.subject && !d.subjects.toLowerCase().includes(f.subject.toLowerCase())) return false;
  if (f.verification && !d.verification.toLowerCase().includes(f.verification.toLowerCase())) return false;
  return true;
}

function sortKey(f: MentorsListSort): (a: MentorPublicListCard, b: MentorPublicListCard) => number {
  switch (f) {
    case "rating":
      return (a, b) => (b.avgRating ?? -1e9) - (a.avgRating ?? -1e9);
    case "reviews":
      return (a, b) => (b.reviewCount ?? -1e9) - (a.reviewCount ?? -1e9);
    case "price": {
      const parseLabel = (s: string | null) => {
        if (!s) return Number.POSITIVE_INFINITY;
        const m = s.match(/[\d,.]+/);
        if (!m) return Number.POSITIVE_INFINITY;
        return Number.parseFloat(m[0].replace(/,/g, "")) || Number.POSITIVE_INFINITY;
      };
      return (a, b) => parseLabel(a.priceLabel) - parseLabel(b.priceLabel);
    }
    case "new":
    default:
      return (a, b) => {
        const ta = a.userCreatedAt ? Date.parse(a.userCreatedAt) : 0;
        const tb = b.userCreatedAt ? Date.parse(b.userCreatedAt) : 0;
        return tb - ta;
      };
  }
}

/**
 * 공개 멘토 목록: P0 `mentor_directory_list` + `mentor_profiles_for_directory` RPC(005), 미배포 시 RLS(본인만) fallback.
 * RLS로 행이 비면 cards는 빈 배열(더미 없음).
 */
export async function loadPublicMentorsList(
  supabase: SupabaseClient,
  filters: MentorsListFilters,
  opts?: { fetchLimit?: number; resultCap?: number }
): Promise<PublicMentorsListResult> {
  const fetchLimit = opts?.fetchLimit ?? 80;
  const resultCap = opts?.resultCap ?? 36;
  const probes: string[] = [];

  const { data: authData } = await supabase.auth.getUser();
  const authId = authData.user?.id ?? null;

  // Diagnostics
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY;
  probes.push(`supabase_config: URL=${Boolean(url)}, Key=${Boolean(anonKey)}`);

  const dir = await loadMentorDirectoryUserRows(supabase, fetchLimit);
  probes.push(dir.probe);
  if (dir.error) {
    console.error("[mentors] loadPublicMentorsList: directory users failed", {
      error: dir.error,
      probe: dir.probe,
      usedRpc: dir.usedRpc,
      supabaseConfig: { url: Boolean(url), key: Boolean(anonKey) },
      probes,
    });
    return {
      cards: [],
      usersError: dir.error,
      profilesError: null,
      probes,
      onlySelfVisibleHint: false,
    };
  }

  const users = dir.users;
  probes.push(`mentors(디렉터리): ${users.length}행`);

  const ids = users.map((u) => u.id);
  let profilesError: string | null = null;
  const profileByUser = new Map<string, Row>();

  if (ids.length) {
    const pBatch = await loadMentorProfilesForDirectory(supabase, ids);
    probes.push(pBatch.probe);
    if (pBatch.error) {
      profilesError = pBatch.error;
    } else {
      for (const [uid, row] of pBatch.byUser) {
        profileByUser.set(uid, row);
      }
    }
  }

  const [revBatch, planBatch] =
    ids.length > 0
      ? await Promise.all([batchReviewStats(supabase, ids), batchPlanLabels(supabase, ids)])
      : [{ map: new Map<string, { count: number; avg: number | null }>(), probe: "skip" }, { byMentor: new Map(), probe: "skip" }];

  probes.push(`reviews: ${revBatch.probe}`);
  probes.push(`plans: ${planBatch.probe}`);

  const cards: MentorPublicListCard[] = [];
  for (const u of users) {
    const prow = profileByUser.get(u.id) ?? null;
    const display = buildMentorProfileDisplay(prow, u);
    const rev = revBatch.map.get(u.id) ?? { count: null, avg: null };
    const plan = planBatch.byMentor.get(u.id);
    const card: MentorPublicListCard = {
      mentorId: u.id,
      display,
      userStatus: u.status,
      userCreatedAt: u.created_at ?? null,
      reviewCount: rev.count,
      avgRating: rev.avg,
      reviewsProbe: revBatch.probe,
      priceLabel: plan?.label ? plan.label : null,
      byTier: plan?.byTier ?? null,
      plansProbe: plan?.probe ?? planBatch.probe,
    };
    if (cardMatchesFilters(filters, display)) {
      cards.push(card);
    }
  }

  cards.sort(sortKey(filters.sort));
  const sliced = cards.slice(0, resultCap);

  const onlySelfVisibleHint =
    Boolean(authId) && sliced.length === 1 && sliced[0]?.mentorId === authId && !filters.q && !filters.university && !filters.subject;

  return {
    cards: sliced,
    usersError: null,
    profilesError,
    probes,
    onlySelfVisibleHint,
  };
}
