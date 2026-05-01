/** 관리자 콘솔 전용 네비(라벨·경로만; DB/내부 식별자 없음) */
export const ADMIN_CONSOLE_NAV = [
  { href: "/admin", label: "대시보드" },
  { href: "/admin/mentor-approvals", label: "멘토 승인" },
  { href: "/admin/reports", label: "신고 관리" },
  { href: "/admin/disputes", label: "분쟁 관리" },
  { href: "/admin/refunds", label: "환불 관리" },
  { href: "/admin/settlements", label: "정산 관리" },
  { href: "/admin/reviews", label: "리뷰 관리" },
  { href: "/admin/notices", label: "공지·프로모션" },
  { href: "/admin/audit-logs", label: "감사 로그" },
] as const;

export function adminNavItemIsActive(pathname: string, href: string): boolean {
  const path = pathname.endsWith("/") && pathname.length > 1 ? pathname.slice(0, -1) : pathname;
  if (href === "/admin") return path === "/admin";
  return path === href || path.startsWith(`${href}/`);
}
