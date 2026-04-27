import { PageScaffold } from "@/components/shell/PageScaffold";
import { DisputePartyPageBody } from "@/components/disputes/DisputePartyPageBody";
import { requireRole } from "@/lib/auth/routeGuard";
import { createClient } from "@/lib/supabase/server";
import { canPartyViewDispute, loadDisputeById } from "@/lib/disputes/disputeQueries";
import { DISPUTE_W22_DATA_MODEL } from "@/lib/disputes/disputeDataModel";

type PageProps = { params: Promise<{ id: string }> };

export default async function StudentDisputeDetailPage(props: PageProps) {
  const { id } = await props.params;
  const { user } = await requireRole("student");
  const supabase = await createClient();
  const bundle = await loadDisputeById(supabase, id);
  const row = bundle.dispute.row;
  const access = canPartyViewDispute(user.id, "student", row);
  return (
    <PageScaffold
      eyebrow="Support / Dispute / W22"
      title="분쟁·환불 상세"
      description="W22: 신청 사유·상태·로그·연계 payments/refunds(스키마). QnA·캐시·맞춤·멘토·마이·로그인 라우트 미변경."
      ctas={[
        { href: "/support/disputes", label: "분쟁 목록", tone: "blue" },
        { href: "/mypage", label: "마이페이지", tone: "slate" },
        { href: "/home", label: "홈", tone: "slate" },
      ]}
      sections={[
        {
          title: "권한",
          body: !row ? "row 없음" : access.ok ? `접근: ${access.detail}` : "거부",
          status: !row || access.ok ? "connected" : "skeleton",
        },
        { title: "데이터·probe", body: row ? bundle.probe : (bundle.dispute.error ?? "—"), status: row ? "connected" : "skeleton" },
        { title: "첨부", body: "Storage / evidence(후속).", status: "skeleton" },
        { title: "로그", body: bundle.modLogs.table ? `${bundle.modLogs.table} ${bundle.modLogs.rows.length}행` : "moderation_logs 연계", status: bundle.modLogs.table ? "connected" : "skeleton" },
      ]}
      emptyState="분쟁 id 없음 / 없는 건. disputes(후보명) + RLS"
      loadingState="loading.tsx"
      errorState={bundle.dispute.error && !row ? String(bundle.dispute.error) : "권한·RLS·재시도 안내."}
      dataPoints={[...DISPUTE_W22_DATA_MODEL]}
    >
      {row && !access.ok ? (
        <p className="mb-3 rounded-2xl border border-amber-200 bg-amber-50/80 p-3 text-sm font-bold text-amber-950">이 사건에 대한 조회 권한이 없습니다. ({access.detail})</p>
      ) : null}
      {row && access.ok ? <DisputePartyPageBody bundle={bundle} reasonLabel="신청 사유:" /> : !row && bundle.dispute.error ? (
        <p className="text-sm text-amber-900">Supabase: {bundle.dispute.error}</p>
      ) : !row && !bundle.dispute.error ? (
        <p className="text-sm text-slate-600">id `{id}`에 대한 분쟁이 없습니다.</p>
      ) : null}
    </PageScaffold>
  );
}
