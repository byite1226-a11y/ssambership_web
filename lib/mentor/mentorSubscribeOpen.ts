import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * 멘토 self "신규 구독 받기" flag (is_open_for_subscriptions 계열).
 * 읽기·쓰기 전용 헬퍼 — escrow/정산/cap 계산과 무관. 컬럼 쓰기 패턴은 mentorProfileMutations 와 동일하게
 * 여러 후보 컬럼을 순차 시도하고 missing-column 은 건너뛴다(스키마 유연).
 */

function isMissingColumn(error: { code?: string | null; message?: string | null } | null): boolean {
  if (!error) return false;
  if (error.code === "42703") return true;
  const m = (error.message ?? "").toLowerCase();
  return (
    /column .* does not exist/.test(m) ||
    m.includes("could not find") ||
    m.includes("schema cache") ||
    m.includes("does not exist")
  );
}

/**
 * 멘토가 신규 구독을 받는 중인지. 기본 OPEN(true) — 명시적 false 만 차단.
 * 읽기 실패/행 없음/컬럼 부재 시 안전하게 true(기존 동작 유지: 게이트가 막지 않음).
 */
export async function loadMentorSubscribeOpen(
  supabase: SupabaseClient,
  mentorId: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from("mentor_profiles")
    .select("*")
    .eq("user_id", mentorId)
    .maybeSingle();
  if (error || !data) return true;
  const row = data as Record<string, unknown>;
  for (const k of ["is_open_for_subscriptions", "accepts_subscriptions", "accept_subscriptions"] as const) {
    const v = row[k];
    if (v === false || v === 0 || v === "false") return false;
  }
  return true;
}

/**
 * 멘토 self 토글: 본인 mentor_profiles 의 구독 받기 flag 컬럼만 갱신.
 * 다른 프로필 필드(소개·과목·가격 등)는 절대 건드리지 않는다.
 */
export async function setMentorSubscribeOpen(
  supabase: SupabaseClient,
  mentorId: string,
  open: boolean
): Promise<{ ok: true } | { ok: false; error: string }> {
  const now = new Date().toISOString();
  const patches: Record<string, unknown>[] = [
    { accept_subscriptions: open, accepts_subscriptions: open, is_open_for_subscriptions: open },
    { is_open_for_subscriptions: open },
    { accepts_subscriptions: open },
    { accept_subscriptions: open },
  ];
  let lastErr: string | null = null;
  for (const patch of patches) {
    const { error } = await supabase
      .from("mentor_profiles")
      .update({ ...patch, updated_at: now })
      .eq("user_id", mentorId);
    if (!error) return { ok: true };
    if (!isMissingColumn(error)) return { ok: false, error: error.message };
    lastErr = error.message;
  }
  return { ok: false, error: lastErr ?? "구독 받기 설정을 저장하지 못했어요." };
}
