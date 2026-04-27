import { PageScaffold } from "@/components/shell/PageScaffold";
import { AdminRecordTable } from "@/components/admin/AdminRecordTable";
import { AdminStatusBadge } from "@/components/admin/AdminStatusBadge";
import { AdminApproveRejectRow, AdminDetailPanelSlot } from "@/components/admin/AdminActionPlaceholders";
import { createClient } from "@/lib/supabase/server";
import { loadMentorApprovalsList } from "@/lib/admin/adminQueries";

export default async function AdminMentorApprovalsPage() {
  const supabase = await createClient();
  const list = await loadMentorApprovalsList(supabase, 30);

  return (
    <PageScaffold
      eyebrow="Admin / Mentor Approvals"
      title="멘토 승인 관리"
      description="mentor_profiles(또는 이에 준하는 테이블)에서 읽은 실제 행. 승인/반려는 RLS+server action 연결 전 단계."
      ctas={[
        { href: "/admin", label: "대시보드", tone: "slate" },
        { href: "/admin/audit-logs", label: "감사 로그", tone: "blue" },
      ]}
      sections={[
        { title: "읽기 소스", body: list.table ? `테이블: ${list.table}` : list.error ?? "—", status: list.table ? "connected" : "skeleton" },
        { title: "감사·알림", body: "승인 결과 → audit_logs / notifications (다음).", status: "skeleton" },
      ]}
      emptyState="pending 필터에 맞는 행이 없으면 최근 행(날짜/ id 정렬)으로 대체 표시하거나 0건 안내."
      dataPoints={["mentor_profiles", "users", "notifications", "audit_logs", "verification_docs(후보)"]}
    >
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-extrabold text-slate-800">승인 대기 / 목록</span>
          <AdminStatusBadge result={list} />
        </div>
        <AdminRecordTable result={list} idLabel="멘토 프로필 id" />
        <div className="grid gap-4 lg:grid-cols-[1fr,280px]">
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-sm font-extrabold text-slate-800">승인 / 반려 (자리)</p>
            <p className="text-xs text-slate-500">{list.sourceNote}</p>
            <AdminApproveRejectRow />
          </div>
          <AdminDetailPanelSlot />
        </div>
      </div>
    </PageScaffold>
  );
}
