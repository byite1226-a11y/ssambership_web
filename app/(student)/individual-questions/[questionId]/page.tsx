import { notFound, redirect } from "next/navigation";
import "@/app/(public)/custom-request/landing.css";
import { IndividualQuestionDetailView } from "@/components/individualQuestion/IndividualQuestionViews";
import { requireRole } from "@/lib/auth/routeGuard";
import { fetchIndividualQuestionDetail } from "@/lib/individualQuestion/individualQuestionQueries";
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

export default async function StudentIndividualQuestionDetailPage(props: PageProps) {
  const { user } = await requireRole("student");
  const { questionId } = await props.params;
  const sp = (await props.searchParams) ?? {};
  const supabase = await createClient();
  const { detail, error } = await fetchIndividualQuestionDetail(supabase, questionId);

  if (error || !detail) notFound();
  if (detail.student_id !== user.id) redirect("/individual-questions");

  const created = firstParam(sp.created);
  const warning = firstParam(sp.warning);

  return (
    <IndividualQuestionDetailView
      detail={detail}
      actor="student"
      backHref="/individual-questions"
      backLabel="내 개별 질문 목록"
      flash={created ? "질문이 전달되었어요. 예치 금액은 답변 완료 전까지 보관됩니다." : null}
      warning={warning}
    />
  );
}
