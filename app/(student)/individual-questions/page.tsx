import Link from "next/link";
import "@/app/(public)/custom-request/landing.css";
import { IndividualQuestionListCards } from "@/components/individualQuestion/IndividualQuestionViews";
import { requireRole } from "@/lib/auth/routeGuard";
import { fetchStudentIndividualQuestions } from "@/lib/individualQuestion/individualQuestionQueries";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function StudentIndividualQuestionsPage() {
  const { user } = await requireRole("student");
  const supabase = await createClient();
  const { rows, error } = await fetchStudentIndividualQuestions(supabase, user.id);

  return (
    <div className="cr-landing cr-detail-v5 cr-detail-shell mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
      <article className="cr-detail-card">
        <header className="cr-detail-header">
          <span className="eyebrow">개별 질문</span>
          <div className="cr-detail-header-row">
            <h1 className="cr-detail-title">내 개별 질문</h1>
            <div className="flex flex-wrap gap-2">
              <Link
                href="/individual-questions/new"
                className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-extrabold text-white hover:bg-blue-700"
              >
                공개 질문하기
              </Link>
              <Link
                href="/mentors"
                className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-extrabold text-blue-700 hover:bg-blue-100"
              >
                멘토 지정하기
              </Link>
            </div>
          </div>
          <p className="cr-detail-subtitle">캐시로 예치한 지정형·공개형 단건 질문과 답변 상태를 확인합니다.</p>
        </header>

        <p className="mb-4 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-900">
          개별 질문은 <strong>구독 질문방과 별개</strong>로, 건마다 캐시를 예치해 진행하는 단건 질문이에요. 구독 멘토와의 대화는 <Link href="/question-room" className="font-extrabold underline">질문방</Link>에서 이어집니다.
        </p>

        {error ? (
          <p className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-900">
            개별 질문 목록을 불러오지 못했습니다. {error}
          </p>
        ) : null}

        <IndividualQuestionListCards
          rows={rows}
          emptyTitle="아직 개별 질문이 없습니다"
          emptyDescription="공개 질문을 등록하거나 멘토 프로필에서 지정형 질문을 보낼 수 있어요."
          detailBaseHref="/individual-questions"
          counterpartLabel="멘토"
        />
      </article>
    </div>
  );
}
