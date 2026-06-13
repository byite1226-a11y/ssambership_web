import type { SupabaseClient } from "@supabase/supabase-js";

export async function pickExistingColumn(
  supabase: SupabaseClient,
  table: string,
  candidates: readonly string[]
): Promise<{ column: string | null; error: string | null }> {
  for (const col of candidates) {
    const { error } = await supabase.from(table).select(col).limit(1);
    if (!error) {
      return { column: col, error: null };
    }
  }
  return { column: null, error: `Could not find any of: ${candidates.join(", ")}` };
}

export function getStringField(row: Record<string, unknown>, keys: string[]): string | null {
  for (const k of keys) {
    const v = row[k];
    if (typeof v === "string" && v.trim()) return v;
  }
  return null;
}

function isSupabaseRow(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !("error" in value && (value as { error?: unknown }).error === true);
}

/** Supabase `.select()` 결과 배열을 안전하게 Record 행 배열로 정규화 */
export function rowsFromSupabaseData(data: unknown): Record<string, unknown>[] {
  if (!Array.isArray(data)) return [];
  return data.filter(isSupabaseRow);
}
