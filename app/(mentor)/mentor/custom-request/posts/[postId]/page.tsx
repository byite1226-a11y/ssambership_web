import Link from "next/link";
import { notFound } from "next/navigation";
import { PageScaffold } from "@/components/shell/PageScaffold";
import { MentorCustomRequestDetailCard } from "@/components/customRequest/MentorCustomRequestDetailCard";
import { requireRole } from "@/lib/auth/routeGuard";
import { createClient } from "@/lib/supabase/server";
import { loadCustomPostForPublicDetail, mentorHasApplicationForPost } from "@/lib/customRequest/customRequestQueries";

type PageProps = {
  params: Promise<{ postId: string }>;
  searchParams?: Promise<{ submitted?: string }>;
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function MentorCustomRequestPostDetailPage(props: PageProps) {
  const { postId } = await props.params;
  const sp = (await props.searchParams) ?? {};
  const submitted = sp.submitted === "1";

  const { user } = await requireRole("mentor");
  const supabase = await createClient();
  const post = await loadCustomPostForPublicDetail(supabase, postId);
  if (!post.row) {
    notFound();
  }
  const already = await mentorHasApplicationForPost(supabase, postId, user.id);

  return (
    <PageScaffold
      hideFooterPlaceholderCards
      eyebrow="멘토 / 맞춤의뢰"
      title="의뢰 상세"
      description="의뢰 내용을 확인한 뒤, 모집이 열려 있을 때만 지원서를 제출할 수 있어요."
      ctas={[
        { href: "/mentor/custom-request/posts", label: "목록", tone: "slate" },
        { href: "/mentor/custom-request/dashboard", label: "맞춤의뢰 홈", tone: "slate" },
      ]}
      sections={[]}
      emptyState=""
    >
      {submitted ? (
        <p className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50/90 px-4 py-3 text-sm font-bold text-emerald-900">
          지원서가 제출되었습니다. 의뢰자는 가격·납기·제안 내용을 비교한 뒤 한 분의 제안을 선택할 수 있어요.
        </p>
      ) : null}
      <MentorCustomRequestDetailCard postId={postId} row={post.row} alreadyApplied={already} />
      <p className="mt-6 text-center text-sm text-slate-500">
        <Link href="/custom-request" className="font-bold text-blue-700 underline">
          맞춤의뢰 소개로 가기
        </Link>
      </p>
    </PageScaffold>
  );
}
