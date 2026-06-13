export const COMMUNITY_BOARD_SORT_TABS = [
  { id: "all", label: "전체" },
  { id: "latest", label: "최신" },
  { id: "popular", label: "인기" },
] as const;

export type CommunityBoardSortTab = (typeof COMMUNITY_BOARD_SORT_TABS)[number]["id"];

export const COMMUNITY_BOARD_SORT_DEFAULT: CommunityBoardSortTab = "all";

export function parseCommunityBoardSortTab(raw: string | undefined): CommunityBoardSortTab {
  const v = (raw ?? COMMUNITY_BOARD_SORT_DEFAULT).toLowerCase();
  if (v === "latest" || v === "popular" || v === "all") return v;
  return COMMUNITY_BOARD_SORT_DEFAULT;
}
