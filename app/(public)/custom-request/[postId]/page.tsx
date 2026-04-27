import Link from "next/link";
import { notFound } from "next/navigation";
import { PageScaffold } from "@/components/shell/PageScaffold";
import { CustomRequestPublicPostBody } from "@/components/customRequest/CustomRequestPublicPostBody";
import { getServerUserWithProfile } from "@/lib/auth/getServerUserWithProfile";
import { CUSTOM_REQUEST_DATA_MODEL } from "@/lib/customRequest/customRequestDataModel";
import { loadApplicationsForPost, loadCustomPostForPublicDetail } from "@/lib/customRequest/customRequestQueries";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Props = {
  params: Promise<{ postId: string }>;
  searchParams?: Promise<{ ok?: string; error?: string }>;
};

export default async function CustomRequestPostPublicPage(props: Props) {
  const { postId } = await props.params;
  const sp = (await props.searchParams) ?? {};
  const ok = sp.ok === "1";
  const err = typeof sp.error === "string" && sp.error ? sp.error : null;

  const supabase = await createClient();
  const [{ user, profile }, post] = await Promise.all([getServerUserWithProfile(), loadCustomPostForPublicDetail(supabase, postId)]);

  if (post.error && !post.row) {
    return (
      <PageScaffold
        eyebrow="Custom request"
        title="의뢰를 열 수 없습니다"
        description={post.error}
        ctas={[
          { href: "/custom-request", label: "맞춤의뢰", tone: "slate" },
        ]}
        sections={[]}
        emptyState=""
        dataPoints={[...CUSTOM_REQUEST_DATA_MODEL]}
      >
        <p className="text-sm text-red-800">{post.error}</p>
      </PageScaffold>
    );
  }

  if (!post.row || !post.table) {
    notFound();
  }

  const applications = await loadApplicationsForPost(supabase, postId, 40);

  return (
    <PageScaffold
      eyebrow="Public / Custom request"
      title="맞춤의뢰 상세"
      description="custom_request_posts 조회 + 멘토만 지원 제출. 질문방·로그인·어드민 라우트 미변경."
      ctas={[
        { href: "/custom-request", label: "목록/소개", tone: "slate" },
        { href: "/mentors", label: "멘토 찾기", tone: "slate" },
      ]}
      sections={[
        { title: "post", body: post.table, status: "connected" },
        { title: "applications", body: applications.table ? `${applications.table} · n=${applications.rows.length}` : "—", status: applications.error ? "skeleton" : "connected" },
      ]}
      emptyState="—"
      dataPoints={[...CUSTOM_REQUEST_DATA_MODEL]}
    >
      {ok ? (
        <p className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-bold text-emerald-900">지원이 제출되었습니다(응답 id는 DB 스키마에 따름).</p>
      ) : null}
      {err ? <p className="mb-4 text-sm font-bold text-red-800">제출/오류: {err}</p> : null}
      <CustomRequestPublicPostBody
        postId={postId}
        row={post.row}
        postTable={post.table}
        userId={user?.id ?? null}
        profile={profile}
        applications={applications}
      />
      <p className="mt-8 text-center text-sm text-slate-500">
        <Link href="/custom-request" className="font-bold text-blue-700 underline">
          맞춤의뢰로 돌아가기
        </Link>
      </p>
    </PageScaffold>
  );
}
