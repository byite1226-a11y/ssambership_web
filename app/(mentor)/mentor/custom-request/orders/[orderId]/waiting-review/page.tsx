import { redirect } from "next/navigation";
import { PageScaffold } from "@/components/shell/PageScaffold";
import { MentorOrderWaitingReviewView } from "@/components/customRequest/MentorOrderWaitingReviewView";
import { requireRole } from "@/lib/auth/routeGuard";
import { loadOrderBundle } from "@/lib/customRequest/customRequestQueries";
import { canAccessOrder } from "@/lib/customRequest/orderAccess";
import { loadOrderDetailPageData } from "@/lib/customRequest/orderDetailQueries";
import { mapPostRowToPublicDetail } from "@/lib/customRequest/customRequestPostMappers";
import {
  mapDeliverableItem,
  pickOrderAmountLabel,
  pickSubmittedRaw,
  reviewDeadlineIsoFromSubmitted,
} from "@/lib/customRequest/mentorOrderPageMappers";
import { pickOrderStudentId } from "@/lib/customRequest/orderRoomMutations";
import { createClient } from "@/lib/supabase/server";

type Row = Record<string, unknown>;

type PageProps = {
  params: Promise<{ orderId: string }>;
  searchParams?: Promise<{ ok?: string; error?: string }>;
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function MentorOrderWaitingReviewPage(props: PageProps) {
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
  const latest = delRows[0] ?? null;

  const postRow = detail.post.row as Row | null;
  const postDetail = postRow ? mapPostRowToPublicDetail(postRow) : null;
  const studentId = pickOrderStudentId(order);
  let clientName = "의뢰자";
  if (studentId) {
    const { data: u } = await supabase.from("users").select("full_name, nickname").eq("id", studentId).maybeSingle();
    const name = (u?.full_name ?? u?.nickname ?? "").trim();
    if (name) clientName = name;
  }

  const submittedRaw = pickSubmittedRaw(latest);
  const deliverable = latest ? mapDeliverableItem(latest, 0) : null;

  return (
    <PageScaffold
      compactHero
      hideHero
      hideFooterPlaceholderCards
      eyebrow="멘토 · 맞춤의뢰"
      title="납품 대기"
      description=""
      ctas={[
        { href: "/mentor/custom-request/orders", label: "주문 목록", tone: "slate" },
        { href: `/custom-request/orders/${orderId}`, label: "작업방", tone: "slate" },
      ]}
      sections={[]}
      emptyState=""
      dataPoints={[]}
    >
      <div className="mx-auto w-full max-w-6xl px-3 pb-12 sm:px-4 lg:px-0">
        {sp.error ? (
          <p className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-bold text-red-900">{sp.error}</p>
        ) : null}
        {sp.ok ? (
          <p className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-bold text-emerald-950">
            {sp.ok}
          </p>
        ) : null}
        <MentorOrderWaitingReviewView
          orderId={orderId}
          requestTitle={detail.header.requestTitle}
          clientName={clientName}
          deadlineLabel={postDetail?.deadline ?? detail.header.dueLine}
          amountLabel={pickOrderAmountLabel(order, detail.header.priceLine)}
          deliverable={
            deliverable
              ? {
                  id: deliverable.id,
                  fileName: deliverable.fileName,
                  sizeLabel: deliverable.sizeLabel,
                  submittedAtLabel: deliverable.submittedAtLabel,
                  downloadable: deliverable.downloadable,
                }
              : null
          }
          reviewDeadlineIso={reviewDeadlineIsoFromSubmitted(submittedRaw)}
        />
      </div>
    </PageScaffold>
  );
}
