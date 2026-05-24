import type { ReactNode } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { SiteFooter } from "@/components/common/SiteFooter";
import { AppShell } from "@/components/shell/AppShell";
import { getServerUserWithProfile } from "@/lib/auth/getServerUserWithProfile";
import { loadShellNotificationBell } from "@/lib/notifications/loadShellNotificationBell";
import { mentorBlockedCashPath } from "@/lib/shell/mainNavItems";
import type { AppRole } from "@/lib/types/user";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function PublicLayout({ children }: { children: ReactNode }) {
  const pathname = (await headers()).get("x-pathname") ?? "";
  const { user, profile } = await getServerUserWithProfile();
  const sessionRole: AppRole | null =
    profile?.role === "mentor" || profile?.role === "student" || profile?.role === "admin" ? profile.role : null;

  const notificationBell =
    user && sessionRole && sessionRole !== "admin"
      ? await loadShellNotificationBell(user.id, sessionRole)
      : null;

  if (sessionRole === "mentor" && mentorBlockedCashPath(pathname)) {
    redirect("/mentor/dashboard");
  }

  return (
    <AppShell area="public" sessionRole={sessionRole} userProfile={profile} notificationBell={notificationBell}>
      {children}
      <SiteFooter />
    </AppShell>
  );
}
