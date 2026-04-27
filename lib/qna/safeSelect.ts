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
