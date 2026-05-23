import type { User } from "@supabase/supabase-js";
import { CashChargeWidget } from "@/components/cash/CashChargeWidget";
import { WalletChargeRecentSummary } from "@/components/cash/WalletChargeRecentSummary";
import { WalletChargeRightSidebar } from "@/components/cash/WalletChargeRightSidebar";
import { WalletChargeSidebar } from "@/components/cash/WalletChargeSidebar";
import type { WalletBalanceBreakdown } from "@/lib/cash/parseWalletBalanceKrw";
import type { WalletChargePageData } from "@/lib/cash/walletRouteData";
import type { UserRow } from "@/lib/types/user";
import { mapDataErrorMessage } from "@/lib/utils/mapDataError";

type Props = {
  user: User;
  profile: UserRow | null;
  data: WalletChargePageData;
  breakdown: WalletBalanceBreakdown;
  actionError?: string | null;
};

export function WalletChargePageView(props: Props) {
  const { user, profile, data, breakdown, actionError } = props;
  const displayName =
    profile?.full_name?.trim() || profile?.nickname?.trim() || user.email?.split("@")[0] || "회원";

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 antialiased">
      <header className="mb-6">
        <h1 className="text-2xl font-black tracking-tight text-slate-900">캐시 충전</h1>
        <p className="mt-1 text-sm text-slate-500">
          <span className="font-bold text-slate-700">{displayName}</span>님, 캐시를 충전하고 이용 내역을 확인하세요.
        </p>
      </header>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[260px_minmax(0,1fr)_240px]">
        <WalletChargeSidebar breakdown={breakdown} balanceError={data.balance.error} />

        <main className="min-w-0 space-y-6">
          {actionError ? (
            <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-950">
              {mapDataErrorMessage(actionError)}
            </p>
          ) : null}

          <CashChargeWidget userId={user.id} currentBalance={breakdown.totalCash} isAuthenticated />

          <WalletChargeRecentSummary rows={data.ledgerPreview.rows} error={data.ledgerPreview.error} />
        </main>

        <WalletChargeRightSidebar ledgerRows={data.ledgerPreview.rows} />
      </div>
    </div>
  );
}
