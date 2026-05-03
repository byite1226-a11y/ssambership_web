import Link from "next/link";
import { notFound } from "next/navigation";
import { PageScaffold } from "@/components/shell/PageScaffold";
import { CustomRequestPublicPostBody } from "@/components/customRequest/CustomRequestPublicPostBody";
import { getServerUserWithProfile } from "@/lib/auth/getServerUserWithProfile";
import {
  isAuthorOfPost,
  loadApplicationsForPost,
  loadCustomPostForPublicDetail,
  loadPostAttachments,
} from "@/lib/customRequest/customRequestQueries";
import { mapDataErrorMessage } from "@/lib/utils/mapDataError";
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
        compactHero
        hideFooterPlaceholderCards
        eyebrow="맞춤의뢰"
        title="의뢰를 열 수 없어요"
        description="요청하신 맞춤의뢰를 불러오지 못했어요. 목록으로 돌아가 다시 시도해 주세요."
        ctas={[
          { href: "/custom-request", label: "맞춤의뢰", tone: "slate" },
        ]}
        sections={[]}
        dataPoints={[]}
        emptyState=""
      >
        <p className="text-sm text-slate-700">접근이 제한됐거나 주소가 바뀌었을 수 있어요. {mapDataErrorMessage(String(post.error))}</p>
      </PageScaffold>
    );
  }

  if (!post.row || !post.table) {
    notFound();
  }

  const applications = await loadApplicationsForPost(supabase, postId, 40);

  const canViewAttachments =
    !!user &&
    (profile?.role === "mentor" ||
      profile?.role === "admin" ||
      (profile?.role === "student" && isAuthorOfPost(user.id, post.row).ok));

  const postAttachments = canViewAttachments
    ? await loadPostAttachments(supabase, postId)
    : { rows: [], error: null as string | null };

  return (
    <PageScaffold
      compactHero
      hideFooterPlaceholderCards
      eyebrow="맞춤의뢰"
      title="맞춤의뢰 상세"
      description="요청 내용을 확인하고, 멘토님은 여기서 지원을 보낼 수 있어요(로그인·조건이 필요할 수 있어요)."
      ctas={[
        { href: "/custom-request", label: "목록/소개", tone: "slate" },
        { href: "/mentors", label: "멘토 찾기", tone: "slate" },
      ]}
      sections={[]}
      dataPoints={[]}
      emptyState=""
    >
      <div className="mx-auto w-full max-w-6xl px-3 sm:px-4 lg:px-0">
        {ok ? (
          <p className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50/90 px-3.5 py-2.5 text-sm font-extrabold text-emerald-900">
            지원이 제출되었어요.
          </p>
        ) : null}
        {err ? (
          <p className="mb-4 rounded-xl border border-red-100 bg-red-50/90 px-3.5 py-2.5 text-sm font-extrabold text-red-900">
            {mapDataErrorMessage(err)}
          </p>
        ) : null}
        <CustomRequestPublicPostBody
          postId={postId}
          row={post.row}
          postTable={post.table}
          userId={user?.id ?? null}
          profile={profile}
          applications={applications}
          canViewAttachments={canViewAttachments}
          attachments={postAttachments.rows}
          attachmentLoadError={postAttachments.error}
        />
        <p className="mt-8 text-center text-sm font-medium text-slate-500">
          <Link href="/custom-request" className="font-extrabold text-blue-700 underline decoration-blue-200 underline-offset-2 hover:text-blue-800">
            맞춤의뢰 허브로
          </Link>
        </p>
      </div>
    </PageScaffold>
  );
}
