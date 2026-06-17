import { redirect } from "next/navigation";
import { PageScaffold } from "@/components/shell/PageScaffold";
import { OrderRoomView } from "@/components/customRequest/OrderRoomView";
import { getServerUserWithProfile } from "@/lib/auth/getServerUserWithProfile";
import { getPostLoginPath } from "@/lib/auth/getPostLoginPath";
import { createClient } from "@/lib/supabase/server";
import { loadOrderBundle } from "@/lib/customRequest/customRequestQueries";
import {
  hideStudentPreCompletionDeliverableStoragePaths,
  loadOrderDetailPageData,
} from "@/lib/customRequest/orderDetailQueries";
import { canAccessOrder } from "@/lib/customRequest/orderAccess";
import { mapDataErrorMessage } from "@/lib/utils/mapDataError";
import { getMentorStartDisabledByMissingOrderDdl } from "@/lib/customRequest/orderSchemaGate";
import { fetchMentorStudentDisplayName } from "@/lib/customRequest/mentorDashboardOrderEnrichment";
import { pickOrderStudentId } from "@/lib/customRequest/orderRoomMutations";
import type { AppRole } from "@/lib/types/user";

type PageProps = {
  params: Promise<{ orderId: string }>;
  searchParams?: Promise<{ error?: string; ok?: string }>;
};

/**
 * 동일 URL에서 학생/멘토·접근 가능 — (public)에 둠.
 * 상세(멘토/의뢰)는 RLS+canAccess 통과 시에만 enrich.
 */
export default async function CustomRequestOrderPage(props: PageProps) {
  const { orderId } = await props.params;
  const sp = (await props.searchParams) ?? {};
  const { user, profile } = await getServerUserWithProfile();
  if (!user) {
    redirect(`/login?next=${encodeURIComponent(`/custom-request/orders/${orderId}`)}`);
  }
  const role: AppRole = (profile?.role as AppRole) ?? "student";
  if (role !== "student" && role !== "mentor" && role !== "admin") {
    redirect(getPostLoginPath(role));
  }

  const supabase = await createClient();
  const bundle = await loadOrderBundle(supabase, orderId);
  const access = canAccessOrder(bundle.order.row, user.id, role);
  const accessDenied = !!bundle.order.row && !access.ok;
  const canEnrich = !!bundle.order.row && access.ok;
  const loadedDetail = canEnrich ? await loadOrderDetailPageData(supabase, orderId, bundle) : null;
  const view: "student" | "mentor" = role === "mentor" ? "mentor" : "student";
  const isMentor = role === "mentor";
  const detail =
    loadedDetail && role === "student"
      ? hideStudentPreCompletionDeliverableStoragePaths(loadedDetail)
      : loadedDetail;
  const roomBundle = detail?.bundle ?? bundle;
  const mentorStartDdlDisabledReason = getMentorStartDisabledByMissingOrderDdl();

  let mentorStudentDisplayName: string | undefined;
  if (isMentor && canEnrich && bundle.order.row) {
    const studentId = pickOrderStudentId(bundle.order.row as Record<string, unknown>);
    mentorStudentDisplayName = await fetchMentorStudentDisplayName(supabase, studentId);
  }

  const alerts = (
    <>
      {sp.error ? (
        <p className="mb-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-bold text-red-900" role="alert">
          {mapDataErrorMessage(sp.error)}
        </p>
      ) : null}
      {sp.ok ? (
        <p className="mb-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-bold text-emerald-950" role="status">
          {sp.ok}
        </p>
      ) : null}
    </>
  );

  const room = (
    <div className="w-full min-w-0">
      <OrderRoomView
        bundle={roomBundle}
        detail={detail}
        orderId={orderId}
        view={view}
        actorRole={role}
        accessDenied={accessDenied}
        mentorOrderHubHref={isMentor ? "/mentor/custom-request/orders" : undefined}
        mentorStartDdlDisabledReason={mentorStartDdlDisabledReason}
        mentorStudentDisplayName={mentorStudentDisplayName}
      />
    </div>
  );

  return (
    <PageScaffold
      compactHero
      hideHero={true}
      eyebrow={isMentor ? "멘토 · 맞춤의뢰" : "주문방"}
      title={isMentor ? "주문·작업방" : "주문·납품"}
      description={
        isMentor
          ? "의뢰 요약, 진행 단계, 작업 메시지, 납품·수정 요청을 한 화면에서 다룹니다. 주문 식별은 하단 참고 값을 이용해 주세요."
          : "진행·납품·메시지를 한곳에서 확인합니다. 주문번호는 하단을 참고해 주세요."
      }
      ctas={
        isMentor
          ? [{ href: "/mentor/custom-request/orders", label: "맞춤의뢰 주문 목록", tone: "slate" }]
          : [
              { href: "/custom-request", label: "맞춤의뢰", tone: "slate" },
              { href: "/custom-request/orders", label: "내 주문 내역", tone: "blue" },
            ]
      }
      sections={[]}
      hideFooterPlaceholderCards
    >
      <div className="mx-auto w-full max-w-7xl px-3 sm:px-4 lg:px-0">
        {alerts}
        {room}
      </div>
    </PageScaffold>
  );
}
