import { redirect } from "next/navigation";

/** 레거시 경로 → 멘토 대시보드 */
export default function MentorDashboardShortcutPage() {
  redirect("/mentor/dashboard");
}
