import type { ReactNode } from "react";
import { headers } from "next/headers";
import { AppShell } from "@/components/shell/AppShell";
import { requireRole, requireWalletChargeAccess } from "@/lib/auth/routeGuard";
import type { AppRole } from "@/lib/types/user";

function isWalletChargePath(pathname: string): boolean {
  return pathname === "/wallet" || pathname.startsWith("/wallet/charge");
}

export default async function StudentLayout({ children }: { children: ReactNode }) {
  const pathname = (await headers()).get("x-pathname") ?? "";

  if (isWalletChargePath(pathname)) {
    const { profile } = await requireWalletChargeAccess();
    const sessionRole: AppRole = profile?.role === "mentor" ? "mentor" : "student";
    return (
      <AppShell
        area={sessionRole === "mentor" ? "mentor" : "student"}
        sessionRole={sessionRole}
        userProfile={profile}
      >
        {children}
      </AppShell>
    );
  }

  const { profile } = await requireRole("student");
  return (
    <AppShell area="student" sessionRole="student" userProfile={profile}>
      {children}
    </AppShell>
  );
}
