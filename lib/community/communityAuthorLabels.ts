import type { SupabaseClient } from "@supabase/supabase-js";
import { pickAuthorRoleSummary } from "@/lib/community/communityQueries";
import { maskStudentName } from "@/lib/reviews/reviewDisplay";

export const COMMUNITY_BRAND_MENTOR_LABEL = "쌤버십 멘토";
export const COMMUNITY_BRAND_MEMBER_LABEL = "쌤버십 회원";

export type CommunityAuthorNameRow = { nickname?: string | null; full_name?: string | null };

const STORED_NAME_KEYS = ["author_label", "author_name", "nickname", "display_name"] as const;

export function pickStoredAuthorName(row: Record<string, unknown>): string | null {
  for (const k of STORED_NAME_KEYS) {
    const v = row[k];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return null;
}

export function pickUserDisplayName(user: CommunityAuthorNameRow | null | undefined): string | null {
  if (!user) return null;
  const nickname = user.nickname?.trim();
  if (nickname) return nickname;
  // [개인정보] 닉네임이 없으면 법적 실명(full_name)을 그대로 공개하지 않고,
  // 후기(maskStudentName)와 동일하게 마스킹한다(이지연 → 이*연). 둘 다 없으면 null → 브랜드 라벨 폴백.
  const fullName = user.full_name?.trim();
  if (fullName) return maskStudentName(fullName, null);
  return null;
}

/**
 * [개인정보] 글·댓글·숏폼 작성 시 저장할 작성자 라벨을 프로필에서 계산한다.
 * 닉네임 → (없으면) 실명 마스킹(이지연 → 이*연, 후기와 동일) → (둘 다 없으면) 역할별 브랜드 라벨.
 * 법적 실명(full_name) 원문은 저장·노출하지 않는다.
 */
export function authorStoredLabelFromProfile(
  profile: { nickname?: string | null; full_name?: string | null; role?: string | null } | null | undefined
): string {
  const nickname = profile?.nickname?.trim();
  if (nickname) return nickname;
  const fullName = profile?.full_name?.trim();
  if (fullName) return maskStudentName(fullName, null);
  return profile?.role === "mentor" ? COMMUNITY_BRAND_MENTOR_LABEL : COMMUNITY_BRAND_MEMBER_LABEL;
}

export function communityAuthorFallbackLabel(row: Record<string, unknown>): string {
  const role = pickAuthorRoleSummary(row);
  if (role === "멘토") return COMMUNITY_BRAND_MENTOR_LABEL;
  return COMMUNITY_BRAND_MEMBER_LABEL;
}

export function resolveCommunityAuthorLabel(
  row: Record<string, unknown>,
  user?: CommunityAuthorNameRow | null
): string {
  return pickStoredAuthorName(row) ?? pickUserDisplayName(user) ?? communityAuthorFallbackLabel(row);
}

export function collectAuthorIdsNeedingLookup(rows: Record<string, unknown>[]): string[] {
  return [
    ...new Set(
      rows
        .filter((row) => !pickStoredAuthorName(row))
        .map((row) => (typeof row.author_id === "string" ? row.author_id : ""))
        .filter(Boolean)
    ),
  ];
}

export async function fetchCommunityAuthorNamesByIds(
  supabase: SupabaseClient,
  authorIds: string[]
): Promise<Map<string, CommunityAuthorNameRow>> {
  const unique = [...new Set(authorIds.filter(Boolean))];
  if (!unique.length) return new Map();
  const { data } = await supabase.from("users").select("id, nickname, full_name").in("id", unique);
  if (!data) return new Map();
  return new Map((data as (CommunityAuthorNameRow & { id: string })[]).map((u) => [u.id, u]));
}
