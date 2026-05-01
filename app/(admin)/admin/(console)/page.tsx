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
      description="멘토 승인, 신고, 분쟁, 환불, 리뷰, 정산, 감사 로그, 공지·프로모션 현황을 한눈에 확인합니다. 아래 카드를 누르면 해당 메뉴로 이동합니다. 환불·정산·주문 상태는 이 화면에서 바뀌지 않으며, 각 전용 메뉴에서 확인·처리합니다."
      ctas={[
        { href: "/admin/mentor-approvals", label: "멘토 승인", tone: "blue" },
        { href: "/admin/reports", label: "신고", tone: "slate" },
        { href: "/admin/disputes", label: "분쟁", tone: "slate" },
        { href: "/admin/refunds", label: "환불", tone: "slate" },
        { href: "/admin/audit-logs", label: "감사 로그", tone: "slate" },
      ]}
      sections={scaffolds}
      emptyState="일부 카드는 집계를 불러오지 못하면 숫자 대신 ‘—’로 표시될 수 있습니다."
      loadingState="불러오는 중입니다."
      errorState={
        globalError
          ? globalError
          : "일시적으로 목록을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요."
      }
      dataPoints={[
        "각 운영 메뉴는 왼쪽 사이드바 또는 상단 바로가기에서 이동할 수 있습니다. 금전·정산·주문 상태는 각 상세 메뉴에서 확인 후 처리하세요.",
      ]}
    >
      <AdminQueueGrid cards={queueCards} />
    </PageScaffold>
  );
}
