import type { SupabaseClient } from "@supabase/supabase-js";

/** mentor_profiles.avg_response_hours → 정책 버킷 표기 (12 / 24 / 48 / 48+) */
export function formatAvgResponseHoursLabel(hours: number | null | undefined): string {
  if (hours == null || !Number.isFinite(hours) || hours < 0) {
    return "—";
  }
  if (hours <= 12) return "12시간 이내";
  if (hours <= 24) return "24시간 이내";
  if (hours <= 48) return "48시간 이내";
  return "48시간 이상";
}

export function avgResponseHoursFromProfileRow(row: Record<string, unknown> | null): number | null {
  if (!row) return null;
  for (const key of ["avg_response_hours", "average_response_hours", "response_hours"] as const) {
    const v = row[key];
    if (typeof v === "number" && Number.isFinite(v)) return v;
  }
  return null;
}

export async function loadMentorAvgResponseHours(
  supabase: SupabaseClient,
  mentorId: string
): Promise<number | null> {
  const { data, error } = await supabase.rpc("get_mentor_avg_response_hours", { p_mentor_id: mentorId });
  if (error) {
    if (!/function|schema cache|Could not find|does not exist|PGRST202|42883/i.test(error.message)) {
      console.error("[loadMentorAvgResponseHours]", error.message);
    }
    return null;
  }
  const value = typeof data === "number" ? data : Number(data);
  return Number.isFinite(value) ? value : null;
}
