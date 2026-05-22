import { requireWalletChargeAccess } from "@/lib/auth/routeGuard";
import { createClient } from "@/lib/supabase/server";
import { parseWalletBalanceBreakdown } from "@/lib/cash/parseWalletBalanceKrw";
import { loadWalletChargePageData } from "@/lib/cash/walletRouteData";
import { CashChargeWidget } from "@/components/cash/CashChargeWidget";
import { WalletChargeSidebar } from "@/components/cash/WalletChargeSidebar";
import { WalletChargeRightSidebar } from "@/components/cash/WalletChargeRightSidebar";
import { WalletChargeRecentSummary } from "@/components/cash/WalletChargeRecentSummary";
import { mapDataErrorMessage } from "@/lib/utils/mapDataError";

type Props = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function WalletChargePage({ searchParams }: Props) {
  const { user } = await requireWalletChargeAccess();

  const supabase = await createClient();
  const data = await loadWalletChargePageData(supabase, user.id);
  const breakdown = parseWalletBalanceBreakdown(data.balance.row);
  const sp = (await searchParams) ?? {};
  const actionError = typeof sp.error === "string" && sp.error.length > 0 ? sp.error : null;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 antialiased">
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[260px_minmax(0,1fr)_240px]">
        <WalletChargeSidebar breakdown={breakdown} balanceError={data.balance.error} />

        <main className="min-w-0 space-y-6">
          {actionError ? (
            <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-950">
              {mapDataErrorMessage(actionError)}
            </p>
          ) : null}

          <CashChargeWidget userId={user.id} currentBalance={breakdown.totalCash} />

          <WalletChargeRecentSummary rows={data.ledgerPreview.rows} error={data.ledgerPreview.error} />
        </main>

        <WalletChargeRightSidebar ledgerRows={data.ledgerPreview.rows} />
      </div>
    </div>
  );
}
