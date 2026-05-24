import { redirect } from "next/navigation";
import { PageScaffold } from "@/components/shell/PageScaffold";
import { MentorOrderRevisionView } from "@/components/customRequest/MentorOrderRevisionView";
import { requireRole } from "@/lib/auth/routeGuard";
import { mapPostRowToPublicDetail } from "@/lib/customRequest/customRequestPostMappers";
import { loadOrderBundle } from "@/lib/customRequest/customRequestQueries";
import { canAccessOrder } from "@/lib/customRequest/orderAccess";
import { loadOrderDetailPageData } from "@/lib/customRequest/orderDetailQueries";
import {
  computeRevisionUsage,
  mapDeliverableItem,
  pickLatestRevisionRequest,
  pickOrderAmountLabel,
  studentDisplayInitial,
} from "@/lib/customRequest/mentorOrderPageMappers";
import { pickOrderStudentId } from "@/lib/customRequest/orderRoomMutations";
import { formatDeadlineDday } from "@/lib/customRequest/studentPostDisplay";
import { createClient } from "@/lib/supabase/server";

type Row = Record<string, unknown>;

type PageProps = {
  params: Promise<{ orderId: string }>;
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function MentorOrderRevisionPage(props: PageProps) {
  const { orderId } = await props.params;
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
  const revisionRows = (detail.revisions.rows as Row[]) ?? [];
  const messageRows = (detail.messages.rows as Row[]) ?? [];

  const studentId = pickOrderStudentId(order);
  let studentName = "의뢰자";
  if (studentId) {
    const { data: u } = await supabase.from("users").select("full_name, nickname").eq("id", studentId).maybeSingle();
    const name = (u?.full_name ?? u?.nickname ?? "").trim();
    if (name) studentName = name;
  }

  const revision = pickLatestRevisionRequest(revisionRows, messageRows, studentId);
  const revisionUsage = computeRevisionUsage(delRows.length);
  const deliverables = delRows.map((row, index) => {
    const item = mapDeliverableItem(row, index);
    return {
      id: item.id,
      versionLabel: `v${item.version}`,
      fileName: item.fileName,
      submittedAtLabel: item.submittedAtLabel,
      downloadable: item.downloadable,
    };
  });

  const postRow = detail.post.row as Row | null;
  const postDetail = postRow ? mapPostRowToPublicDetail(postRow) : null;
  const deadlineDday = postRow ? formatDeadlineDday(postRow) : { label: "—", urgent: false };

  return (
    <PageScaffold
      compactHero
      hideHero
      hideFooterPlaceholderCards
      eyebrow="멘토 · 맞춤의뢰"
      title="수정 요청"
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
        <MentorOrderRevisionView
          orderId={orderId}
          deadlineDdayLabel={deadlineDday.label}
          student={{ name: studentName, initial: studentDisplayInitial(studentName) }}
          revisionMessage={revision.message}
          requestedAtLabel={revision.requestedAtLabel}
          deliverables={deliverables}
          revisionUsage={revisionUsage}
          summary={{
            requestTitle: detail.header.requestTitle,
            category: postDetail?.category ?? "—",
            amountLabel: pickOrderAmountLabel(order, detail.header.priceLine),
            deadlineLabel: postDetail?.deadline ?? detail.header.dueLine,
          }}
        />
      </div>
    </PageScaffold>
  );
}
