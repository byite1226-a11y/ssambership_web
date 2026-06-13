export type CommunityComposeKind = "board" | "shortform";

export const COMMUNITY_BOARD_COMPOSE_PATH = "/community/new";
export const COMMUNITY_SHORTFORM_COMPOSE_PATH = "/community/shortform/new";

export function communityComposePath(kind: CommunityComposeKind, extra?: Record<string, string>): string {
  const base = kind === "board" ? COMMUNITY_BOARD_COMPOSE_PATH : COMMUNITY_SHORTFORM_COMPOSE_PATH;
  if (!extra || Object.keys(extra).length === 0) return base;
  const params = new URLSearchParams();
  for (const [k, val] of Object.entries(extra)) {
    if (val) params.set(k, val);
  }
  return `${base}?${params.toString()}`;
}

/** 레거시 `?tab=board` on shortform/new → 게시글 작성 경로 */
export function legacyShortformTabRedirect(extra?: Record<string, string>): string | null {
  if (extra?.tab === "board") {
    const { tab: _tab, ...rest } = extra;
    return communityComposePath("board", rest);
  }
  return null;
}
