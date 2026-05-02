import { PageScaffold } from "@/components/shell/PageScaffold";
import { WalletLedgerPageBody } from "@/components/cash/WalletLedgerPageBody";
import { requireRole } from "@/lib/auth/routeGuard";
import { createClient } from "@/lib/supabase/server";
import { CASH_DATA_MODEL, loadWalletLedgerPageData, WALLET_LEDGER_DATA_MODEL } from "@/lib/cash/walletRouteData";

type Props = { searchParams?: Promise<Record<string, string | string[] | undefined>> };

export default async function WalletLedgerPage(props: Props) {
  const { user } = await requireRole("student");
  const supabase = await createClient();
  const sp = (await props.searchParams) ?? {};
  const from = (Array.isArray(sp.from) ? sp.from[0] : sp.from) ?? null;
  const to = (Array.isArray(sp.to) ? sp.to[0] : sp.to) ?? null;
  const kind = (Array.isArray(sp.kind) ? sp.kind[0] : sp.kind) ?? null;
  const data = await loadWalletLedgerPageData(supabase, user.id, { from: from ?? undefined, to: to ?? undefined, kind: kind ?? undefined });

  return (
    <PageScaffold
      hideFooterPlaceholderCards
      eyebrow="캐시 · 지갑"
      title="캐시 원장"
      description="충전·사용 내역을 시간 순으로 확인합니다. 맞춤의뢰 결제와는 별도예요. 기간·유형 필터는 순차적으로 제공될 예정입니다."
      ctas={[
        { href: "/wallet/charge", label: "충전", tone: "blue" },
        { href: "/mentors", label: "멤버십(멘토 선택)", tone: "slate" },
      ]}
      sections={[
        {
          title: "사용 내역",
          body: data.ledger.error
            ? "내역을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요."
            : `최근 내역 ${data.ledger.rows.length}건을 불러왔습니다.`,
          status: data.ledger.error ? "skeleton" : "connected",
        },
        {
          title: "잔액",
          body: data.balance.error ? "잔액을 불러오지 못했습니다." : "잔액 정보를 확인했습니다.",
          status: data.balance.error ? "skeleton" : "connected",
        },
        {
          title: "필터",
          body: "기간과 유형 필터는 추후 제공 예정입니다.",
          status: "skeleton",
        },
      ]}
      emptyState="표시할 사용 내역이 없을 수 있어요. 충전·이용 후 다시 확인해 주세요."
      loadingState="불러오는 중입니다."
      errorState="일부 정보를 불러오지 못했을 때는 잠시 후 다시 시도해 주세요."
      dataPoints={[...WALLET_LEDGER_DATA_MODEL, ...CASH_DATA_MODEL]}
    >
      <WalletLedgerPageBody data={data} />
    </PageScaffold>
  );
}
