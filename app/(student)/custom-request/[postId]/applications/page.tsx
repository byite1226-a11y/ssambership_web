import { PageScaffold } from "@/components/shell/PageScaffold";
import { ApplicationsCompareView } from "@/components/customRequest/ApplicationsCompareView";
import { requireRole } from "@/lib/auth/routeGuard";
import { createClient } from "@/lib/supabase/server";
import {
  enrichApplicationRows,
  isAuthorOfPost,
  findOrderForPostAndStudent,
  loadApplicationsForPost,
  loadCustomPostById,
} from "@/lib/customRequest/customRequestQueries";
import { mapDataErrorMessage } from "@/lib/utils/mapDataError";
import { shortOrderIdForDisplay } from "@/lib/utils/formatOrderIdForDisplay";

type Row = Record<string, unknown>;

type PageProps = {
  params: Promise<{ postId: string }>;
  searchParams?: Promise<{ error?: string }>;
};

export default async function CustomRequestApplicationsPage(props: PageProps) {
  const { postId } = await props.params;
  const sp = (await props.searchParams) ?? {};
  const err = typeof sp.error === "string" && sp.error ? sp.error : null;

  const { user } = await requireRole("student");
  const supabase = await createClient();
  const post = await loadCustomPostById(supabase, postId);
  const authz = isAuthorOfPost(user.id, post.row);
  const list = await loadApplicationsForPost(supabase, postId, 40);
  const enriched = await enrichApplicationRows(supabase, (list.rows as Row[]) ?? []);
  const existing = await findOrderForPostAndStudent(supabase, postId, user.id);

  const listErr = list.error ? mapDataErrorMessage(String(list.error)) : null;
  const existingNote = existing.orderId
    ? `이미 연결된 주문이 있습니다(주문번호 ${shortOrderIdForDisplay(String(existing.orderId))}).`
    : existing.error || existing.probe
      ? mapDataErrorMessage(String(existing.error ?? existing.probe ?? ""))
      : "아직 이 의뢰로 생성된 주문이 없습니다.";

  const titleDescription = authz.ok
    ? `의뢰 ${shortOrderIdForDisplay(postId)} — 지원 ${list.rows.length}건을 비교하고, 한 명을 선택하면 주문방으로 이어집니다.`
    : `의뢰 ${shortOrderIdForDisplay(postId)} — 이 화면에서는 지원한 멘토를 비교할 수 있습니다.`;

  return (
    <PageScaffold
      eyebrow="지원서"
      title="지원서 비교"
      description={titleDescription}
      ctas={[
        { href: "/custom-request", label: "맞춤의뢰", tone: "slate" },
        { href: `/custom-request/${postId}`, label: "의뢰 공개 상세", tone: "slate" },
        { href: "/home", label: "홈", tone: "slate" },
      ]}
      sections={[]}
    >
      {err ? (
        <p className="mb-4 rounded-2xl border border-red-200 bg-red-50/90 px-4 py-3 text-sm font-extrabold text-red-900">선정/주문: {mapDataErrorMessage(err)}</p>
      ) : null}
      {authz.ok && listErr ? <p className="mb-3 text-sm text-amber-800">지원 목록: {listErr}</p> : null}
      {authz.ok ? <p className="mb-4 text-sm text-slate-600">{existingNote}</p> : null}
      {!authz.ok ? (
        <p className="rounded-2xl border border-amber-200 bg-amber-50/80 p-4 text-sm font-semibold text-amber-950">
          이 의뢰를 등록한 학생만 지원서를 비교할 수 있습니다.
          {post.error ? <span className="mt-2 block text-amber-900/90">의뢰 정보: {mapDataErrorMessage(String(post.error))}</span> : null}
        </p>
      ) : (
        <ApplicationsCompareView
          list={list}
          postId={postId}
          enriched={enriched}
          existingOrderId={existing.orderId}
        />
      )}
    </PageScaffold>
  );
}
