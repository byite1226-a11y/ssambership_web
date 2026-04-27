import type { ReactNode } from "react";
import { AppShell } from "@/components/shell/AppShell";
import { getServerUserWithProfile } from "@/lib/auth/getServerUserWithProfile";
import type { AppRole } from "@/lib/types/user";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function PublicLayout({ children }: { children: ReactNode }) {
  const { profile } = await getServerUserWithProfile();
  const sessionRole: AppRole | null =
    profile?.role === "mentor" || profile?.role === "student" || profile?.role === "admin" ? profile.role : null;

  return (
    <AppShell area="public" sessionRole={sessionRole}>
      {children}
    </AppShell>
  );
}
