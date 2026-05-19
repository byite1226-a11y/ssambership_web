import { requireRole } from "@/lib/auth/routeGuard";
import { createClient } from "@/lib/supabase/server";
import { parseWalletBalanceKrw } from "@/lib/cash/parseWalletBalanceKrw";
import { loadStudentMypageBundle } from "@/lib/mypage/mypageQueries";
import { loadWalletChargePageData } from "@/lib/cash/walletRouteData";
import { StudentDashboardShell } from "@/components/mypage/StudentDashboardShell";
import { WalletChargeBody } from "@/components/cash/WalletChargeBody";
import { mapDataErrorMessage } from "@/lib/utils/mapDataError";

type Props = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function WalletChargePage({ searchParams }: Props) {
  const { user, profile } = await requireRole("student");

  const supabase = await createClient();
  const data = await loadWalletChargePageData(supabase, user.id);
  const currentBalance = parseWalletBalanceKrw(data.balance.row);
  const sp = (await searchParams) ?? {};
  const actionOk = typeof sp.ok === "string" && sp.ok.length > 0 ? sp.ok : null;
  const actionError = typeof sp.error === "string" && sp.error.length > 0 ? sp.error : null;
  const allowTestTopup = process.env.CASH_TOPUP_ALLOW_TEST_CHARGE === "true";

  const bundle = await loadStudentMypageBundle(
    supabase,
    user.id,
    profile,
    null
  );

  return (
    <StudentDashboardShell
      activeTab="wallet"
      user={user}
      profile={profile}
      profileLoadError={null}
      bundle={bundle}
    >
      <div className="space-y-6">
        <header>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">캐시 충전</h1>
          <p className="mt-1 text-sm text-slate-500">잔액 및 충전 패키지를 확인하고 충전할 수 있습니다.</p>
        </header>

        <WalletChargeBody
          data={data}
          userId={user.id}
          currentBalance={currentBalance}
          actionOk={actionOk}
          actionError={actionError ? mapDataErrorMessage(actionError) : null}
          allowTestTopup={allowTestTopup}
        />
      </div>
    </StudentDashboardShell>
  );
}
