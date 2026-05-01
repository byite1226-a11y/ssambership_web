import { PageScaffold } from "@/components/shell/PageScaffold";
import { AdminQueueGrid } from "@/components/admin/AdminQueueGrid";
import { createClient } from "@/lib/supabase/server";
import { ADMIN_DASHBOARD_DATA_MODEL, loadAdminDashboardMetrics } from "@/lib/admin/adminQueries";

export default async function AdminDashboardPage() {
  const supabase = await createClient();
  const { queueCards, scaffolds, globalError } = await loadAdminDashboardMetrics(supabase);

  return (
    <PageScaffold
      eyebrow="관리자 / 대시보드"
      title="관리자 대시보드"
      description="멘토 승인, 신고, 분쟁, 환불, 리뷰, 정산, 감사 로그 현황을 한눈에 확인할 수 있습니다. 세부 화면은 왼쪽(또는 상단) 관리자 메뉴에서 이동할 수 있습니다."
      ctas={[]}
      sections={[
        ...scaffolds,
        { title: "운영 지표", body: "가입·활성·과금 등 집계는 추후 대시보드에 연결됩니다.", status: "skeleton" },
        { title: "긴급 알림", body: "다발 이슈·알림 채널은 추후 연결됩니다.", status: "skeleton" },
      ]}
      emptyState="건수가 없으면 카드에 ‘—’로 표시됩니다."
      loadingState="목록을 불러오는 중입니다."
      errorState={
        globalError
          ? "목록 일부를 불러오지 못했습니다. 잠시 후 다시 시도하거나 권한을 확인해 주세요."
          : "일시적으로 목록을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요."
      }
      dataPoints={[...ADMIN_DASHBOARD_DATA_MODEL]}
    >
      <AdminQueueGrid cards={queueCards} />
    </PageScaffold>
  );
}
