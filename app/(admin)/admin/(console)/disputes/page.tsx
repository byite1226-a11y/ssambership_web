import { PageScaffold } from "@/components/shell/PageScaffold";
import { AdminDisputesListView } from "@/components/disputes/AdminDisputesListView";
import { requireRole } from "@/lib/auth/routeGuard";
import { createClient } from "@/lib/supabase/server";
import { DISPUTE_LIST_DATA_MODEL, DISPUTE_W22_DATA_MODEL } from "@/lib/disputes/disputeDataModel";
import { loadDisputesListForAdmin } from "@/lib/disputes/disputeListQueries";

export default async function AdminDisputesListPage() {
  await requireRole("admin");
  const supabase = await createClient();
  const { table, items, error, probe } = await loadDisputesListForAdmin(supabase, 50);

  return (
    <PageScaffold
      eyebrow="Admin / W22 / Disputes"
      title="분쟁·환불(목록)"
      description="disputes 계열 전체 스캔(관리자 RLS). 행 FK 요약은 상세 `loadDisputeById`·w22EntityLine과 동일 출처(분쟁 row)."
      ctas={[
        { href: "/admin/refunds", label: "환불 큐", tone: "slate" },
        { href: "/admin/audit-logs", label: "감사 로그", tone: "blue" },
        { href: "/admin", label: "대시보드", tone: "slate" },
      ]}
      sections={[
        { title: "테이블", body: table ? `${table} · ${probe}` : (error ?? "—"), status: table ? "connected" : "skeleton" },
        { title: "상세", body: "/admin/disputes/[id] — 기존 운영 상세", status: "connected" },
        { title: "연계", body: "refunds · payments · subscriptions · custom_request_orders · moderation_logs(상세에서)", status: "skeleton" },
      ]}
      emptyState="분쟁 0건 또는 테이블 미탐색."
      loadingState="loading.tsx"
      errorState={error && !items.length ? error : "—"}
      dataPoints={[...DISPUTE_LIST_DATA_MODEL, ...DISPUTE_W22_DATA_MODEL]}
    >
      <AdminDisputesListView items={items} listError={error} table={table} probe={probe} />
    </PageScaffold>
  );
}
