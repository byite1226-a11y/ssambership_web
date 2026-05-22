const STORAGE_KEY = "ssambership_recent_mentors";
const MAX_RECENT = 20;

export type RecentMentorEntry = {
  mentorId: string;
  viewedAt: number;
};

export function readRecentMentorIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as RecentMentorEntry[];
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((e) => typeof e.mentorId === "string" && e.mentorId)
      .sort((a, b) => b.viewedAt - a.viewedAt)
      .map((e) => e.mentorId)
      .slice(0, MAX_RECENT);
  } catch {
    return [];
  }
}

export function recordRecentMentor(mentorId: string): void {
  if (typeof window === "undefined" || !mentorId) return;
  try {
    const prev = readRecentMentorIds().filter((id) => id !== mentorId);
    const next: RecentMentorEntry[] = [
      { mentorId, viewedAt: Date.now() },
      ...prev.map((id) => ({ mentorId: id, viewedAt: Date.now() - 1 })),
    ].slice(0, MAX_RECENT);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
}

export function recentMentorCount(): number {
  return readRecentMentorIds().length;
}
