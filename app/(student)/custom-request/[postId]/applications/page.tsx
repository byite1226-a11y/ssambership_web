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
import { CUSTOM_REQUEST_DATA_MODEL } from "@/lib/customRequest/customRequestDataModel";

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

  return (
    <PageScaffold
      eyebrow="Student / Custom request / Applications"
      title="지원서 비교"
      description={`postId: ${postId} — 1인 선정 시 custom_request_orders + /custom-request/orders/[id].`}
      ctas={[
        { href: "/custom-request", label: "맞춤의뢰", tone: "slate" },
        { href: `/custom-request/${postId}`, label: "의뢰 공개 상세", tone: "slate" },
        { href: "/home", label: "홈", tone: "slate" },
      ]}
      sections={[
        { title: "권한", body: authz.ok ? "의뢰자 일치" : "불일치 — " + authz.detail, status: authz.ok ? "connected" : "skeleton" },
        { title: "지원", body: list.table ? `${list.table} · ${list.rows.length}건` : "—", status: list.table ? "connected" : "skeleton" },
        {
          title: "기존 주문",
          body: existing.orderId
            ? `orderId: ${existing.orderId}`
            : (existing.error ?? existing.probe) || "없음",
          status: existing.orderId ? "connected" : "skeleton",
        },
      ]}
      emptyState="지원 0건."
      errorState={err ?? (list.error ?? "—")}
      dataPoints={[...CUSTOM_REQUEST_DATA_MODEL]}
    >
      {err ? (
        <p className="mb-4 rounded-2xl border border-red-200 bg-red-50/90 px-4 py-3 text-sm font-extrabold text-red-900">선정/주문: {err}</p>
      ) : null}
      {!authz.ok ? (
        <p className="rounded-2xl border border-amber-200 bg-amber-50/80 p-4 text-sm font-semibold text-amber-950">
          이 의뢰에 대한 지원서 비교는 의뢰자만 볼 수 있습니다. ({authz.detail}
          {post.error ? ` · ${post.error}` : ""})
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
