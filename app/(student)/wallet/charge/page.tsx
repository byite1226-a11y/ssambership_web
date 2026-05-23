import { requireWalletChargeAccess } from "@/lib/auth/routeGuard";
import { createClient } from "@/lib/supabase/server";
import { parseWalletBalanceBreakdown } from "@/lib/cash/parseWalletBalanceKrw";
import { loadWalletChargePageData } from "@/lib/cash/walletRouteData";
import { WalletChargePageView } from "@/components/cash/WalletChargePageView";

type Props = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function WalletChargePage({ searchParams }: Props) {
  const { user, profile } = await requireWalletChargeAccess();

  const supabase = await createClient();
  const data = await loadWalletChargePageData(supabase, user.id);
  const breakdown = parseWalletBalanceBreakdown(data.balance.row);
  const sp = (await searchParams) ?? {};
  const actionError = typeof sp.error === "string" && sp.error.length > 0 ? sp.error : null;

  return (
    <WalletChargePageView
      user={user}
      profile={profile}
      data={data}
      breakdown={breakdown}
      actionError={actionError}
    />
  );
}
