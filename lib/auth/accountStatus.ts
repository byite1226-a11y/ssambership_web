import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * 계정 상태(active / suspended / banned) 판정 + 핵심 액션 차단 메시지.
 *
 * - suspended: 일시 정지. `suspended_until` 이 지난 경우 자동으로 active 로 간주(lazy).
 * - banned: 영구 차단.
 * - 차단 메시지는 학생/멘토 공통이며, 핵심 액션(질문·구독·커뮤니티 작성·캐시 출금 등)에서 사용.
 */
export type AccountStatusInfo = {
  status?: string | null;
  suspended_until?: string | null;
};

export type EffectiveAccountStatus = "active" | "suspended" | "banned";

export function effectiveAccountStatus(
  info: AccountStatusInfo | null | undefined,
  now: Date = new Date()
): EffectiveAccountStatus {
  const raw = String(info?.status ?? "active").trim().toLowerCase();
  if (raw === "banned") return "banned";
  if (raw === "suspended") {
    const untilIso = info?.suspended_until;
    if (untilIso) {
      const until = new Date(untilIso);
      if (!Number.isNaN(until.getTime()) && until.getTime() <= now.getTime()) {
        return "active"; // 정지 기간 만료 → 자동 해제
      }
    }
    return "suspended";
  }
  return "active";
}

export function accountIsBlocked(
  info: AccountStatusInfo | null | undefined,
  now: Date = new Date()
): boolean {
  return effectiveAccountStatus(info, now) !== "active";
}

function formatUntil(untilIso: string | null | undefined): string | null {
  if (!untilIso) return null;
  const d = new Date(untilIso);
  if (Number.isNaN(d.getTime())) return null;
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

export function accountBlockMessage(
  info: AccountStatusInfo | null | undefined,
  now: Date = new Date()
): string | null {
  const status = effectiveAccountStatus(info, now);
  if (status === "active") return null;
  if (status === "banned") {
    return "계정이 영구 제한되어 이 작업을 할 수 없어요. 문의가 필요하면 고객센터로 연락해 주세요.";
  }
  const until = formatUntil(info?.suspended_until);
  return until
    ? `계정이 ${until}까지 일시 정지되어 이 작업을 할 수 없어요. 정지 해제 후 다시 이용해 주세요.`
    : "계정이 일시 정지되어 이 작업을 할 수 없어요. 정지 해제 후 다시 이용해 주세요.";
}

/**
 * 서버 액션용 가드. user 클라이언트로 본인 행(status, suspended_until)을 조회해 차단 여부를 판정.
 * (전역 프로필 select 를 건드리지 않아 컬럼 미적용 운영 환경에서도 안전 — 컬럼 없으면 active 취급)
 */
export async function assertAccountActive(
  supabase: SupabaseClient,
  userId: string
): Promise<{ ok: true } | { ok: false; userMessage: string }> {
  try {
    const { data, error } = await supabase
      .from("users")
      .select("status, suspended_until")
      .eq("id", userId)
      .maybeSingle();
    if (error) {
      // 컬럼 미적용 등으로 조회 실패 시 status 만이라도 확인
      const fallback = await supabase.from("users").select("status").eq("id", userId).maybeSingle();
      if (fallback.error || !fallback.data) return { ok: true };
      const msg = accountBlockMessage(fallback.data as AccountStatusInfo);
      return msg ? { ok: false, userMessage: msg } : { ok: true };
    }
    if (!data) return { ok: true };
    const msg = accountBlockMessage(data as AccountStatusInfo);
    return msg ? { ok: false, userMessage: msg } : { ok: true };
  } catch {
    return { ok: true };
  }
}
