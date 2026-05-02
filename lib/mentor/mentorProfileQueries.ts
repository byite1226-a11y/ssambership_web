import type { SupabaseClient } from "@supabase/supabase-js";
import { pickExistingColumn } from "@/lib/qna/safeSelect";

type Row = Record<string, unknown>;

export async function fetchMentorProfileRow(
  supabase: SupabaseClient,
  userId: string
): Promise<{ row: Row | null; error: string | null }> {
  const { data, error } = await supabase.from("mentor_profiles").select("*").eq("user_id", userId).maybeSingle();
  if (error) {
    return { row: null, error: error.message };
  }
  return { row: (data as Row) ?? null, error: null };
}

export async function fetchMentorMediaSample(
  supabase: SupabaseClient,
  userId: string,
  limit = 12
): Promise<{ rows: Row[]; table: string | null; error: string | null }> {
  const tables = ["mentor_media", "mentor_content_links", "mentor_link_items"] as const;
  for (const table of tables) {
    const { error: pe } = await supabase.from(table).select("id").limit(1);
    if (pe) continue;
    const { column } = await pickExistingColumn(supabase, table, [
      "mentor_id",
      "mentor_user_id",
      "user_id",
      "owner_id",
    ]);
    if (!column) {
      const { data, error } = await supabase.from(table).select("*").limit(limit);
      if (error) return { rows: [], table, error: null };
      return { rows: (data as Row[]) ?? [], table, error: null };
    }
    const { data, error } = await supabase.from(table).select("*").eq(column, userId).limit(limit);
    if (error) return { rows: [], table, error: null };
    return { rows: (data as Row[]) ?? [], table, error: null };
  }
  /** 테이블 미배포·RLS·probe 실패는 출시 전 흔함 — 빈 목록으로 조용히 처리 */
  return { rows: [], table: null, error: null };
}

/** 폼 initial 용(문자열) */
export function getProfileFieldString(row: Row | null, keys: string[], fallback = ""): string {
  if (!row) return fallback;
  for (const k of keys) {
    const v = row[k];
    if (v === null || v === undefined) continue;
    if (Array.isArray(v)) return v.join(", ");
    if (typeof v === "string" || typeof v === "number") return String(v);
  }
  return fallback;
}

export function getProfileFieldBool(row: Row | null, keys: string[]): boolean | null {
  if (!row) return null;
  for (const k of keys) {
    if (!(k in row)) continue;
    const v = row[k];
    if (typeof v === "boolean") return v;
  }
  return null;
}
