import { PageScaffold } from "@/components/shell/PageScaffold";
import { WalletChargeBody } from "@/components/cash/WalletChargeBody";
import { requireRole } from "@/lib/auth/routeGuard";
import { createClient } from "@/lib/supabase/server";
import { CASH_DATA_MODEL, loadWalletChargePageData, WALLET_CHARGE_DATA_MODEL } from "@/lib/cash/walletRouteData";
import { mapDataErrorMessage } from "@/lib/utils/mapDataError";
import { USER_UI_LOAD_FAILED, USER_UI_OPS_ISSUE } from "@/lib/constants/userFacingMessages";

type Props = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function WalletChargePage({ searchParams }: Props) {
  const { user } = await requireRole("student");
  const supabase = await createClient();
  const data = await loadWalletChargePageData(supabase, user.id);
  if (data.balance.error) console.error("[wallet/charge] balance", data.balance.error);
  if (data.packages.error) console.error("[wallet/charge] packages", data.packages.error);
  if (data.ledgerPreview.error) console.error("[wallet/charge] ledgerPreview", data.ledgerPreview.error);
  if (data.payments.error) console.error("[wallet/charge] payments", data.payments.error);
  const sp = (await searchParams) ?? {};
  const actionOk = typeof sp.ok === "string" && sp.ok.length > 0 ? sp.ok : null;
  const actionError = typeof sp.error === "string" && sp.error.length > 0 ? sp.error : null;
  const allowTestTopup = process.env.CASH_TOPUP_ALLOW_TEST_CHARGE === "true";

  return (
    <PageScaffold
      eyebrow="캐시"
      title="캐시 충전"
      description="잔액·충전 패키지·최근 사용 내역을 확인하고 충전할 수 있습니다."
      ctas={[
        { href: "/wallet/ledger", label: "사용 내역(원장)", tone: "slate" },
        { href: "/mentors", label: "멤버십(멘토 선택)", tone: "slate" },
      ]}
      sections={[
        {
          title: "잔액",
          body: data.balance.error ? USER_UI_LOAD_FAILED : "잔액 정보를 확인했습니다.",
          status: data.balance.error ? "skeleton" : "connected",
        },
        {
          title: "충전 패키지",
          body: data.packages.error ? USER_UI_LOAD_FAILED : `${data.packages.rows.length}개 패키지`,
          status: data.packages.error ? "skeleton" : "connected",
        },
        {
          title: "최근 사용",
          body: data.ledgerPreview.error ? USER_UI_LOAD_FAILED : `${data.ledgerPreview.rows.length}건 미리보기`,
          status: data.ledgerPreview.error ? "skeleton" : "connected",
        },
        {
          title: "결제",
          body: data.payments.error ? USER_UI_LOAD_FAILED : "최근 결제 정보를 확인했습니다.",
          status: data.payments.error ? "skeleton" : "connected",
        },
      ]}
      emptyState="표시할 내역이 없을 수 있어요. 아래에서 계속 확인할 수 있습니다."
      loadingState="불러오는 중입니다."
      errorState={
        data.balance.error || data.packages.error || data.ledgerPreview.error || data.payments.error
          ? USER_UI_OPS_ISSUE
          : "—"
      }
      dataPoints={[...WALLET_CHARGE_DATA_MODEL, ...CASH_DATA_MODEL]}
    >
      <WalletChargeBody
        data={data}
        userIdShort={user.id.slice(0, 8)}
        actionOk={actionOk}
        actionError={actionError ? mapDataErrorMessage(actionError) : null}
        allowTestTopup={allowTestTopup}
      />
    </PageScaffold>
  );
}
