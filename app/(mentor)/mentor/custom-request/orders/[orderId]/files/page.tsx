import { redirect } from "next/navigation";
import { PageScaffold } from "@/components/shell/PageScaffold";
import { MentorOrderFilesView } from "@/components/customRequest/MentorOrderFilesView";
import { requireRole } from "@/lib/auth/routeGuard";
import { mapPostRowToPublicDetail } from "@/lib/customRequest/customRequestPostMappers";
import { loadOrderBundle } from "@/lib/customRequest/customRequestQueries";
import { canAccessOrder } from "@/lib/customRequest/orderAccess";
import { loadOrderDetailPageData } from "@/lib/customRequest/orderDetailQueries";
import { mapDeliverableItem } from "@/lib/customRequest/mentorOrderPageMappers";
import {
  isOrderRowTerminalForActions,
  normalizedPrimaryOrderStatus,
  orderStatusLabelForUi,
} from "@/lib/customRequest/orderLifecycleConstants";
import { createClient } from "@/lib/supabase/server";

type Row = Record<string, unknown>;

type PageProps = {
  params: Promise<{ orderId: string }>;
  searchParams?: Promise<{ ok?: string; error?: string }>;
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function MentorOrderFilesPage(props: PageProps) {
  const { orderId } = await props.params;
  const sp = (await props.searchParams) ?? {};
  const { user } = await requireRole("mentor");
  const supabase = await createClient();

  const bundle = await loadOrderBundle(supabase, orderId);
  const access = canAccessOrder(bundle.order.row, user.id, "mentor");
  if (!bundle.order.row || !access.ok) {
    redirect(`/mentor/custom-request/orders?error=${encodeURIComponent("접근 권한이 없습니다.")}`);
  }

  const detail = await loadOrderDetailPageData(supabase, orderId, bundle);
  const order = bundle.order.row as Row;
  const delRows = (bundle.deliverables.rows as Row[]) ?? [];
  const orderStatus = normalizedPrimaryOrderStatus(order);
  const isUnderReviewState = orderStatus === "delivered";

  const postRow = detail.post.row as Row | null;
  const postDetail = postRow ? mapPostRowToPublicDetail(postRow) : null;

  const files = delRows.map((row, index) => {
    const item = mapDeliverableItem(row, index);
    return {
      id: item.id,
      version: item.version,
      fileName: item.fileName,
      sizeLabel: item.sizeLabel,
      uploadedAtLabel: item.submittedAtLabel,
      downloadable: item.downloadable,
      isLatest: item.isLatest,
      isUnderReview: isUnderReviewState && item.isLatest,
    };
  });

  const canSubmitDelivery = delRows.length >= 1 && !isOrderRowTerminalForActions(order);

  return (
    <PageScaffold
      compactHero
      hideHero
      hideFooterPlaceholderCards
      eyebrow="멘토 · 맞춤의뢰"
      title="작업 파일"
      description=""
      ctas={[
        { href: "/mentor/custom-request/orders", label: "주문 목록", tone: "slate" },
        { href: `/custom-request/orders/${orderId}`, label: "작업방", tone: "slate" },
      ]}
      sections={[]}
      emptyState=""
      dataPoints={[]}
    >
      <div className="mx-auto w-full max-w-4xl px-3 pb-12 sm:px-4 lg:px-0">
        {sp.error ? (
          <p className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-bold text-red-900">{sp.error}</p>
        ) : null}
        {sp.ok ? (
          <p className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-bold text-emerald-950">
            {sp.ok}
          </p>
        ) : null}
        <MentorOrderFilesView
          orderId={orderId}
          statusLabel={orderStatusLabelForUi(orderStatus)}
          deadlineLabel={postDetail?.deadline ?? detail.header.dueLine}
          files={files}
          canSubmitDelivery={canSubmitDelivery}
        />
      </div>
    </PageScaffold>
  );
}
