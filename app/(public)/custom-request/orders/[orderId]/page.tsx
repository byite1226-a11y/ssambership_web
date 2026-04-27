import { redirect } from "next/navigation";
import { PageScaffold } from "@/components/shell/PageScaffold";
import { OrderRoomView } from "@/components/customRequest/OrderRoomView";
import { getServerUserWithProfile } from "@/lib/auth/getServerUserWithProfile";
import { getPostLoginPath } from "@/lib/auth/getPostLoginPath";
import { createClient } from "@/lib/supabase/server";
import { loadOrderBundle } from "@/lib/customRequest/customRequestQueries";
import { loadOrderDetailPageData } from "@/lib/customRequest/orderDetailQueries";
import { canAccessOrder } from "@/lib/customRequest/orderAccess";
import { CUSTOM_REQUEST_DATA_MODEL } from "@/lib/customRequest/customRequestDataModel";
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
  const { user, profile, error: pe } = await getServerUserWithProfile();
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
  const detail = canEnrich ? await loadOrderDetailPageData(supabase, orderId, bundle) : null;
  const view: "student" | "mentor" = role === "mentor" ? "mentor" : "student";

  const accessSectionBody = access.ok
    ? `매칭: ${access.detail}`
    : bundle.order.row
      ? `접근 거절. ${pe?.message ?? "Supabase/프로필"}`
      : (bundle.order.error ?? pe?.message ?? "주문/권한");

  return (
    <PageScaffold
      eyebrow="Custom request / Order"
      title="주문방 / 납품"
      description={`orderId: ${orderId} · custom_request_orders, deliverables, disputes, post/application(조건부) · ${role}`}
      ctas={[
        { href: "/custom-request", label: "맞춤의뢰", tone: "slate" },
        { href: role === "mentor" ? "/mentor/dashboard" : "/home", label: "대시/홈", tone: "blue" },
      ]}
      sections={[
        { title: "접근", body: accessSectionBody, status: access.ok ? "connected" : "skeleton" },
        { title: "캐시/결제", body: "본 턴에서 비변경(연계만 표기).", status: "skeleton" },
      ]}
      emptyState="주문/납품 데이터 없음."
      dataPoints={[...CUSTOM_REQUEST_DATA_MODEL]}
    >
      {sp.error ? (
        <p className="mb-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-bold text-red-900" role="alert">
          {sp.error}
        </p>
      ) : null}
      {sp.ok ? (
        <p className="mb-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-bold text-emerald-950" role="status">
          {sp.ok}
        </p>
      ) : null}
      <OrderRoomView
        bundle={bundle}
        detail={detail}
        orderId={orderId}
        view={view}
        actorRole={role}
        accessDenied={accessDenied}
        accessDetail={access.detail}
      />
    </PageScaffold>
  );
}
