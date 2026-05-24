import type { AppRole } from "@/lib/types/user";

export type MainNavItem = { href: string; label: string };

/** 멘토가 접근하면 대시보드로 보낼 캐시·지갑 경로 (충전은 네비 허용) */
export const MENTOR_BLOCKED_CASH_PATHS = ["/cash", "/wallet/ledger"] as const;

export function isCashNavHref(href: string): boolean {
  return (
    href === "/cash" ||
    href.startsWith("/wallet") ||
    MENTOR_BLOCKED_CASH_PATHS.some((p) => href === p || href.startsWith(`${p}/`))
  );
}

function isCashNavItem(item: MainNavItem): boolean {
  if (item.href === "/wallet/charge") return false;
  if (isCashNavHref(item.href)) return true;
  const label = item.label.trim();
  return label === "캐시결제" || label === "캐시 충전" || label === "지갑";
}

function isPayoutNavItem(item: MainNavItem): boolean {
  return (
    item.href.startsWith("/mentor/payouts") ||
    item.label === "정산" ||
    item.label === "정산/수익" ||
    item.label === "캐시정산"
  );
}

export const publicMainNav: MainNavItem[] = [
  { href: "/mentors", label: "멘토 찾기" },
  { href: "/question-room", label: "질문방" },
  { href: "/community", label: "커뮤니티" },
  { href: "/custom-request", label: "맞춤의뢰" },
  { href: "/cash", label: "캐시결제" },
];

export const studentMainNav: MainNavItem[] = [
  { href: "/mentors", label: "멘토 찾기" },
  { href: "/question-room", label: "질문방" },
  { href: "/community", label: "커뮤니티" },
  { href: "/custom-request", label: "맞춤의뢰" },
  { href: "/cash", label: "캐시결제" },
  { href: "/mypage", label: "마이페이지" },
];

/** 멘토 상단 헤더 네비 (잠금값 — 대시보드 제외) */
export const mentorHeaderNav: MainNavItem[] = [
  { href: "/mentor/question-room", label: "질문방" },
  { href: "/mentor/custom-request/dashboard", label: "맞춤의뢰" },
  { href: "/community", label: "커뮤니티" },
  { href: "/wallet/charge", label: "캐시충전" },
  { href: "/mentor/payouts", label: "정산" },
];

/** 멘토 사이드바·내부 메뉴 — 대시보드 포함 */
export const mentorMainNav: MainNavItem[] = [
  { href: "/mentor/dashboard", label: "대시보드" },
  ...mentorHeaderNav,
];

export const adminMainNav: MainNavItem[] = [
  { href: "/mentors", label: "멘토 찾기" },
  { href: "/question-room", label: "질문방" },
  { href: "/community", label: "커뮤니티" },
  { href: "/custom-request", label: "맞춤의뢰" },
  { href: "/cash", label: "캐시결제" },
  { href: "/admin", label: "관리" },
];

/** 랜딩(비로그인·학생) 상단 — 마이페이지 제외 */
export const landingGuestNav: MainNavItem[] = [
  { href: "/mentors", label: "멘토 찾기" },
  { href: "/question-room", label: "질문방" },
  { href: "/community", label: "커뮤니티" },
  { href: "/custom-request", label: "맞춤의뢰" },
  { href: "/cash", label: "캐시결제" },
  { href: "/mypage", label: "마이페이지" },
];

export function getMainNavForRole(sessionRole: AppRole | null | undefined): MainNavItem[] {
  let items: MainNavItem[];
  if (sessionRole == null) {
    items = publicMainNav;
  } else if (sessionRole === "mentor") {
    items = mentorHeaderNav;
  } else if (sessionRole === "admin") {
    items = adminMainNav;
  } else {
    items = studentMainNav;
  }

  if (sessionRole === "mentor") {
    return items.filter((item) => !isCashNavItem(item));
  }
  if (sessionRole === "student") {
    return items.filter((item) => !isPayoutNavItem(item));
  }
  return items;
}

export function getLandingNavForProfile(role: AppRole | null | undefined): MainNavItem[] {
  if (role === "mentor") {
    return getMainNavForRole("mentor");
  }
  if (role === "student") {
    return landingGuestNav;
  }
  return landingGuestNav;
}

export function mentorBlockedCashPath(pathname: string): boolean {
  return MENTOR_BLOCKED_CASH_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}
