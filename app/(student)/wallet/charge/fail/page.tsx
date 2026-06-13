import { requireRole } from "@/lib/auth/routeGuard";
import { createClient } from "@/lib/supabase/server";
import { fetchWalletBalanceByUserId } from "@/lib/cash/cashQueries";
import { parseWalletBalanceKrw } from "@/lib/cash/parseWalletBalanceKrw";
import { StudentDashboardShell } from "@/components/mypage/StudentDashboardShell";
import { WalletChargeFailClient } from "@/components/cash/WalletChargeFailClient";

type Props = { searchParams?: Promise<Record<string, string | string[] | undefined>> };

function one(sp: Record<string, string | string[] | undefined>, key: string): string | undefined {
  const v = sp[key];
  if (Array.isArray(v)) return v[0];
  return typeof v === "string" && v.length > 0 ? v : undefined;
}

export default async function WalletChargeFailPage({ searchParams }: Props) {
  const { user, profile } = await requireRole("student");
  const sp = (await searchParams) ?? {};
  const code = one(sp, "code");
  const message = one(sp, "message") ?? "결제가 취소되었거나 승인되지 않았습니다.";

  const supabase = await createClient();
  const balance = await fetchWalletBalanceByUserId(supabase, user.id);
  const cashBalanceKrw = parseWalletBalanceKrw(balance.row);

  return (
    <StudentDashboardShell activeTab="wallet" user={user} profile={profile} profileLoadError={null} cashBalanceKrw={cashBalanceKrw}>
      <WalletChargeFailClient code={code} message={message} />
    </StudentDashboardShell>
  );
}
