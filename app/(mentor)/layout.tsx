import type { ReactNode } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/shell/AppShell";
import { mentorBlockedCashPath } from "@/lib/shell/mainNavItems";
import { loadShellNotificationBell } from "@/lib/notifications/loadShellNotificationBell";
import { requireRole } from "@/lib/auth/routeGuard";

export default async function MentorLayout({ children }: { children: ReactNode }) {
  const pathname = (await headers()).get("x-pathname") ?? "";
  if (mentorBlockedCashPath(pathname)) {
    redirect("/mentor/mypage");
  }

  const { user, profile } = await requireRole("mentor");
  const notificationBell = await loadShellNotificationBell(user.id, "mentor");
  return (
    <AppShell area="mentor" sessionRole="mentor" userProfile={profile} notificationBell={notificationBell}>
      {children}
    </AppShell>
  );
}
