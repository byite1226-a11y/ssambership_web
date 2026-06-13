import Link from "next/link";
import { notFound } from "next/navigation";
import { PageScaffold } from "@/components/shell/PageScaffold";
import { CustomRequestDetailShell } from "@/components/customRequest/customRequestDetailLayout";
import { MentorCustomRequestDetailCard } from "@/components/customRequest/MentorCustomRequestDetailCard";
import { requireRole } from "@/lib/auth/routeGuard";
import { createClient } from "@/lib/supabase/server";
import {
  loadApplicationAttachments,
  loadCustomPostForPublicDetail,
  loadMentorApplicationIdForPost,
  loadPostAttachments,
  mentorHasApplicationForPost,
} from "@/lib/customRequest/customRequestQueries";
import { batchSignApplicationAttachmentImageThumbUrls } from "@/lib/customRequest/applicationAttachmentAccess";
import { isDraftCustomRequestPost } from "@/lib/customRequest/customRequestPostMappers";
import "@/app/(public)/custom-request/landing.css";

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
  const [post, already, postAttachments, applicationId] = await Promise.all([
    loadCustomPostForPublicDetail(supabase, postId),
    mentorHasApplicationForPost(supabase, postId, user.id),
    loadPostAttachments(supabase, postId),
    loadMentorApplicationIdForPost(supabase, postId, user.id),
  ]);
  if (!post.row) {
    notFound();
  }
  if (isDraftCustomRequestPost(post.row)) {
    notFound();
  }

  const { byApplicationId } = applicationId
    ? await loadApplicationAttachments(supabase, [applicationId])
    : { byApplicationId: {} as Record<string, never> };
  const applicationAttachments = applicationId ? (byApplicationId[applicationId] ?? []) : [];
  const applicationAttachmentThumbUrls =
    applicationId && applicationAttachments.length > 0
      ? await batchSignApplicationAttachmentImageThumbUrls(
          supabase,
          { userId: user.id, role: "mentor" },
          postId,
          applicationAttachments
        )
      : {};

  return (
    <PageScaffold hideFooterPlaceholderCards hideHero eyebrow="" title="" description="" ctas={[]} sections={[]} emptyState="">
      <CustomRequestDetailShell className="py-8">
        <MentorCustomRequestDetailCard
          postId={postId}
          row={post.row}
          alreadyApplied={already}
          submitted={submitted}
          applicationId={applicationId}
          applicationAttachments={applicationAttachments}
          applicationAttachmentThumbUrls={applicationAttachmentThumbUrls}
          attachments={postAttachments.rows}
          attachmentLoadError={postAttachments.error}
        />
        <p className="mt-6 text-center text-xs text-[var(--c-tertiary,#8a96a8)]">
          <Link href="/custom-request" className="font-semibold text-[var(--c-secondary,#3f4b5f)] hover:text-[var(--c-blue,#2563eb)] hover:underline">
            맞춤의뢰 소개
          </Link>
        </p>
      </CustomRequestDetailShell>
    </PageScaffold>
  );
}
