import { PageScaffold } from "@/components/shell/PageScaffold";
import { AdminRecordTable } from "@/components/admin/AdminRecordTable";
import { AdminStatusBadge } from "@/components/admin/AdminStatusBadge";
import { AdminDetailPanelSlot, AdminModerationPlaceholders } from "@/components/admin/AdminActionPlaceholders";
import { createClient } from "@/lib/supabase/server";
import { loadAdminReviewsList } from "@/lib/admin/adminQueries";

export default async function AdminReviewsPage() {
  const supabase = await createClient();
  const list = await loadAdminReviewsList(supabase, 30);
  const modCol = list.keyHints.status;

  return (
    <PageScaffold
      eyebrow="Admin / Reviews"
      title="리뷰 관리"
      description="reviews / mentor_reviews에서 읽은 실제 행. 멘토 프로필·댓글로 확장할 때 comments 조인(후속)."
      ctas={[
        { href: "/admin/reports", label: "신고 관리", tone: "slate" },
        { href: "/admin", label: "대시보드", tone: "blue" },
      ]}
      sections={[
        { title: "노출 제어", body: modCol ? `hidden/moderation 컬럼 힌트: ${modCol}` : "hidden / is_blind / visible (스키마 확정)", status: "skeleton" },
        { title: "알림", body: "조치 결과 → notifications (다음).", status: "skeleton" },
      ]}
      emptyState="검토할 리뷰가 없으면 0건. 커뮤니티/질문방 쿼리는 변경 없음."
      dataPoints={["reviews", "mentor_reviews", "comments(확장)", "mentor_profiles", "notifications", "audit_logs"]}
    >
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-extrabold text-slate-800">리뷰 목록</span>
          <AdminStatusBadge result={list} />
        </div>
        <p className="text-xs text-slate-500">{list.sourceNote}</p>
        <AdminRecordTable result={list} />
        <div className="grid gap-4 lg:grid-cols-[1fr,280px]">
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-sm font-extrabold text-slate-800">숨김 / 블라인드 (자리)</p>
            <p className="text-xs text-slate-500">다음: server action + RLS(관리자만)</p>
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
