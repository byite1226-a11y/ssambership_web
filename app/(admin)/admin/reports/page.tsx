import { PageScaffold } from "@/components/shell/PageScaffold";
import { AdminRecordTable } from "@/components/admin/AdminRecordTable";
import { AdminStatusBadge } from "@/components/admin/AdminStatusBadge";
import { AdminDetailPanelSlot } from "@/components/admin/AdminActionPlaceholders";
import { createClient } from "@/lib/supabase/server";
import { loadAdminReportsList } from "@/lib/admin/adminQueries";

export default async function AdminReportsPage() {
  const supabase = await createClient();
  const list = await loadAdminReportsList(supabase, 30);
  const targetHint = list.keyHints.targetType;

  return (
    <PageScaffold
      eyebrow="Admin / Reports"
      title="신고 관리"
      description="reports / abuse_reports 등 읽기 가능한 첫 테이블의 실제 행. 질문방·커뮤니티 소스 쿼리는 변경 없음(관리자 읽기만)."
      ctas={[
        { href: "/admin/reviews", label: "리뷰 관리", tone: "slate" },
        { href: "/admin", label: "대시보드", tone: "blue" },
      ]}
      sections={[
        { title: "대상 유형", body: targetHint ? `컬럼 힌트: ${targetHint}` : "target_type / subject_type / resource_type (스키마 확정)", status: targetHint ? "connected" : "skeleton" },
        { title: "조치", body: "경고/숨김/정지: moderation + audit (다음).", status: "skeleton" },
      ]}
      emptyState="신고 0건이면 안내. 열/RLS가 맞지 않으면 skeleton + 오류."
      dataPoints={["reports", "abuse_reports", "content_reports", "disputes(후보)", "audit_logs"]}
    >
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-extrabold text-slate-800">신고 목록</span>
          <AdminStatusBadge result={list} />
          {targetHint ? (
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-800">대상 유형 열: {targetHint}</span>
          ) : null}
        </div>
        <AdminRecordTable result={list} />
        <div className="grid gap-4 lg:grid-cols-[1fr,280px]">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
            <p className="font-extrabold text-slate-800">증거/원문</p>
            <p className="mt-1">thread_id / post_id / message_id 등 링크는 스키마 확정 후 + 상세 라우트</p>
          </div>
          <AdminDetailPanelSlot />
        </div>
      </div>
    </PageScaffold>
  );
}
