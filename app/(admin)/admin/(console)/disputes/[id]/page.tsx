import Link from "next/link";
import { PageScaffold } from "@/components/shell/PageScaffold";
import { DisputeAdminPageBody } from "@/components/disputes/DisputeAdminPageBody";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/routeGuard";
import { loadDisputeActorSummaries, loadDisputeById } from "@/lib/disputes/disputeQueries";
import { toAdminDisplayError } from "@/lib/admin/adminDisplayError";
import { loadAdminDisputeEscrowSplitPanelState } from "@/lib/admin/adminDisputeEscrowSplitQueries";
import { CUSTOM_ORDER_PLATFORM_FEE_RATE } from "@/lib/customRequest/orderSettlementAmounts";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminDisputeDetailPage(props: PageProps) {
  await requireRole("admin");
  const { id } = await props.params;
  const sp = (await props.searchParams) ?? {};
  const okRaw = sp.ok;
  const errRaw = sp.error;
  const flashOkRaw = typeof okRaw === "string" ? okRaw : Array.isArray(okRaw) ? okRaw[0] : null;
  const flashErrRaw = typeof errRaw === "string" ? errRaw : Array.isArray(errRaw) ? errRaw[0] : null;
  const flashErr = flashErrRaw ? (toAdminDisplayError(flashErrRaw, "disputes") ?? "처리에 실패했습니다.") : null;
  const flashOk =
    flashOkRaw === "reviewing"
      ? "검토 중으로 변경했습니다."
      : flashOkRaw === "resolved"
        ? "해결 처리했습니다."
        : flashOkRaw === "dismissed"
          ? "종결 처리했습니다."
          : flashOkRaw === "note"
            ? "운영 메모를 저장했습니다."
            : flashOkRaw === "dispute_split"
              ? "예치 분배를 완료했습니다. 분쟁·주문 상태가 갱신되었습니다."
              : null;

  const supabase = await createClient();
  let adminBypass: ReturnType<typeof createServiceRoleClient> | undefined;
  // [보안 주석] service_role로 RLS 우회
  // 이 페이지는 (admin)/layout.tsx + (admin)/(console)/layout.tsx
  // 이중 requireRole("admin") 가드로 보호됨.
  // service_role 사용은 관리자 업무상 의도된 것임.
  try {
    adminBypass = createServiceRoleClient();
  } catch {
    adminBypass = undefined;
  }
  const bundle = await loadDisputeById(supabase, id, { adminBypassClient: adminBypass });
  const row = bundle.dispute.row;
  const actors = row ? await loadDisputeActorSummaries(supabase, row as Record<string, unknown>) : null;

  const escrowReadClient = adminBypass ?? supabase;
  const escrowSplitPanelState = row
    ? await loadAdminDisputeEscrowSplitPanelState(
        escrowReadClient,
        id,
        row as Record<string, unknown>,
        bundle.customOrder.row
      )
    : { kind: "unavailable" as const, message: "분쟁 정보가 없어 예치 분배를 표시할 수 없습니다." };

  const safeLoadError = row ? null : toAdminDisplayError(bundle.dispute.error, "disputes");

  return (
    <PageScaffold
      hideFooterPlaceholderCards
      eyebrow="관리자 / 분쟁"
      title="분쟁 상세"
      description="분쟁 본문·당사자·연결 주문·결제·환불 정보를 확인하고, 예치(에스크로) 분배·상태 조정을 진행합니다."
      ctas={[
        { href: "/admin/disputes", label: "분쟁 관리", tone: "blue" },
        { href: "/admin/refunds", label: "환불 관리", tone: "slate" },
        { href: "/admin", label: "대시보드", tone: "slate" },
      ]}
      sections={[
        { title: "조회", body: row ? "분쟁 행을 불러왔습니다." : "분쟁을 찾지 못했습니다.", status: row ? "connected" : "skeleton" },
        { title: "처리", body: "검토 중·메모·해결·종결은 아래 양식에서 진행합니다.", status: row ? "connected" : "skeleton" },
      ]}
      emptyState=""
      loadingState=""
      errorState=""
      dataPoints={[]}
    >
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2 text-sm">
          <Link className="font-extrabold text-indigo-800 underline" href="/admin/disputes" prefetch={false}>
            ← 분쟁 관리
          </Link>
          <span className="text-slate-300">|</span>
          <Link className="font-extrabold text-slate-700 underline" href="/admin" prefetch={false}>
            대시보드
          </Link>
        </div>
        {flashOk ? (
          <p className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-3 text-sm font-semibold text-emerald-950">{flashOk}</p>
        ) : null}
        {flashErr ? (
          <p className="rounded-2xl border border-red-200 bg-red-50/80 p-3 text-sm font-semibold text-red-950">{flashErr}</p>
        ) : null}
        {row ? (
          <DisputeAdminPageBody
            bundle={bundle}
            actors={actors}
            disputeId={id}
            escrowSplitPanelState={escrowSplitPanelState}
            platformFeeRate={CUSTOM_ORDER_PLATFORM_FEE_RATE}
          />
        ) : (
          <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4 text-sm text-amber-950">
            <p className="font-semibold">분쟁을 불러오지 못했습니다.</p>
            <p className="mt-1 text-xs text-amber-900/90">{safeLoadError ?? "요청한 분쟁이 없거나 접근할 수 없습니다."}</p>
          </div>
        )}
      </div>
    </PageScaffold>
  );
}
