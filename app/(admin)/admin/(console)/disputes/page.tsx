import { PageScaffold } from "@/components/shell/PageScaffold";
import { AdminDisputesListView } from "@/components/disputes/AdminDisputesListView";
import { requireRole } from "@/lib/auth/routeGuard";
import { createClient } from "@/lib/supabase/server";
import { loadDisputesListForAdmin } from "@/lib/disputes/disputeListQueries";

export default async function AdminDisputesListPage() {
  await requireRole("admin");
  const supabase = await createClient();
  const { table, items, error, probe } = await loadDisputesListForAdmin(supabase, 50);

  return (
    <PageScaffold
      eyebrow="관리자 / 분쟁"
      title="분쟁 관리"
      description="진행 중인 분쟁을 확인하고 상세 처리 화면으로 이동할 수 있습니다."
      ctas={[
        { href: "/admin/refunds", label: "환불 관리", tone: "slate" },
        { href: "/admin/audit-logs", label: "감사 로그", tone: "blue" },
        { href: "/admin", label: "대시보드", tone: "slate" },
      ]}
      sections={[
        { title: "분쟁 목록", body: "최근 접수된 분쟁을 확인합니다.", status: table ? "connected" : "skeleton" },
        { title: "상세 처리", body: "분쟁별 상세 화면에서 처리 내역을 확인할 수 있습니다.", status: "connected" },
        { title: "연결 항목", body: "주문, 결제, 환불 상태를 함께 확인합니다.", status: "skeleton" },
      ]}
      emptyState="진행 중인 분쟁이 없습니다."
      loadingState="목록을 불러오는 중입니다."
      errorState={error && !items.length ? error : "목록을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요."}
      dataPoints={["분쟁 접수", "처리 상태", "관련 주문·결제", "처리 이력"]}
    >
      <AdminDisputesListView items={items} listError={error} table={table} probe={probe} />
    </PageScaffold>
  );
}
