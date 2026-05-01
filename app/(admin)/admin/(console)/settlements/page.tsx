import { PageScaffold } from "@/components/shell/PageScaffold";
import { AdminRecordTable } from "@/components/admin/AdminRecordTable";
import { AdminStatusBadge } from "@/components/admin/AdminStatusBadge";
import { AdminDetailPanelSlot } from "@/components/admin/AdminActionPlaceholders";
import { createClient } from "@/lib/supabase/server";
import { loadAdminSettlementsList } from "@/lib/admin/adminQueries";

export default async function AdminSettlementsPage() {
  const supabase = await createClient();
  const { list, byMentorHint } = await loadAdminSettlementsList(supabase, 30);

  return (
    <PageScaffold
      eyebrow="관리자 / 정산"
      title="정산 관리"
      description="멘토 정산 대상과 지급 상태를 확인합니다."
      ctas={[
        { href: "/admin/refunds", label: "환불 관리", tone: "slate" },
        { href: "/admin/audit-logs", label: "감사 로그", tone: "blue" },
      ]}
      sections={[
        { title: "정산 요약", body: "정산 대상과 지급 상태를 확인합니다.", status: "connected" },
        { title: "오류 재처리", body: "지급 실패 건은 별도 검토 후 처리합니다.", status: "skeleton" },
        { title: "멘토별 보기", body: byMentorHint, status: "skeleton" },
      ]}
      emptyState="정산 대상 내역이 없습니다."
      dataPoints={["정산 대상", "지급 상태", "지급 일정", "처리 이력"]}
    >
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-extrabold text-slate-800">지급 예정 및 저장 내역</span>
          <AdminStatusBadge result={list} />
        </div>
        <AdminRecordTable result={list} errorDisplayContext="settlements" />
        <AdminDetailPanelSlot />
      </div>
    </PageScaffold>
  );
}
