import type { ReactNode } from "react";
import { AppShell } from "@/components/shell/AppShell";
import { requireRole } from "@/lib/auth/routeGuard";

export default async function AdminConsoleLayout({ children }: { children: ReactNode }) {
  await requireRole("admin");
  return (
    <AppShell area="admin" sessionRole="admin">
      {children}
    </AppShell>
  );
}
