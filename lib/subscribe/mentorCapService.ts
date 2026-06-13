import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import type { SubscribePlanTier } from "@/lib/subscribe/subscribePageQueries";

type Row = Record<string, unknown>;

/** 플랜별 cap 가중치 (잠금값). 050 마이그레이션 subscription_cap_weight와 동일. */
export const CAP_WEIGHT_BY_TIER: Record<SubscribePlanTier, number> = {
  limited: 1.0,
  standard: 2.5,
  premium: 4.5,
};

/** 멘토 1인 cap 상한 기본값 (관리자만 조정). */
export const MENTOR_CAP_LIMIT_DEFAULT = 28;

export function capWeightForTier(tier: SubscribePlanTier): number {
  return CAP_WEIGHT_BY_TIER[tier] ?? 0;
}

export type MentorCapUsage = {
  /** 활성 구독 cap 가중치 합 */
  usedCap: number;
  /** 멘토 cap 상한 (mentor_profiles.cap_limit, 미적용 시 28) */
  capLimit: number;
  /** 활성 구독 수(명) */
  activeCount: number;
  /** 사용률 % (0~100, 반올림) */
  pct: number;
  /** 구독 마감 여부 (가장 작은 플랜도 못 받는 상태) */
  isFull: boolean;
};

function emptyUsage(capLimit = MENTOR_CAP_LIMIT_DEFAULT): MentorCapUsage {
  return { usedCap: 0, capLimit, activeCount: 0, pct: 0, isFull: false };
}

function tierWeightFromRow(row: Row): number {
  const t = String(row.plan_tier ?? "").toLowerCase().trim();
  if (t === "limited" || t === "standard" || t === "premium") {
    return CAP_WEIGHT_BY_TIER[t as SubscribePlanTier];
  }
  return 0;
}

function isActiveRow(row: Row): boolean {
  return String(row.status ?? "").toLowerCase().trim() === "active";
}

function buildUsage(usedCap: number, capLimit: number, activeCount: number): MentorCapUsage {
  const limit = Number.isFinite(capLimit) && capLimit > 0 ? capLimit : MENTOR_CAP_LIMIT_DEFAULT;
  const used = Number.isFinite(usedCap) && usedCap > 0 ? usedCap : 0;
  const pct = limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0;
  // 가장 작은 플랜(limited=1.0)도 못 받으면 마감
  const isFull = used + CAP_WEIGHT_BY_TIER.limited > limit;
  return { usedCap: used, capLimit: limit, activeCount, pct, isFull };
}

function adminClientOrNull(): SupabaseClient | null {
  try {
    return createServiceRoleClient();
  } catch {
    return null;
  }
}

/**
 * 여러 멘토의 cap 사용 현황을 한 번에 조회.
 * - 구독은 service role로 집계(학생 RLS는 본인 쌍만 보이므로 멘토 전체 합계를 못 냄).
 * - cap_limit 컬럼/서비스 키 미적용 시에도 안전 폴백(기본 28, 미마감).
 */
export async function loadMentorCapUsageBatch(
  mentorIds: string[]
): Promise<Map<string, MentorCapUsage>> {
  const out = new Map<string, MentorCapUsage>();
  const ids = Array.from(new Set(mentorIds.filter((id) => typeof id === "string" && id.trim())));
  if (ids.length === 0) return out;

  const admin = adminClientOrNull();
  if (!admin) {
    for (const id of ids) out.set(id, emptyUsage());
    return out;
  }

  // cap_limit (없으면 28)
  const capLimitByMentor = new Map<string, number>();
  try {
    const { data, error } = await admin
      .from("mentor_profiles")
      .select("user_id, cap_limit")
      .in("user_id", ids);
    if (!error && Array.isArray(data)) {
      for (const row of data as Row[]) {
        const uid = String(row.user_id ?? "");
        const lim = typeof row.cap_limit === "number" ? row.cap_limit : Number(row.cap_limit ?? NaN);
        if (uid) capLimitByMentor.set(uid, Number.isFinite(lim) && lim > 0 ? lim : MENTOR_CAP_LIMIT_DEFAULT);
      }
    }
  } catch {
    /* cap_limit 컬럼 미적용 → 기본 28 폴백 */
  }

  // 활성 구독 cap 합 + 인원수
  const usedByMentor = new Map<string, number>();
  const countByMentor = new Map<string, number>();
  try {
    const { data, error } = await admin
      .from("subscriptions")
      .select("mentor_id, plan_tier, status")
      .in("mentor_id", ids)
      .limit(5000);
    if (!error && Array.isArray(data)) {
      for (const row of data as Row[]) {
        if (!isActiveRow(row)) continue;
        const mid = String(row.mentor_id ?? "");
        if (!mid) continue;
        usedByMentor.set(mid, (usedByMentor.get(mid) ?? 0) + tierWeightFromRow(row));
        countByMentor.set(mid, (countByMentor.get(mid) ?? 0) + 1);
      }
    }
  } catch {
    /* 집계 실패 → used 0 폴백(미마감) */
  }

  for (const id of ids) {
    out.set(
      id,
      buildUsage(
        usedByMentor.get(id) ?? 0,
        capLimitByMentor.get(id) ?? MENTOR_CAP_LIMIT_DEFAULT,
        countByMentor.get(id) ?? 0
      )
    );
  }
  return out;
}

/** 단일 멘토 cap 사용 현황. */
export async function loadMentorCapUsage(mentorId: string): Promise<MentorCapUsage> {
  const map = await loadMentorCapUsageBatch([mentorId]);
  return map.get(mentorId) ?? emptyUsage();
}

/**
 * 신규 구독 시 cap 초과 여부. (used + tier weight) > limit 이면 true.
 * 결제 차단의 앱-레벨 1차 검증용. (DB 트리거가 동시성 안전 최종 방어.)
 */
export function wouldExceedCap(usage: MentorCapUsage, tier: SubscribePlanTier): boolean {
  return usage.usedCap + capWeightForTier(tier) > usage.capLimit;
}
