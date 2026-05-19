import type { ReactNode } from "react";
import { AppShell } from "@/components/shell/AppShell";
import { requireRole } from "@/lib/auth/routeGuard";

export default async function StudentLayout({ children }: { children: ReactNode }) {
  const { profile } = await requireRole("student");
  return (
    <AppShell area="student" sessionRole="student" userProfile={profile}>
      {children}
    </AppShell>
  );
}
