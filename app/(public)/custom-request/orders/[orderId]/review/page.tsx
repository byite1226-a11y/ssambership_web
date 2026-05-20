import { redirect } from "next/navigation";
import { PageScaffold } from "@/components/shell/PageScaffold";
import { CustomRequestOrderReviewPanel } from "@/components/customRequest/CustomRequestOrderReviewPanel";
import { getServerUserWithProfile } from "@/lib/auth/getServerUserWithProfile";
import { createClient } from "@/lib/supabase/server";
import { loadOrderBundle } from "@/lib/customRequest/customRequestQueries";
import { loadOrderDetailPageData } from "@/lib/customRequest/orderDetailQueries";
import { canAccessOrder } from "@/lib/customRequest/orderAccess";

type Props = { params: Promise<{ orderId: string }> };

export default async function CustomRequestOrderReviewPage(props: Props) {
  const { orderId } = await props.params;
  const { user, profile } = await getServerUserWithProfile();
  if (!user) redirect(`/login?next=${encodeURIComponent(`/custom-request/orders/${orderId}/review`)}`);
  if (profile?.role !== "student" && profile?.role !== "admin") {
    redirect(`/custom-request/orders/${orderId}`);
  }

  const supabase = await createClient();
  const bundle = await loadOrderBundle(supabase, orderId);
  const access = canAccessOrder(bundle.order.row, user.id, profile?.role ?? "student");
  if (!bundle.order.row || !access.ok) {
    redirect(`/custom-request/orders/${orderId}?error=${encodeURIComponent("\uC811\uADFC \uAD8C\uD55C\uC774 \uC5C6\uC2B5\uB2C8\uB2E4.")}`);
  }

  const detail = await loadOrderDetailPageData(supabase, orderId, bundle);
  if (!detail) redirect(`/custom-request/orders/${orderId}`);

  return (
    <PageScaffold
      compactHero
      hideHero
      hideFooterPlaceholderCards
      eyebrow={"\uB9DE\uCDA4\uC758\uB8B0"}
      title={"\uB0A9\uD488 \uD655\uC778"}
      description=""
      ctas={[]}
      sections={[]}
      dataPoints={[]}
      emptyState=""
    >
      <CustomRequestOrderReviewPanel orderId={orderId} detail={detail} />
    </PageScaffold>
  );
}
