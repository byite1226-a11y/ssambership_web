import type { AppRole } from "@/lib/types/user";

/** 로고·루트 진입 시 역할별 홈. 비로그인은 게스트 랜딩(`/`). */
export function shellHomeHref(role: AppRole | null | undefined): string {
  if (role === "student") return "/mypage";
  if (role === "mentor") return "/mentor/mypage";
  if (role === "admin") return "/admin";
  return "/";
}
