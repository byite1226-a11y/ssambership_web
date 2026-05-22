import { redirect } from "next/navigation";

/** 레거시 경로 → 관리자 대시보드 */
export default function AdminDashboardShortcutPage() {
  redirect("/admin/dashboard");
}
