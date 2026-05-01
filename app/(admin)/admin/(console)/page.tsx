import { PageScaffold } from "@/components/shell/PageScaffold";
import { AdminQueueGrid } from "@/components/admin/AdminQueueGrid";
import { createClient } from "@/lib/supabase/server";
import { ADMIN_DASHBOARD_DATA_MODEL, loadAdminDashboardMetrics } from "@/lib/admin/adminQueries";

export default async function AdminDashboardPage() {
  const supabase = await createClient();
  const { queueCards, scaffolds, globalError } = await loadAdminDashboardMetrics(supabase);

  return (
    <PageScaffold
      eyebrow="Admin / Dashboard"
      title="관리자 대시보드"
      description="승인/신고/환불/리뷰/정산/감사 로그 큐는 Supabase에서 읽기 가능한 테이블·상태 컬럼에 맞춰 집계합니다(더미 없음). 질문방·캐시·마이페이지 쿼리는 변경 없음."
      ctas={[
        { href: "/admin/mentor-approvals", label: "멘토 승인", tone: "blue" },
        { href: "/admin/reports", label: "신고", tone: "slate" },
        { href: "/admin/disputes", label: "분쟁", tone: "blue" },
        { href: "/admin/refunds", label: "환불", tone: "slate" },
        { href: "/admin/reviews", label: "리뷰", tone: "slate" },
        { href: "/admin/settlements", label: "정산", tone: "slate" },
        { href: "/admin/audit-logs", label: "감사 로그", tone: "slate" },
        { href: "/admin/notices", label: "공지/프로모", tone: "green" },
      ]}
      sections={[
        ...scaffolds,
        { title: "운영 KPI", body: "가입/활성/과금: 별도 집계 뷰·대시보드(후속).", status: "skeleton" },
        { title: "긴급 이슈", body: "다발/SLA: 알림·채널 연동(후속).", status: "skeleton" },
      ]}
      emptyState="해당 큐·테이블에 0건이면 카드에 empty로 표시됩니다."
      loadingState="RSC가 서버에서 metrics를 resolve합니다. 이후 SWR/스트림은 별도."
      errorState={globalError ? `RLS/권한: ${globalError}` : "조회 실패 시 RLS/로그/재시도 안내."}
      dataPoints={[...ADMIN_DASHBOARD_DATA_MODEL]}
    >
      <AdminQueueGrid cards={queueCards} />
    </PageScaffold>
  );
}
