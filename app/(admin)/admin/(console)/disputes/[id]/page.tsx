import { PageScaffold } from "@/components/shell/PageScaffold";
import { DisputeAdminPageBody } from "@/components/disputes/DisputeAdminPageBody";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/routeGuard";
import { loadDisputeActorSummaries, loadDisputeById } from "@/lib/disputes/disputeQueries";
import { DISPUTE_W22_DATA_MODEL } from "@/lib/disputes/disputeDataModel";

type PageProps = { params: Promise<{ id: string }> };

export default async function AdminDisputeDetailPage(props: PageProps) {
  await requireRole("admin");
  const { id } = await props.params;
  const supabase = await createClient();
  const bundle = await loadDisputeById(supabase, id);
  const row = bundle.dispute.row;
  const actors = row
    ? await loadDisputeActorSummaries(supabase, row as Record<string, unknown>)
    : null;
  return (
    <PageScaffold
      eyebrow="Admin / W22 / Dispute"
      title="분쟁·환불(운영) 상세"
      description="W22 운영: 사건·관련 users·refunds/payments/구독/맞춤주문·로그. 승인/알림/첨부는 placeholder."
      ctas={[
        { href: "/admin/disputes", label: "분쟁 목록", tone: "blue" },
        { href: "/admin/refunds", label: "환불 큐", tone: "slate" },
        { href: "/admin/audit-logs", label: "감사 로그", tone: "blue" },
        { href: "/admin", label: "어드민", tone: "slate" },
      ]}
      sections={[
        { title: "조회", body: row ? bundle.probe : (bundle.dispute.error ?? "empty"), status: row ? "connected" : "skeleton" },
        {
          title: "이력",
          body: bundle.modLogs.table ? `${bundle.modLogs.table} ${bundle.modLogs.rows.length}행` : (bundle.modLogs.error ?? "—"),
          status: bundle.modLogs.table ? "connected" : "skeleton",
        },
        { title: "의사결정", body: "버튼 자리(액션 후속).", status: "skeleton" },
        { title: "내부", body: "메모·감사(후속).", status: "skeleton" },
      ]}
      emptyState="분쟁 id 없음."
      loadingState="loading.tsx"
      errorState={row ? "—" : (bundle.dispute.error ?? "RLS/권한")}
      dataPoints={[...DISPUTE_W22_DATA_MODEL]}
    >
      {row ? (
        <DisputeAdminPageBody bundle={bundle} actors={actors} />
      ) : (
        <p className="text-sm text-amber-900">조회 실패/없음: {bundle.dispute.error ?? "id 미일치 — disputes 테이블·RLS를 확인하세요."}</p>
      )}
    </PageScaffold>
  );
}
