import { redirect } from "next/navigation";
import { WalletChargePageView } from "@/components/cash/WalletChargePageView";
import { getServerUserWithProfile } from "@/lib/auth/getServerUserWithProfile";
import { requireWalletChargeAccess } from "@/lib/auth/routeGuard";
import { parseWalletBalanceBreakdown } from "@/lib/cash/parseWalletBalanceKrw";
import { loadWalletChargePageData } from "@/lib/cash/walletRouteData";
import { createClient } from "@/lib/supabase/server";

type Props = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

/**
 * 학생 캐시결제(`/cash`) — 정식 충전 UI(`/wallet/charge`와 동일).
 * 비로그인·게스트는 로그인 후 충전 화면으로 이동.
 */
export default async function StudentCashPage({ searchParams }: Props) {
  const { user, profile } = await getServerUserWithProfile();
  if (profile?.role === "mentor") {
    redirect("/mentor/mypage");
  }
  if (!user || profile?.role !== "student") {
    redirect(`/login/student?next=${encodeURIComponent("/cash")}`);
  }

  const { user: authUser, profile: authProfile } = await requireWalletChargeAccess();
  const supabase = await createClient();
  const data = await loadWalletChargePageData(supabase, authUser.id);
  const breakdown = parseWalletBalanceBreakdown(data.balance.row);
  const sp = (await searchParams) ?? {};
  const actionError = typeof sp.error === "string" && sp.error.length > 0 ? sp.error : null;

  return (
    <WalletChargePageView
      user={authUser}
      profile={authProfile}
      data={data}
      breakdown={breakdown}
      actionError={actionError}
    />
  );
}
