import { PageScaffold } from "@/components/shell/PageScaffold";
import { DisputePartyPageBody } from "@/components/disputes/DisputePartyPageBody";
import { requireRole } from "@/lib/auth/routeGuard";
import { createClient } from "@/lib/supabase/server";
import { canPartyViewDispute, loadDisputeById } from "@/lib/disputes/disputeQueries";
import { DISPUTE_W22_DATA_MODEL } from "@/lib/disputes/disputeDataModel";
import { USER_UI_LOAD_FAILED, USER_UI_NOTHING_TO_SHOW } from "@/lib/constants/userFacingMessages";

type PageProps = { params: Promise<{ id: string }> };

export default async function StudentDisputeDetailPage(props: PageProps) {
  const { id } = await props.params;
  const { user } = await requireRole("student");
  const supabase = await createClient();
  const bundle = await loadDisputeById(supabase, id);
  const row = bundle.dispute.row;
  const access = canPartyViewDispute(user.id, "student", row);

  const loadFailed = Boolean(bundle.dispute.error && !row);
  if (loadFailed && bundle.dispute.error) {
    console.error("[student/support/disputes/detail] load failed", bundle.dispute.error);
  }

  return (
    <PageScaffold
      eyebrow="지원 · 분쟁"
      title="분쟁·환불 상세"
      description="접수하신 분쟁의 진행 상태와 관련 정보를 확인할 수 있습니다."
      ctas={[
        { href: "/support/disputes", label: "분쟁 목록", tone: "blue" },
        { href: "/mypage", label: "마이페이지", tone: "slate" },
        { href: "/home", label: "홈", tone: "slate" },
      ]}
      sections={[
        {
          title: "안내",
          body: row
            ? access.ok
              ? "아래에서 신청 내용과 처리 상태를 확인할 수 있어요."
              : "이 건은 조회할 수 없습니다."
            : loadFailed
              ? USER_UI_LOAD_FAILED
              : USER_UI_NOTHING_TO_SHOW,
          status: row && access.ok ? "connected" : !row || access.ok ? "connected" : "skeleton",
        },
      ]}
      emptyState={USER_UI_NOTHING_TO_SHOW}
      loadingState="불러오는 중입니다."
      errorState={loadFailed ? USER_UI_LOAD_FAILED : "—"}
      dataPoints={[...DISPUTE_W22_DATA_MODEL]}
    >
      {row && !access.ok ? (
        <p className="mb-3 rounded-2xl border border-amber-200 bg-amber-50/80 p-3 text-sm font-bold text-amber-950">
          이 사건에 대한 조회 권한이 없습니다.
        </p>
      ) : null}
      {row && access.ok ? (
        <DisputePartyPageBody bundle={bundle} reasonLabel="신청 사유:" />
      ) : loadFailed ? (
        <p className="text-sm text-amber-900">{USER_UI_LOAD_FAILED}</p>
      ) : (
        <p className="text-sm text-slate-600">요청하신 분쟁 정보를 찾을 수 없습니다.</p>
      )}
    </PageScaffold>
  );
}
