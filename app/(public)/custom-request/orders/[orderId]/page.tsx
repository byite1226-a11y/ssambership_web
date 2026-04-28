import { redirect } from "next/navigation";
import { PageScaffold } from "@/components/shell/PageScaffold";
import { OrderRoomView } from "@/components/customRequest/OrderRoomView";
import { getServerUserWithProfile } from "@/lib/auth/getServerUserWithProfile";
import { getPostLoginPath } from "@/lib/auth/getPostLoginPath";
import { createClient } from "@/lib/supabase/server";
import { loadOrderBundle } from "@/lib/customRequest/customRequestQueries";
import { loadOrderDetailPageData } from "@/lib/customRequest/orderDetailQueries";
import { canAccessOrder } from "@/lib/customRequest/orderAccess";
import { mapDataErrorMessage } from "@/lib/utils/mapDataError";
import { shortOrderIdForDisplay } from "@/lib/utils/formatOrderIdForDisplay";
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
  const detail = canEnrich ? await loadOrderDetailPageData(supabase, orderId, bundle) : null;
  const view: "student" | "mentor" = role === "mentor" ? "mentor" : "student";

  return (
    <PageScaffold
      eyebrow="주문방"
      title="주문·납품"
      description={`주문번호 ${shortOrderIdForDisplay(orderId)} — 진행 상황, 납품, 메시지를 확인합니다.`}
      ctas={[
        { href: "/custom-request", label: "맞춤의뢰", tone: "slate" },
        { href: role === "mentor" ? "/mentor/dashboard" : "/home", label: "대시/홈", tone: "blue" },
      ]}
      sections={[]}
    >
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
      <OrderRoomView
        bundle={bundle}
        detail={detail}
        orderId={orderId}
        view={view}
        actorRole={role}
        accessDenied={accessDenied}
      />
    </PageScaffold>
  );
}
