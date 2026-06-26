import type { AppRole } from "@/lib/types/user";

/** Which top-nav variant is shown (matches `AppShell` nav arrays). */
export type MainNavAudience = "public" | "student" | "mentor" | "admin";

export function mainNavAudience(sessionRole: AppRole | null | undefined): MainNavAudience {
  if (sessionRole === "mentor") return "mentor";
  if (sessionRole === "admin") return "admin";
  if (sessionRole === "student") return "student";
  return "public";
}

/**
 * Whether the main header link `itemHref` should show active styling for `pathname`.
 * Prefix-based; alias question-room routes included.
 */
export function isMainNavItemActive(pathname: string, itemHref: string, audience: MainNavAudience): boolean {
  const p = pathname;

  switch (itemHref) {
    case "/mentors":
      return p === "/mentors" || p.startsWith("/mentors/");
    case "/question-room":
      if (audience === "mentor") return false;
      return (
        p === "/question-room" ||
        p.startsWith("/question-room/") ||
        p === "/questions" ||
        p.startsWith("/questions/")
      );
    case "/mentor/question-room":
      return (
        p === "/mentor/question-room" ||
        p.startsWith("/mentor/question-room/") ||
        p === "/mentor/questions" ||
        p.startsWith("/mentor/questions/")
      );
    case "/community":
      return p === "/community" || p.startsWith("/community/");
    case "/custom-request":
    case "/mentor/custom-request":
    case "/mentor/custom-request/dashboard":
      return (
        p === "/custom-request" ||
        p.startsWith("/custom-request/") ||
        p === "/mentor/custom-request" ||
        p.startsWith("/mentor/custom-request/")
      );
    case "/cash":
      return (
        p === "/cash" ||
        p === "/cash-history" ||
        p === "/wallet" ||
        p.startsWith("/wallet/") ||
        p === "/payments" ||
        p === "/pricing"
      );
    case "/mypage":
      return p === "/mypage" || p.startsWith("/mypage/");
    case "/mentor/payouts":
      return p === "/mentor/payouts" || p.startsWith("/mentor/payouts/");
    case "/mentor/reviews":
      return p === "/mentor/reviews" || p.startsWith("/mentor/reviews/");
    case "/mentor/profile":
      return p === "/mentor/profile" || p.startsWith("/mentor/profile/");
    case "/admin":
      return p === "/admin" || p.startsWith("/admin/");
    default:
      return p === itemHref || p.startsWith(`${itemHref}/`);
  }
}
