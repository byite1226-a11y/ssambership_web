import type { ReactNode } from "react";
import { AdminConsoleShell } from "@/components/admin/AdminConsoleShell";
import { requireRole } from "@/lib/auth/routeGuard";

export default async function AdminConsoleLayout({ children }: { children: ReactNode }) {
  const { profile } = await requireRole("admin");
  return <AdminConsoleShell profile={profile}>{children}</AdminConsoleShell>;
}
