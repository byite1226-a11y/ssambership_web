import type { ReactNode } from "react";
import { headers } from "next/headers";
import { requireRole } from "@/lib/auth/routeGuard";

/**
 * `/admin/*` 세그먼트 루트. `/admin/login` 은 가드 제외.
 */
export default async function AdminSegmentLayout({ children }: { children: ReactNode }) {
  const pathname = (await headers()).get("x-pathname") ?? "";
  const isLogin = pathname === "/admin/login" || pathname.startsWith("/admin/login/");
  if (!isLogin) {
    await requireRole("admin");
  }
  return children;
}
