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
      eyebrow="Admin / Settlements"
      title="정산"
      description="settlements / payouts / mentor_payouts 등 읽기 가능한 첫 테이블. 지급·보류·실패는 컬럼 스키마 확정 후."
      ctas={[
        { href: "/admin/refunds", label: "환불", tone: "slate" },
        { href: "/admin/audit-logs", label: "감사 로그", tone: "blue" },
      ]}
      sections={[
        { title: "정산 요약", body: byMentorHint, status: "connected" },
        { title: "오류 재처리", body: "지급 실패 큐(후속).", status: "skeleton" },
      ]}
      emptyState="배치 전/정산이 0이면 0건 안내. 멘토별 roll-up는 group by(다음)."
      dataPoints={["settlements", "payouts", "mentor_payouts", "payout_items", "payments", "refunds", "audit_logs"]}
    >
      <div className="space-y-4">
        <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 text-sm text-slate-700">
          <p className="font-extrabold text-slate-900">멘토별 정산 리스트(자리)</p>
          <p className="mt-1">{byMentorHint}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-extrabold text-slate-800">지급·정산 원장</span>
          <AdminStatusBadge result={list} />
        </div>
        <p className="text-xs text-slate-500">{list.sourceNote}</p>
        <AdminRecordTable result={list} />
        <AdminDetailPanelSlot />
      </div>
    </PageScaffold>
  );
}
