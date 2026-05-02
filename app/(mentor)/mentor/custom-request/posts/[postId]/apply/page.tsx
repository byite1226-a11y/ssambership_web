import Link from "next/link";
import { notFound } from "next/navigation";
import { PageScaffold } from "@/components/shell/PageScaffold";
import { MentorApplicationForm } from "@/components/customRequest/MentorApplicationForm";
import { requireRole } from "@/lib/auth/routeGuard";
import { createClient } from "@/lib/supabase/server";
import {
  loadCustomPostForPublicDetail,
  mentorHasApplicationForPost,
} from "@/lib/customRequest/customRequestQueries";
import { isMentorApplicablePostStatus } from "@/lib/customRequest/customRequestPostMappers";
import { mapDataErrorMessage } from "@/lib/utils/mapDataError";

type PageProps = {
  params: Promise<{ postId: string }>;
  searchParams?: Promise<{ error?: string }>;
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function MentorCustomRequestApplyPage(props: PageProps) {
  const { postId } = await props.params;
  const sp = (await props.searchParams) ?? {};
  const err = typeof sp.error === "string" && sp.error ? sp.error : null;

  const { user } = await requireRole("mentor");
  const supabase = await createClient();
  const post = await loadCustomPostForPublicDetail(supabase, postId);
  if (!post.row) {
    notFound();
  }
  const already = await mentorHasApplicationForPost(supabase, postId, user.id);
  const open = isMentorApplicablePostStatus(post.row);
  const showForm = !already && open;

  return (
    <PageScaffold
      eyebrow="멘토 / 맞춤의뢰"
      title="지원서 작성"
      description="제안 가격·예상 납기·제안 내용을 입력해 주세요. 제출 후에는 동일 의뢰에 다시 제출할 수 없어요."
      ctas={[
        { href: `/mentor/custom-request/posts/${postId}`, label: "의뢰 상세로", tone: "slate" },
        { href: "/mentor/custom-request/posts", label: "목록", tone: "slate" },
      ]}
      sections={[]}
      emptyState=""
    >
      {err ? (
        <p className="mb-4 rounded-2xl border border-red-200 bg-red-50/90 px-4 py-3 text-sm font-bold text-red-900">
          {mapDataErrorMessage(err)}
        </p>
      ) : null}
      {already ? (
        <p className="mb-4 rounded-2xl border border-amber-200 bg-amber-50/80 px-4 py-3 text-sm text-amber-950">
          이미 이 의뢰에 제출하신 지원이 있습니다. 동일한 의뢰에는 한 번만 제출할 수 있어요.
        </p>
      ) : null}
      {!open && !already ? (
        <p className="mb-4 text-sm text-slate-600">현재 지원할 수 없는 의뢰입니다. 모집이 끝났거나, 조건이 맞지 않는 단계일 수 있어요.</p>
      ) : null}
      {showForm ? <MentorApplicationForm postId={postId} returnContext="mentor" /> : null}
      <p className="mt-4 text-sm text-slate-600">
        <Link className="font-bold text-blue-800 underline" href={`/mentor/custom-request/posts/${postId}`}>
          의뢰 상세로 돌아가기
        </Link>
      </p>
    </PageScaffold>
  );
}
