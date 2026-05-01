import { PageScaffold } from "@/components/shell/PageScaffold";
import { AdminRecordTable } from "@/components/admin/AdminRecordTable";
import { AdminStatusBadge } from "@/components/admin/AdminStatusBadge";
import { AdminDetailPanelSlot } from "@/components/admin/AdminActionPlaceholders";
import { createClient } from "@/lib/supabase/server";
import { loadAdminReportsList } from "@/lib/admin/adminQueries";

export default async function AdminReportsPage() {
  const supabase = await createClient();
  const list = await loadAdminReportsList(supabase, 30);
  return (
    <PageScaffold
      eyebrow="관리자 / 신고"
      title="신고 관리"
      description="사용자가 접수한 신고를 확인하고 조치할 수 있습니다."
      ctas={[
        { href: "/admin/reviews", label: "리뷰 관리", tone: "slate" },
        { href: "/admin", label: "대시보드", tone: "blue" },
      ]}
      sections={[
        { title: "신고 유형", body: "접수된 신고의 유형과 상태를 확인합니다.", status: "connected" },
        { title: "조치", body: "검토 후 필요한 운영 조치를 진행합니다.", status: "skeleton" },
      ]}
      emptyState="접수된 신고가 없습니다."
      dataPoints={["접수 내용", "대상 유형", "처리 상태", "처리 이력"]}
    >
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-extrabold text-slate-800">신고 목록</span>
          <AdminStatusBadge result={list} />
        </div>
        <AdminRecordTable result={list} errorDisplayContext="reports" />
        <div className="grid gap-4 lg:grid-cols-[1fr,280px]">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
            <p className="font-extrabold text-slate-800">원문·증빙</p>
            <p className="mt-1">게시글·메시지 등 연결 링크는 상세 화면에서 확인할 수 있도록 준비 중입니다.</p>
          </div>
          <AdminDetailPanelSlot />
        </div>
      </div>
    </PageScaffold>
  );
}
