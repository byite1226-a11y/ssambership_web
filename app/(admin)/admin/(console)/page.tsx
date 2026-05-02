import { PageScaffold } from "@/components/shell/PageScaffold";
import { AdminQueueGrid } from "@/components/admin/AdminQueueGrid";
import { createClient } from "@/lib/supabase/server";
import { loadAdminDashboardMetrics } from "@/lib/admin/adminQueries";

export default async function AdminDashboardPage() {
  const supabase = await createClient();
  const { queueCards, scaffolds, globalError } = await loadAdminDashboardMetrics(supabase);

  return (
    <PageScaffold
      eyebrow="관리자 / 대시보드"
      title="관리자 대시보드"
      description="멘토 승인, 신고, 분쟁, 환불, 리뷰, 정산, 감사 로그, 공지·프로모션 현황을 한눈에 확인합니다. 아래 카드를 누르면 해당 메뉴로 이동합니다. 환불·정산·주문 상태는 이 화면에서 바뀌지 않으며, 각 전용 메뉴에서 확인·처리합니다. 일부 카드는 집계를 불러오지 못하면 숫자 대신 ‘—’로 표시될 수 있습니다."
      ctas={[
        { href: "/admin/mentor-approvals", label: "멘토 승인", tone: "blue" },
        { href: "/admin/reports", label: "신고", tone: "slate" },
        { href: "/admin/disputes", label: "분쟁 관리", tone: "slate" },
        { href: "/admin/refunds", label: "환불 관리", tone: "slate" },
        { href: "/admin/audit-logs", label: "감사 로그", tone: "slate" },
      ]}
      sections={scaffolds}
      loadingState="불러오는 중입니다."
      errorState={globalError ?? ""}
      hideFooterPlaceholderCards
      dataPoints={[
        "각 운영 메뉴는 왼쪽 사이드바 또는 상단 바로가기에서 이동할 수 있습니다. 금전·정산·주문 상태는 각 상세 메뉴에서 확인 후 처리하세요.",
      ]}
    >
      {globalError ? (
        <p
          role="status"
          className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-950"
        >
          {globalError}
        </p>
      ) : null}
      <AdminQueueGrid cards={queueCards} />
    </PageScaffold>
  );
}
