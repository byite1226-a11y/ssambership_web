import { PageScaffold } from "@/components/shell/PageScaffold";
import { ApplicationsCompareView } from "@/components/customRequest/ApplicationsCompareView";
import { requireRole } from "@/lib/auth/routeGuard";
import { createClient } from "@/lib/supabase/server";
import {
  enrichApplicationRows,
  isAuthorOfPost,
  getOrderIdForPostAndStudent,
  loadApplicationsForPost,
  loadCustomPostById,
} from "@/lib/customRequest/customRequestQueries";

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
  const list = await loadApplicationsForPost(supabase, postId, 40);
  const enriched = await enrichApplicationRows(supabase, (list.rows as Row[]) ?? []);
  const orderId = await getOrderIdForPostAndStudent(supabase, postId, user.id);

  return (
    <PageScaffold
      compactHero
      hideFooterPlaceholderCards
      eyebrow="맞춤의뢰"
      title="지원서 비교"
      description="제출된 제안을 가격·납기·내용으로 비교해요. 한 분을 고르면 이후 주문·진행이 이어질 수 있어요."
      ctas={[
        { href: "/custom-request", label: "맞춤의뢰", tone: "slate" },
        { href: `/custom-request/${postId}`, label: "의뢰 상세", tone: "slate" },
        { href: "/home", label: "홈", tone: "slate" },
      ]}
      sections={[]}
      emptyState=""
      dataPoints={[]}
    >
      <div className="mx-auto w-full max-w-6xl px-3 sm:px-4 lg:px-0">
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
          />
        )}
      </div>
    </PageScaffold>
  );
}
