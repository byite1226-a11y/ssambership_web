import Link from "next/link";
import { notFound, redirect } from "next/navigation";
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
import { CustomRequestDetailShell } from "@/components/customRequest/customRequestDetailLayout";
import { isDraftCustomRequestPost } from "@/lib/customRequest/customRequestPostMappers";

import "@/app/(public)/custom-request/landing.css";

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

  if (isDraftCustomRequestPost(post.row)) {
    if (user && isAuthorOfPost(user.id, post.row).ok) {
      redirect(`/custom-request/new?draftId=${encodeURIComponent(postId)}`);
    }
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
      hideHero
      hideFooterPlaceholderCards
      eyebrow=""
      title=""
      description=""
      ctas={[
        { href: "/custom-request", label: "목록/소개", tone: "slate" },
        { href: "/mentors", label: "멘토 찾기", tone: "slate" },
      ]}
      sections={[]}
      dataPoints={[]}
      emptyState=""
    >
      <CustomRequestDetailShell>
        {ok ? (
          <p className="form-alert-info mb-4">지원이 제출되었어요.</p>
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
        <p className="cr-detail-footer-link">
          <Link
            href="/custom-request"
            className="font-extrabold text-[var(--c-blue,#1A56DB)] underline decoration-blue-200 underline-offset-2 hover:text-blue-800"
          >
            맞춤의뢰 홈으로
          </Link>
        </p>
      </CustomRequestDetailShell>
    </PageScaffold>
  );
}
