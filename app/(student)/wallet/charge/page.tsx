import { PageScaffold } from "@/components/shell/PageScaffold";
import { WalletChargeBody } from "@/components/cash/WalletChargeBody";
import { requireRole } from "@/lib/auth/routeGuard";
import { createClient } from "@/lib/supabase/server";
import { CASH_DATA_MODEL, loadWalletChargePageData, WALLET_CHARGE_DATA_MODEL } from "@/lib/cash/walletRouteData";

type Props = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function WalletChargePage({ searchParams }: Props) {
  const { user } = await requireRole("student");
  const supabase = await createClient();
  const data = await loadWalletChargePageData(supabase, user.id);
  const sp = (await searchParams) ?? {};
  const actionOk = typeof sp.ok === "string" && sp.ok.length > 0 ? sp.ok : null;
  const actionError = typeof sp.error === "string" && sp.error.length > 0 ? sp.error : null;
  const allowTestTopup = process.env.CASH_TOPUP_ALLOW_TEST_CHARGE === "true";

  return (
    <PageScaffold
      eyebrow="Student / Wallet / Charge"
      title="캐시 충전"
      description="정식 라인 `(student)/wallet/charge` — 잔액·충전 패키지·원장 요약·결제 CTA(자리). 맞춤의뢰와 분리."
      ctas={[
        { href: "/wallet/ledger", label: "사용 내역(원장)", tone: "slate" },
        { href: "/mentors", label: "멤버십(멘토 선택)", tone: "slate" },
      ]}
      sections={[
        { title: "cash_wallets", body: data.balance.error ?? (data.balance.table ?? "ok"), status: data.balance.error ? "skeleton" : "connected" },
        { title: "packages", body: data.packages.error ?? String(data.packages.rows.length), status: data.packages.error ? "skeleton" : "connected" },
        { title: "ledger preview", body: data.ledgerPreview.error ?? String(data.ledgerPreview.rows.length), status: data.ledgerPreview.error ? "skeleton" : "connected" },
        { title: "payments", body: data.payments.probe, status: data.payments.error ? "skeleton" : "connected" },
      ]}
      emptyState="잔액/원장/결제 row가 없으면 empty 배너."
      loadingState="/wallet/charge/loading"
      errorState="RLS/테이블: 배너"
      dataPoints={[...WALLET_CHARGE_DATA_MODEL, ...CASH_DATA_MODEL]}
    >
      <WalletChargeBody
        data={data}
        userIdShort={user.id.slice(0, 8)}
        actionOk={actionOk}
        actionError={actionError}
        allowTestTopup={allowTestTopup}
      />
    </PageScaffold>
  );
}
