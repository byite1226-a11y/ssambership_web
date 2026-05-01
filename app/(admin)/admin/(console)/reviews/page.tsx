import { PageScaffold } from "@/components/shell/PageScaffold";
import { AdminRecordTable } from "@/components/admin/AdminRecordTable";
import { AdminStatusBadge } from "@/components/admin/AdminStatusBadge";
import { AdminDetailPanelSlot, AdminModerationPlaceholders } from "@/components/admin/AdminActionPlaceholders";
import { createClient } from "@/lib/supabase/server";
import { loadAdminReviewsList } from "@/lib/admin/adminQueries";

export default async function AdminReviewsPage() {
  const supabase = await createClient();
  const list = await loadAdminReviewsList(supabase, 30);
  return (
    <PageScaffold
      eyebrow="관리자 / 리뷰"
      title="리뷰 관리"
      description="멘토 리뷰와 사용자 평가를 확인하고 관리합니다."
      ctas={[
        { href: "/admin/reports", label: "신고 관리", tone: "slate" },
        { href: "/admin", label: "대시보드", tone: "blue" },
      ]}
      sections={[
        { title: "노출 관리", body: "문제가 있는 리뷰는 검토 후 숨김 처리할 수 있습니다.", status: "skeleton" },
        { title: "알림", body: "조치 결과 안내는 추후 연결됩니다.", status: "skeleton" },
      ]}
      emptyState="표시할 리뷰가 없습니다."
      dataPoints={["리뷰 내용", "노출 상태", "멘토 정보", "처리 이력"]}
    >
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-extrabold text-slate-800">리뷰 목록</span>
          <AdminStatusBadge result={list} />
        </div>
        <AdminRecordTable result={list} />
        <div className="grid gap-4 lg:grid-cols-[1fr,280px]">
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-sm font-extrabold text-slate-800">숨김 · 블라인드</p>
            <div className="mt-2">
              <AdminModerationPlaceholders />
            </div>
          </div>
          <AdminDetailPanelSlot />
        </div>
      </div>
    </PageScaffold>
  );
}
