/** 학생 이름 마스킹: 이지연 → 이*연 */
export function maskStudentName(fullName: string | null | undefined, nickname: string | null | undefined): string {
  const raw = (fullName?.trim() || nickname?.trim() || "학생").trim();
  if (raw.length <= 1) return `${raw}*`;
  if (raw.length === 2) return `${raw[0]}*`;
  return `${raw[0]}*${raw.slice(-1)}`;
}

export function formatGradeSubject(gradeLevel: string | null | undefined, subject: string | null | undefined): string {
  const g = gradeLevel?.trim() || "";
  const s = subject?.trim() || "";
  if (g && s) return `${g} · ${s}`;
  return g || s || "구독 멤버";
}

export function starIcons(rating: number): string {
  const n = Math.max(1, Math.min(5, Math.round(rating)));
  return "★".repeat(n) + "☆".repeat(5 - n);
}
