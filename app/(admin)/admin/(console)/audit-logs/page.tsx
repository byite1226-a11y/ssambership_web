import { PageScaffold } from "@/components/shell/PageScaffold";
import { AdminRecordTable } from "@/components/admin/AdminRecordTable";
import { AdminStatusBadge } from "@/components/admin/AdminStatusBadge";
import { AdminFilterSlot } from "@/components/admin/AdminActionPlaceholders";
import { createClient } from "@/lib/supabase/server";
import { loadAdminAuditLogList } from "@/lib/admin/adminQueries";

export default async function AdminAuditLogsPage() {
  const supabase = await createClient();
  const list = await loadAdminAuditLogList(supabase, 40);
  const act = list.keyHints.targetType ?? list.keyHints.status;

  return (
    <PageScaffold
      eyebrow="Admin / Audit Logs"
      title="감사 로그"
      description="audit_logs / audit_events / verification_logs … 읽기 가능한 첫 소스. moderation_logs, notices, disputes 는 스키마에 맞게 후순."
      ctas={[
        { href: "/admin", label: "대시보드", tone: "slate" },
        { href: "/admin/settlements", label: "정산", tone: "blue" },
      ]}
      sections={[
        { title: "필터", body: "도메인·기간: searchParams + 지수(후속).", status: "skeleton" },
        { title: "보존", body: "보관 기간·권한: 정책(후속).", status: "skeleton" },
      ]}
      emptyState="기간·권한에 맞는 로그가 없으면 0건. 테이블 부재면 메시지."
      dataPoints={["audit_logs", "audit_events", "verification_logs", "moderation_logs", "notices", "disputes", "users", "payments", "refunds"]}
    >
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-extrabold text-slate-800">최근 운영 로그</span>
          {act ? (
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-800">action/event 열: {act}</span>
          ) : null}
          <AdminStatusBadge result={list} />
        </div>
        <AdminFilterSlot />
        <p className="text-xs text-slate-500">{list.sourceNote}</p>
        <AdminRecordTable result={list} maxCol={7} />
      </div>
    </PageScaffold>
  );
}
