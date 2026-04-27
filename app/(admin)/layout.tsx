import type { ReactNode } from "react";
import { AppShell } from "@/components/shell/AppShell";
import { requireRole } from "@/lib/auth/routeGuard";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  await requireRole("admin");
  return <AppShell area="admin">{children}</AppShell>;
}
