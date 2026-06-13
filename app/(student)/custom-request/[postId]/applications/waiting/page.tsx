import "@/app/(public)/custom-request/landing.css";
import { redirect } from "next/navigation";
import { PageScaffold } from "@/components/shell/PageScaffold";
import { CustomRequestDetailShell } from "@/components/customRequest/customRequestDetailLayout";
import {
  CustomRequestApplicationsWaitingView,
  type WaitingApplicationItem,
  type WaitingPostSummary,
} from "@/components/customRequest/CustomRequestApplicationsWaitingView";
import { requireRole } from "@/lib/auth/routeGuard";
import { isDraftCustomRequestPost, mapPostRowToPublicDetail } from "@/lib/customRequest/customRequestPostMappers";
import {
  enrichApplicationRows,
  isAuthorOfPost,
  loadApplicationAttachments,
  loadApplicationsForPost,
  loadCustomPostById,
  pickApplicationRowId,
  pickDisplayField,
  type EnrichedApplication,
} from "@/lib/customRequest/customRequestQueries";
import {
  mentorIsVerified,
  mentorSubjectChips,
} from "@/lib/mentor/mentorPublicProfileDisplay";
import { fetchReviewsSummary } from "@/lib/mentor/publicMentorBundle";
import { createClient } from "@/lib/supabase/server";

type Row = Record<string, unknown>;

const MAX_APPLICANTS = 10;

type PageProps = {
  params: Promise<{ postId: string }>;
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

function pickDeadlineIso(row: Row | null): string | null {
  if (!row) return null;
  for (const k of ["deadline", "due_at", "due_date", "ends_at", "close_at"] as const) {
    const v = row[k];
    if (v instanceof Date && !Number.isNaN(v.getTime())) {
      return v.toISOString();
    }
    if (typeof v === "string" && v.trim()) {
      return v.trim();
    }
  }
  return null;
}

function formatAppliedAt(row: Row): string {
  const raw = row.created_at ?? row.submitted_at ?? row.applied_at;
  if (raw == null) return "—";
  try {
    const d = raw instanceof Date ? raw : new Date(String(raw));
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleString("ko-KR", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
}

async function loadMentorRatings(
  supabase: Awaited<ReturnType<typeof createClient>>,
  mentorIds: string[]
): Promise<Map<string, number | null>> {
  const unique = [...new Set(mentorIds.filter(Boolean))];
  const entries = await Promise.all(
    unique.map(async (id) => {
      const { avgRating } = await fetchReviewsSummary(supabase, id);
      return [id, avgRating] as const;
    })
  );
  return new Map(entries);
}

function mapPostSummary(postRow: Row | null): WaitingPostSummary {
  if (!postRow) {
    return {
      title: "요청 정보 없음",
      category: "—",
      budgetLine: "—",
      deadline: "—",
      deadlineIso: null,
    };
  }
  const d = mapPostRowToPublicDetail(postRow);
  return {
    title: d.title,
    category: d.category,
    budgetLine: d.budgetLine,
    deadline: d.deadline,
    deadlineIso: pickDeadlineIso(postRow),
  };
}

function mapApplications(
  enriched: EnrichedApplication[],
  ratings: Map<string, number | null>,
  attachmentCountByApplicationId: Record<string, number>
): WaitingApplicationItem[] {
  return enriched.map((e, index) => {
    const displayName =
      e.display?.displayName ??
      pickDisplayField(e.row, ["mentor_name", "mentor_display_name", "mentor_nickname"]);
    const schoolLine = e.display
      ? [e.display.university, e.display.department].filter((x) => x && x !== "—").join(" · ")
      : "";
    const subjectSource = [e.display?.subjects, e.display?.tags].filter(Boolean).join(", ");
    const subjectTags = mentorSubjectChips(subjectSource, 4);
    const applicationId = pickApplicationRowId(e.row) ?? `app-${index}`;
    const photoUrl =
      e.display?.photoUrl && e.display.photoUrl !== "—" ? e.display.photoUrl : null;

    return {
      id: applicationId,
      mentorName: displayName !== "—" ? displayName : "멘토",
      schoolLine,
      subjectTags,
      avgRating: e.mentorId ? (ratings.get(e.mentorId) ?? null) : null,
      appliedAtLabel: formatAppliedAt(e.row),
      photoUrl,
      verified: mentorIsVerified(e.display?.verification),
      attachmentCount: attachmentCountByApplicationId[applicationId] ?? 0,
    };
  });
}

export default async function CustomRequestApplicationsWaitingPage(props: PageProps) {
  const { postId } = await props.params;

  const { user } = await requireRole("student");
  const supabase = await createClient();

  const post = await loadCustomPostById(supabase, postId);
  const authz = isAuthorOfPost(user.id, post.row);
  if (authz.ok && isDraftCustomRequestPost(post.row)) {
    redirect(`/custom-request/new?draftId=${encodeURIComponent(postId)}`);
  }
  const list = await loadApplicationsForPost(supabase, postId, MAX_APPLICANTS);
  const enriched = await enrichApplicationRows(supabase, (list.rows as Row[]) ?? []);
  const applicationIds = enriched
    .map((e) => pickApplicationRowId(e.row) ?? e.applicationId)
    .filter((id): id is string => Boolean(id));
  const { byApplicationId } = await loadApplicationAttachments(supabase, applicationIds);
  const attachmentCountByApplicationId = Object.fromEntries(
    Object.entries(byApplicationId).map(([id, rows]) => [id, rows.length])
  );
  const mentorIds = enriched.map((e) => e.mentorId).filter((id): id is string => Boolean(id));
  const ratings = await loadMentorRatings(supabase, mentorIds);

  const postSummary = mapPostSummary(post.row != null ? (post.row as Row) : null);
  const applications = mapApplications(enriched, ratings, attachmentCountByApplicationId);
  const applicantCount = list.error ? 0 : list.rows.length;

  return (
    <PageScaffold
      hideHero
      hideFooterPlaceholderCards
      eyebrow=""
      title=""
      description=""
      ctas={[]}
      sections={[]}
      emptyState=""
      dataPoints={[]}
    >
      <CustomRequestDetailShell>
        {!authz.ok ? (
          <p className="rounded-2xl border border-amber-200 bg-amber-50/80 p-4 text-sm font-semibold text-amber-950">
            이 맞춤의뢰는 작성자(의뢰하신 본인)만 지원 대기 화면을 열 수 있어요.
          </p>
        ) : (
          <CustomRequestApplicationsWaitingView
            postId={postId}
            post={postSummary}
            applications={applications}
            applicantCount={applicantCount}
            maxApplicants={MAX_APPLICANTS}
            listError={list.error && !list.rows.length ? list.error : null}
          />
        )}
      </CustomRequestDetailShell>
    </PageScaffold>
  );
}
