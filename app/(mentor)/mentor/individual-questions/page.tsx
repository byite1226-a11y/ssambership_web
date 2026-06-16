import Link from "next/link";
import "@/app/(public)/custom-request/landing.css";
import { IndividualQuestionListCards } from "@/components/individualQuestion/IndividualQuestionViews";
import { requireRole } from "@/lib/auth/routeGuard";
import { fetchMentorDirectIndividualQuestions } from "@/lib/individualQuestion/individualQuestionQueries";
import { assertMentorApprovedForAction } from "@/lib/mentor/mentorVerificationGate";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function MentorIndividualQuestionsPage() {
  const { user } = await requireRole("mentor");
  const supabase = await createClient();
  const approval = await assertMentorApprovedForAction(supabase, user.id);
  const { rows, error } = approval.ok
    ? await fetchMentorDirectIndividualQuestions(supabase, user.id)
    : { rows: [], error: null };

  return (
    <div className="cr-landing cr-detail-v5 cr-detail-shell mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
      <article className="cr-detail-card">
        <header className="cr-detail-header">
          <span className="eyebrow">개별 질문</span>
          <div className="cr-detail-header-row">
            <h1 className="cr-detail-title">나에게 온 개별 질문</h1>
            <Link
              href="/mentor/profile/edit"
              className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-extrabold text-blue-700 hover:bg-blue-100"
            >
              단가 설정
            </Link>
          </div>
          <p className="cr-detail-subtitle">학생이 캐시를 예치하고 지정한 단건 질문에 답변합니다.</p>
        </header>

        {!approval.ok ? (
          <p className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-900">
            승인 완료 후 개별 질문에 답변할 수 있어요. 현재 상태를 확인해 주세요.
          </p>
        ) : null}
        {error ? (
          <p className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-900">
            개별 질문 목록을 불러오지 못했습니다. {error}
          </p>
        ) : null}

        <IndividualQuestionListCards
          rows={rows}
          emptyTitle="아직 지정된 개별 질문이 없습니다"
          emptyDescription="학생이 멘토 프로필에서 개별 질문을 보내면 이곳에 표시됩니다."
          detailBaseHref="/mentor/individual-questions"
          counterpartLabel="학생"
        />
      </article>
    </div>
  );
}
