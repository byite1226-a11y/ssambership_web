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
      eyebrow="Student / Wallet / Ledger"
      title="캐시 원장"
      description="정식 라인 `(student)/wallet/ledger` — 기간·유형 필터 자리, 타임라인·테이블. 맞춤의뢰와 분리."
      ctas={[
        { href: "/wallet/charge", label: "충전", tone: "blue" },
        { href: "/mentors", label: "멤버십(멘토 선택)", tone: "slate" },
      ]}
      sections={[
        { title: "cash_ledger", body: data.ledger.error ?? `${data.ledger.rows.length} rows`, status: data.ledger.error ? "skeleton" : "connected" },
        { title: "wallets", body: data.balance.error ?? (data.balance.table ?? "ok"), status: data.balance.error ? "skeleton" : "connected" },
        { title: "query", body: `from=${from ?? "—"} to=${to ?? "—"} kind=${kind ?? "—"} (필터 로직 후속)`, status: "skeleton" },
      ]}
      emptyState="원장이 없으면 empty"
      loadingState="/wallet/ledger/loading"
      errorState="ledger 조회 실패 시 상단"
      dataPoints={[...WALLET_LEDGER_DATA_MODEL, ...CASH_DATA_MODEL]}
    >
      <WalletLedgerPageBody data={data} userIdShort={user.id.slice(0, 8)} />
    </PageScaffold>
  );
}
