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
 * 커뮤니티 히어로 CTA — 질문방(/question-room) 링크는 넣지 않음.
 * - 멘토: 화면별 게시글 작성 / 숏폼 업로드·탐색
 * - 학생·관리자·기타 로그인: 도메인 내부 탐색만
 * - 비로그인: 로그인(댓글·스크랩 안내) + 탐색
 */
export function buildCommunityHeroCtas(params: {
  surface: CommunityHeroSurface;
  role: AppRole | null | undefined;
  loggedIn: boolean;
  nextPath?: string;
}): CommunityHeroCta[] {
  const { surface, role, loggedIn } = params;
  const next = encodeURIComponent(params.nextPath ?? "/community");

  if (isMentor(role)) {
    switch (surface) {
      case "home":
        return [
          { href: "/mentor/community/new", label: "게시글 작성", tone: "blue" },
          { href: "/mentor/community/new", label: "숏폼 업로드", tone: "slate" },
        ];
      case "board_list":
        return [{ href: "/mentor/community/new", label: "게시글 작성", tone: "blue" }];
      case "shortform_list":
        return [{ href: "/mentor/community/new", label: "숏폼 업로드", tone: "blue" }];
      case "board_detail":
        return [
          { href: "/mentor/community/new", label: "게시글 작성", tone: "blue" },
          { href: "/community", label: "커뮤니티 홈", tone: "slate" },
          { href: "/community/shortform", label: "숏폼 보기", tone: "slate" },
        ];
      case "shortform_detail":
        return [
          { href: "/mentor/community/new", label: "숏폼 업로드", tone: "blue" },
          { href: "/community/board", label: "게시판 보기", tone: "slate" },
          { href: "/community", label: "커뮤니티 홈", tone: "slate" },
        ];
      case "me":
        return [
          { href: "/community/board", label: "내 게시글", tone: "slate" },
          { href: "/community/shortform", label: "내 숏폼", tone: "slate" },
          { href: "/community", label: "커뮤니티 홈", tone: "slate" },
          { href: "/mentor/community/new", label: "멘토 글쓰기", tone: "blue" },
        ];
      case "compose_gate":
        return [];
    }
  }

  if (!loggedIn) {
    const login: CommunityHeroCta = {
      href: `/login?next=${next}`,
      label: "로그인하고 댓글·스크랩 이용하기",
      tone: "blue",
    };
    switch (surface) {
      case "home":
        return [
          login,
          { href: "/community/shortform", label: "숏폼 보기", tone: "slate" },
          { href: "/community/board", label: "게시판 보기", tone: "slate" },
        ];
      case "board_list":
        return [
          login,
          { href: "/community", label: "커뮤니티 홈", tone: "slate" },
          { href: "/community/shortform", label: "숏폼 보기", tone: "slate" },
        ];
      case "shortform_list":
        return [
          login,
          { href: "/community", label: "커뮤니티 홈", tone: "slate" },
          { href: "/community/board", label: "게시판 보기", tone: "slate" },
        ];
      case "board_detail":
        return [
          login,
          { href: "/community", label: "커뮤니티 홈", tone: "slate" },
          { href: "/community/shortform", label: "숏폼 보기", tone: "slate" },
        ];
      case "shortform_detail":
        return [
          login,
          { href: "/community", label: "커뮤니티 홈", tone: "slate" },
          { href: "/community/board", label: "게시판 보기", tone: "slate" },
        ];
      case "me":
        return [login, { href: "/community", label: "커뮤니티 홈", tone: "slate" }];
      case "compose_gate":
        return [login];
    }
  }

  /* student · admin · 로그인했으나 role 없음: 작성·질문 CTA 없음, 내부 탐색만 */
  switch (surface) {
    case "home":
      return [
        { href: "/community/shortform", label: "숏폼 보기", tone: "blue" },
        { href: "/community/board", label: "게시판 보기", tone: "slate" },
      ];
    case "board_list":
      return [{ href: "/community", label: "커뮤니티 홈", tone: "blue" }];
    case "shortform_list":
      return [{ href: "/community/board", label: "게시판 보기", tone: "blue" }];
    case "board_detail":
      return [
        { href: "/community", label: "커뮤니티 홈", tone: "slate" },
        { href: "/community/shortform", label: "숏폼 보기", tone: "slate" },
      ];
    case "shortform_detail":
      return [
        { href: "/community", label: "커뮤니티 홈", tone: "slate" },
        { href: "/community/board", label: "게시판 보기", tone: "slate" },
      ];
    case "me":
      return [{ href: "/community", label: "커뮤니티 홈", tone: "blue" }];
    case "compose_gate":
      return [];
  }
}
