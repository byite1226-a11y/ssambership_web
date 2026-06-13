import "@/app/(public)/custom-request/landing.css";
import { redirect } from "next/navigation";
import { PageScaffold } from "@/components/shell/PageScaffold";
import { CustomRequestDetailShell } from "@/components/customRequest/customRequestDetailLayout";
import { ApplicationsCompareView } from "@/components/customRequest/ApplicationsCompareView";
import { requireRole } from "@/lib/auth/routeGuard";
import { createClient } from "@/lib/supabase/server";
import {
  enrichApplicationRows,
  isAuthorOfPost,
  getOrderIdForPostAndStudent,
  loadApplicationAttachments,
  loadApplicationsForPost,
  loadCustomPostById,
} from "@/lib/customRequest/customRequestQueries";
import { isDraftCustomRequestPost } from "@/lib/customRequest/customRequestPostMappers";
import { batchSignApplicationAttachmentImageThumbUrls } from "@/lib/customRequest/applicationAttachmentAccess";

type Row = Record<string, unknown>;

type PageProps = {
  params: Promise<{ postId: string }>;
  searchParams?: Promise<{ error?: string }>;
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function CustomRequestApplicationsPage(props: PageProps) {
  const { postId } = await props.params;
  const sp = (await props.searchParams) ?? {};
  const hasErrQ = sp.error != null && String(sp.error).length > 0;

  const { user } = await requireRole("student");
  const supabase = await createClient();
  const post = await loadCustomPostById(supabase, postId);
  const authz = isAuthorOfPost(user.id, post.row);
  if (authz.ok && isDraftCustomRequestPost(post.row)) {
    redirect(`/custom-request/new?draftId=${encodeURIComponent(postId)}`);
  }
  const list = await loadApplicationsForPost(supabase, postId, 40);
  const enriched = await enrichApplicationRows(supabase, (list.rows as Row[]) ?? []);
  const applicationIds = enriched
    .map((e) => e.applicationId)
    .filter((id): id is string => Boolean(id));
  const { byApplicationId: attachmentsByApplicationId } = await loadApplicationAttachments(
    supabase,
    applicationIds
  );
  const allAttachments = Object.values(attachmentsByApplicationId).flat();
  const attachmentThumbUrlByAttachmentId = authz.ok
    ? await batchSignApplicationAttachmentImageThumbUrls(
        supabase,
        { userId: user.id, role: "student" },
        postId,
        allAttachments
      )
    : {};
  const orderId = await getOrderIdForPostAndStudent(supabase, postId, user.id);

  return (
    <PageScaffold
      hideHero
      hideFooterPlaceholderCards
      eyebrow=""
      title=""
      description=""
      ctas={[]}
      sections={[]}
      emptyState=""
      dataPoints={[]}
    >
      <CustomRequestDetailShell>
        {hasErrQ ? (
          <p className="mb-4 rounded-2xl border border-red-200 bg-red-50/90 px-4 py-3 text-sm font-bold text-red-900">
            처리에 문제가 있었어요. 잠시 후 다시 시도해 주세요.
          </p>
        ) : null}
        {!authz.ok ? (
          <p className="rounded-2xl border border-amber-200 bg-amber-50/80 p-4 text-sm font-semibold text-amber-950">
            이 맞춤의뢰는 작성자(의뢰하신 본인)만 비교·선정 화면을 열 수 있어요.
          </p>
        ) : (
          <ApplicationsCompareView
            list={list}
            postId={postId}
            postRow={post.row != null ? (post.row as Row) : null}
            enriched={enriched}
            existingOrderId={orderId}
            attachmentsByApplicationId={attachmentsByApplicationId}
            attachmentThumbUrlByAttachmentId={attachmentThumbUrlByAttachmentId}
          />
        )}
      </CustomRequestDetailShell>
    </PageScaffold>
  );
}
