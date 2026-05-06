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
      ctas={[]}
      sections={[]}
      emptyState=""
    >
      <div className="-mt-1 mb-4 flex flex-wrap gap-x-4 gap-y-1 text-xs font-semibold text-slate-600">
        <Link href="/mentor/custom-request/posts" className="hover:text-blue-800 hover:underline">
          의뢰 목록
        </Link>
        <Link href="/mentor/custom-request/dashboard" className="hover:text-blue-800 hover:underline">
          맞춤의뢰 대시보드
        </Link>
      </div>
      {submitted ? (
        <p className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50/90 px-4 py-3 text-sm font-bold text-emerald-900">
          지원서가 제출되었습니다. 의뢰자는 가격·납기·제안 내용을 비교한 뒤 한 분의 제안을 선택할 수 있어요.
        </p>
      ) : null}
      <MentorCustomRequestDetailCard postId={postId} row={post.row} alreadyApplied={already} />
      <p className="mt-6 text-center text-xs text-slate-500">
        <Link href="/custom-request" className="font-semibold text-blue-800 underline-offset-2 hover:underline">
          맞춤의뢰 소개
        </Link>
      </p>
    </PageScaffold>
  );
}
