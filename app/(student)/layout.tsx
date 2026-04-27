import type { ReactNode } from "react";
import { AppShell } from "@/components/shell/AppShell";
import { requireRole } from "@/lib/auth/routeGuard";

export default async function StudentLayout({ children }: { children: ReactNode }) {
  await requireRole("student");
  return <AppShell area="student">{children}</AppShell>;
}
