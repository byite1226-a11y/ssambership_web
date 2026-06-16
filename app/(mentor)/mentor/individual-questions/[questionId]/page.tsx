import { notFound, redirect } from "next/navigation";
import "@/app/(public)/custom-request/landing.css";
import { IndividualQuestionDetailView } from "@/components/individualQuestion/IndividualQuestionViews";
import { requireRole } from "@/lib/auth/routeGuard";
import { fetchIndividualQuestionDetail } from "@/lib/individualQuestion/individualQuestionQueries";
import { assertMentorApprovedForAction } from "@/lib/mentor/mentorVerificationGate";
import { createClient } from "@/lib/supabase/server";

type PageProps = {
  params: Promise<{ questionId: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function firstParam(value: string | string[] | undefined): string | null {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value[0] ?? null;
  return null;
}

export default async function MentorIndividualQuestionDetailPage(props: PageProps) {
  const { user } = await requireRole("mentor");
  const { questionId } = await props.params;
  const sp = (await props.searchParams) ?? {};
  const supabase = await createClient();
  const approval = await assertMentorApprovedForAction(supabase, user.id);
  if (!approval.ok) redirect("/mentor/individual-questions");

  const { detail, error } = await fetchIndividualQuestionDetail(supabase, questionId);
  if (error || !detail) notFound();
  if (detail.question_type !== "direct" || detail.designated_mentor_id !== user.id) {
    redirect("/mentor/individual-questions");
  }

  const answered = firstParam(sp.answered);
  const canAnswer = detail.status === "assigned";

  return (
    <IndividualQuestionDetailView
      detail={detail}
      actor="mentor"
      backHref="/mentor/individual-questions"
      backLabel="개별 질문 목록"
      canAnswer={canAnswer}
      flash={answered ? "답변 완료와 지급 처리가 끝났습니다." : null}
    />
  );
}
