import { requireRole } from "@/lib/auth/routeGuard";
import { createClient } from "@/lib/supabase/server";
import { parseWalletBalanceBreakdown } from "@/lib/cash/parseWalletBalanceKrw";
import { loadWalletChargePageData } from "@/lib/cash/walletRouteData";
import { WalletChargeBody } from "@/components/cash/WalletChargeBody";
import { WalletChargeSidebar } from "@/components/cash/WalletChargeSidebar";
import { mapDataErrorMessage } from "@/lib/utils/mapDataError";

type Props = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function WalletChargePage({ searchParams }: Props) {
  const { user } = await requireRole("student");

  const supabase = await createClient();
  const data = await loadWalletChargePageData(supabase, user.id);
  const breakdown = parseWalletBalanceBreakdown(data.balance.row);
  const sp = (await searchParams) ?? {};
  const actionOk = typeof sp.ok === "string" && sp.ok.length > 0 ? sp.ok : null;
  const actionError = typeof sp.error === "string" && sp.error.length > 0 ? sp.error : null;
  const allowTestTopup = process.env.CASH_TOPUP_ALLOW_TEST_CHARGE === "true";

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 antialiased">
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
        <WalletChargeSidebar breakdown={breakdown} balanceError={data.balance.error} />

        <main className="min-w-0 space-y-6">
          <header>
            <h1 className="text-2xl font-black tracking-tight text-slate-900">캐시 충전</h1>
            <p className="mt-1 text-sm text-slate-500">패키지를 선택하고 카드로 충전하세요. 1캐시 = 1원입니다.</p>
          </header>

          <WalletChargeBody
            data={data}
            userId={user.id}
            currentBalance={breakdown.totalCash}
            actionOk={actionOk}
            actionError={actionError ? mapDataErrorMessage(actionError) : null}
            allowTestTopup={allowTestTopup}
            hideBalanceCard
            hidePackagesSection
            hideFaqSection
          />
        </main>
      </div>
    </div>
  );
}
