export type CommunityMeTab = "overview" | "posts" | "drafts" | "scraps";

const VALID = new Set<string>(["overview", "posts", "drafts", "scraps"]);

/** `?tab=` 값 파싱. 없음·잘못된 값은 overview */
export function parseCommunityMeTab(tab: string | string[] | undefined | null): CommunityMeTab {
  const raw = Array.isArray(tab) ? tab[0] : tab;
  if (typeof raw !== "string" || !raw.trim()) return "overview";
  const v = raw.trim().toLowerCase();
  if (VALID.has(v)) return v as CommunityMeTab;
  return "overview";
}

export function communityMePath(tab: CommunityMeTab): string {
  return tab === "overview" ? "/community/me" : `/community/me?tab=${tab}`;
}
