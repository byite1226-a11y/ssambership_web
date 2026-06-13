import type { SupabaseClient } from "@supabase/supabase-js";
import { pickAuthorRoleSummary } from "@/lib/community/communityQueries";

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
  return user.nickname?.trim() || user.full_name?.trim() || null;
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
