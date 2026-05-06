import type { CommunityHeroCta } from "@/components/community/CommunityPageHero";
import type { AppRole } from "@/lib/types/user";

/** 공개 커뮤니티 히어로가 위치한 화면(탐색·작성 동선 분기) */
export type CommunityHeroSurface =
  | "home"
  | "board_list"
  | "shortform_list"
  | "board_detail"
  | "shortform_detail"
  | "me"
  | "compose_gate";

function isMentor(role: AppRole | null | undefined): boolean {
  return role === "mentor";
}

/**
 * 커뮤니티 히어로 — 좌측 네비와 역할이 겹치지 않도록 CTA는 최대 1개.
 * 질문방 도메인 링크는 넣지 않음.
 */
export function buildCommunityHeroPrimaryAction(params: {
  surface: CommunityHeroSurface;
  role: AppRole | null | undefined;
  loggedIn: boolean;
  nextPath?: string;
}): CommunityHeroCta | null {
  const { surface, role, loggedIn } = params;
  const next = encodeURIComponent(params.nextPath ?? "/community");

  if (isMentor(role)) {
    switch (surface) {
      case "home":
        return { href: "/mentor/community/new", label: "게시글 작성", tone: "blue" };
      case "board_list":
      case "board_detail":
        return { href: "/mentor/community/new", label: "게시글 작성", tone: "blue" };
      case "shortform_list":
      case "shortform_detail":
        return { href: "/mentor/community/new", label: "숏폼 업로드", tone: "blue" };
      case "me":
      case "compose_gate":
        return null;
    }
  }

  if (!loggedIn) {
    const browseLogin: CommunityHeroCta = {
      href: `/login?next=${next}`,
      label: "로그인하고 댓글·스크랩 이용하기",
      tone: "blue",
    };
    switch (surface) {
      case "compose_gate":
        return {
          href: `/login?next=${next}`,
          label: "로그인하고 작성 가능 여부 확인하기",
          tone: "blue",
        };
      case "home":
      case "board_list":
      case "shortform_list":
      case "board_detail":
      case "shortform_detail":
      case "me":
        return browseLogin;
    }
  }

  /* student · admin · 기타 로그인 — 탐색은 좌측 메뉴, 히어로 CTA 없음 */
  return null;
}
