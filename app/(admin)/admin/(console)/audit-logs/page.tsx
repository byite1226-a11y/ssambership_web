import { PageScaffold } from "@/components/shell/PageScaffold";
import { AdminRecordTable } from "@/components/admin/AdminRecordTable";
import { AdminStatusBadge } from "@/components/admin/AdminStatusBadge";
import { AdminFilterSlot } from "@/components/admin/AdminActionPlaceholders";
import { createClient } from "@/lib/supabase/server";
import { loadAdminAuditLogList } from "@/lib/admin/adminQueries";

export default async function AdminAuditLogsPage() {
  const supabase = await createClient();
  const list = await loadAdminAuditLogList(supabase, 40);
  return (
    <PageScaffold
      eyebrow="관리자 / 감사 로그"
      title="감사 로그"
      description="관리자 작업과 주요 운영 이벤트를 확인할 수 있습니다."
      ctas={[
        { href: "/admin", label: "대시보드", tone: "slate" },
        { href: "/admin/settlements", label: "정산", tone: "blue" },
      ]}
      sections={[
        { title: "검색·기간", body: "검색어와 기간 필터는 추후 연결됩니다.", status: "skeleton" },
        { title: "보관", body: "로그 보관 기간은 정책에 따라 관리됩니다.", status: "skeleton" },
      ]}
      emptyState="표시할 운영 로그가 없습니다."
      dataPoints={["관리자 작업", "주요 이벤트", "변경 이력", "보안·감사 기록"]}
    >
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-extrabold text-slate-800">최근 운영 로그</span>
          <AdminStatusBadge result={list} />
        </div>
        <AdminFilterSlot />
        <AdminRecordTable result={list} maxCol={7} />
      </div>
    </PageScaffold>
  );
}
