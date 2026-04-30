import type { ReactNode } from "react";
import { AppShell } from "@/components/shell/AppShell";
import { requireRole } from "@/lib/auth/routeGuard";

export default async function MentorLayout({ children }: { children: ReactNode }) {
  await requireRole("mentor");
  return (
    <AppShell area="mentor" sessionRole="mentor">
      {children}
    </AppShell>
  );
}
