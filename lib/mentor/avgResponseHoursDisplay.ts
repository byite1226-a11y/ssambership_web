/** mentor_profiles.avg_response_hours → 12시간 단위 표기 (12 / 24 / 36 …) */
export function formatAvgResponseHoursLabel(hours: number | null | undefined): string {
  if (hours == null || !Number.isFinite(hours) || hours < 0) {
    return "12시간 이내";
  }
  const bucket = Math.ceil(hours / 12) * 12 || 12;
  return `${bucket}시간 이내`;
}

export function avgResponseHoursFromProfileRow(row: Record<string, unknown> | null): number | null {
  if (!row) return null;
  for (const key of ["avg_response_hours", "average_response_hours", "response_hours"] as const) {
    const v = row[key];
    if (typeof v === "number" && Number.isFinite(v)) return v;
  }
  return null;
}
