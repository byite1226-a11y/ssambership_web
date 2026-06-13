import Link from "next/link";
import { notFound } from "next/navigation";
import { PageScaffold } from "@/components/shell/PageScaffold";
import { MentorApplicationForm } from "@/components/customRequest/MentorApplicationForm";
import { MentorPostReadonlySummary, mentorPostSummaryFromRow } from "@/components/customRequest/MentorPostReadonlySummary";
import { requireRole } from "@/lib/auth/routeGuard";
import { createClient } from "@/lib/supabase/server";
import {
  loadCustomPostForPublicDetail,
  mentorHasApplicationForPost,
} from "@/lib/customRequest/customRequestQueries";
import { isDraftCustomRequestPost, isMentorApplicablePostStatus } from "@/lib/customRequest/customRequestPostMappers";
import { mapDataErrorMessage } from "@/lib/utils/mapDataError";
import "@/app/(public)/custom-request/landing.css";

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
  if (isDraftCustomRequestPost(post.row)) {
    notFound();
  }
  const already = await mentorHasApplicationForPost(supabase, postId, user.id);
  const open = isMentorApplicablePostStatus(post.row);
  const showForm = !already && open;
  const postSummary = mentorPostSummaryFromRow(post.row);

  return (
    <PageScaffold hideFooterPlaceholderCards hideHero eyebrow="" title="" description="" ctas={[]} sections={[]} emptyState="">
      <div className="cr-landing mx-auto w-full max-w-2xl">
        <nav className="apply-breadcrumb" aria-label="경로">
          <span>멘토 / 맞춤의뢰</span>
          <span className="sep" aria-hidden>
            ·
          </span>
          <Link href={`/mentor/custom-request/posts/${postId}`}>의뢰 상세</Link>
          <span className="sep" aria-hidden>
            ·
          </span>
          <Link href="/mentor/custom-request/posts">의뢰 목록</Link>
        </nav>

        <header className="form-header sec-head left">
          <span className="eyebrow">맞춤의뢰</span>
          <h2>지원서 작성</h2>
          <p>제안 가격·예상 납기·제안 내용을 입력해 주세요.</p>
        </header>

        <div className="mt-5 space-y-3">
          {err ? (
            <p className="form-alert" role="alert">
              {mapDataErrorMessage(err)}
            </p>
          ) : null}
          {already ? (
            <p className="form-alert-warn">
              이미 이 의뢰에 제출하신 지원이 있습니다. 동일한 의뢰에는 한 번만 제출할 수 있어요.
            </p>
          ) : null}
          {!open && !already ? (
            <p className="form-alert-info">
              현재 지원할 수 없는 의뢰입니다. 모집이 끝났거나, 조건이 맞지 않는 단계일 수 있어요.
            </p>
          ) : null}

          {showForm ? (
            <div className="apply-shell">
              <MentorPostReadonlySummary row={post.row} compact embedded landing />
              <MentorApplicationForm
                postId={postId}
                returnContext="mentor"
                postSummary={postSummary}
                embedded
                landing
              />
            </div>
          ) : null}
        </div>
      </div>
    </PageScaffold>
  );
}
