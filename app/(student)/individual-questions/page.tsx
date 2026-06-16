import Link from "next/link";
import "@/app/(public)/custom-request/landing.css";
import { IndividualQuestionListCards } from "@/components/individualQuestion/IndividualQuestionViews";
import { requireRole } from "@/lib/auth/routeGuard";
import { fetchStudentDirectIndividualQuestions } from "@/lib/individualQuestion/individualQuestionQueries";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function StudentIndividualQuestionsPage() {
  const { user } = await requireRole("student");
  const supabase = await createClient();
  const { rows, error } = await fetchStudentDirectIndividualQuestions(supabase, user.id);

  return (
    <div className="cr-landing cr-detail-v5 cr-detail-shell mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
      <article className="cr-detail-card">
        <header className="cr-detail-header">
          <span className="eyebrow">개별 질문</span>
          <div className="cr-detail-header-row">
            <h1 className="cr-detail-title">내 개별 질문</h1>
            <Link
              href="/mentors"
              className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-extrabold text-white hover:bg-blue-700"
            >
              멘토 찾기
            </Link>
          </div>
          <p className="cr-detail-subtitle">캐시로 예치한 지정형 단건 질문과 답변 상태를 확인합니다.</p>
        </header>

        {error ? (
          <p className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-900">
            개별 질문 목록을 불러오지 못했습니다. {error}
          </p>
        ) : null}

        <IndividualQuestionListCards
          rows={rows}
          emptyTitle="아직 개별 질문이 없습니다"
          emptyDescription="멘토 프로필에서 개별 질문하기를 눌러 단건 질문을 보낼 수 있어요."
          detailBaseHref="/individual-questions"
          counterpartLabel="멘토"
        />
      </article>
    </div>
  );
}
