import type { ReactNode } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/shell/AppShell";
import { mentorBlockedCashPath } from "@/lib/shell/mainNavItems";
import { requireRole } from "@/lib/auth/routeGuard";

export default async function MentorLayout({ children }: { children: ReactNode }) {
  const pathname = (await headers()).get("x-pathname") ?? "";
  if (mentorBlockedCashPath(pathname)) {
    redirect("/mentor/dashboard");
  }

  const { profile } = await requireRole("mentor");
  return (
    <AppShell area="mentor" sessionRole="mentor" userProfile={profile}>
      {children}
    </AppShell>
  );
}
