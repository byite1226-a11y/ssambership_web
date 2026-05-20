/** 관리자 콘솔 전용 네비 */
export const ADMIN_CONSOLE_NAV = [
  { href: "/admin/dashboard", label: "대시보드", icon: "dashboard" },
  { href: "/admin/mentor-approval", label: "멘토 승인", icon: "mentor" },
  { href: "/admin/moderation", label: "콘텐츠 검수", icon: "moderation" },
  { href: "/admin/reviews", label: "리뷰 관리", icon: "reviews" },
  { href: "/admin/disputes", label: "신고·분쟁", icon: "disputes" },
  { href: "/admin/refunds", label: "환불·정산", icon: "refunds" },
  { href: "/admin/notices", label: "이벤트 관리", icon: "events" },
  { href: "/admin/audit-logs", label: "활동 로그", icon: "logs" },
  { href: "/admin/settings", label: "시스템 설정", icon: "settings" },
] as const;

export function adminNavItemIsActive(pathname: string, href: string): boolean {
  const path = pathname.endsWith("/") && pathname.length > 1 ? pathname.slice(0, -1) : pathname;
  if (href === "/admin/dashboard") {
    return path === "/admin/dashboard" || path === "/admin";
  }
  return path === href || path.startsWith(`${href}/`);
}
