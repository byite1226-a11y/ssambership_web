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
import { shortOrderIdForDisplay } from "@/lib/utils/formatOrderIdForDisplay";
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
    const friendly = mapDataErrorMessage(String(post.error));
    return (
      <PageScaffold
        eyebrow="맞춤의뢰"
        title="의뢰를 열 수 없습니다"
        description="요청한 의뢰를 불러오지 못했습니다. 목록으로 돌아가 다시 시도해 주세요."
        ctas={[
          { href: "/custom-request", label: "맞춤의뢰", tone: "slate" },
        ]}
        sections={[]}
      >
        <p className="text-sm text-amber-800">{friendly}</p>
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
      eyebrow="맞춤의뢰"
      title="맞춤의뢰 상세"
      description={`의뢰 ${shortOrderIdForDisplay(postId)} · 멘토는 여기서 지원을 제출할 수 있습니다(로그인·자격이 필요할 수 있습니다).`}
      ctas={[
        { href: "/custom-request", label: "목록/소개", tone: "slate" },
        { href: "/mentors", label: "멘토 찾기", tone: "slate" },
      ]}
      sections={[]}
    >
      {ok ? (
        <p className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-bold text-emerald-900">지원이 제출되었습니다.</p>
      ) : null}
      {err ? (
        <p className="mb-4 text-sm font-bold text-red-800">제출/오류: {mapDataErrorMessage(err)}</p>
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
      <p className="mt-8 text-center text-sm text-slate-500">
        <Link href="/custom-request" className="font-bold text-blue-700 underline">
          맞춤의뢰로 돌아가기
        </Link>
      </p>
    </PageScaffold>
  );
}
