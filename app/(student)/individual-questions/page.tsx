import Link from "next/link";
import "@/app/(public)/custom-request/landing.css";
import { IndividualQuestionListCards } from "@/components/individualQuestion/IndividualQuestionViews";
import { getServerUserWithProfile } from "@/lib/auth/getServerUserWithProfile";
import { fetchStudentIndividualQuestions } from "@/lib/individualQuestion/individualQuestionQueries";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function StudentIndividualQuestionsPage() {
  // 비로그인도 목록 화면을 볼 수 있다. 실제 작성/제출은 /individual-questions/new 가드로 로그인 유도.
  const { user, profile } = await getServerUserWithProfile();
  const isStudent = Boolean(user) && (profile == null || profile.role === "student");

  let rows: Awaited<ReturnType<typeof fetchStudentIndividualQuestions>>["rows"] = [];
  let error: string | null = null;
  if (user && isStudent) {
    const supabase = await createClient();
    const result = await fetchStudentIndividualQuestions(supabase, user.id);
    rows = result.rows;
    error = result.error;
  }

  return (
    <div className="cr-landing cr-detail-v5 cr-detail-shell mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
      <article className="cr-detail-card">
        <header className="cr-detail-header">
          <span className="eyebrow">개별 질문</span>
          <div className="cr-detail-header-row">
            <h1 className="cr-detail-title">내 개별 질문</h1>
          </div>
          <p className="cr-detail-subtitle">캐시로 예치한 지정형·공개형 단건 질문과 답변 상태를 확인합니다.</p>
        </header>

        <p className="mb-4 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-900">
          개별 질문은 <strong>구독 질문방과 별개</strong>로, 건마다 캐시를 예치해 진행하는 단건 질문이에요. 구독 멘토와의 대화는 <Link href="/question-room" className="font-extrabold underline">질문방</Link>에서 이어집니다.
        </p>

        {/* 작성 진입: 공개형은 이 화면에서 바로, 지정형은 멘토 상세 안내 */}
        <section className="mb-6 grid gap-3 md:grid-cols-2">
          <div className="rounded-2xl border border-blue-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-extrabold text-blue-700">공개형</p>
            <h2 className="mt-1 text-lg font-black text-slate-900">멘토 지정 없이 질문하기</h2>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              가격을 제시해 공개로 등록하면, 승인된 멘토 중 먼저 가져간 1명이 답변해요.
            </p>
            <Link
              href="/individual-questions/new"
              className="mt-4 inline-flex items-center justify-center rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-extrabold text-white shadow-sm hover:bg-blue-700"
            >
              공개형 질문하기
            </Link>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-xs font-extrabold text-slate-500">지정형</p>
            <h2 className="mt-1 text-lg font-black text-slate-900">특정 멘토에게 묻기</h2>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              특정 멘토에게 묻고 싶다면 <strong>멘토 상세</strong>에서 <strong>&lsquo;개별 질문하기&rsquo;</strong>를 눌러 주세요.
            </p>
            <Link
              href="/mentors"
              className="mt-4 inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-extrabold text-slate-700 hover:bg-slate-100"
            >
              멘토 찾기
            </Link>
          </div>
        </section>

        {error ? (
          <p className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-900">
            개별 질문 목록을 불러오지 못했습니다. {error}
          </p>
        ) : null}

        {user ? (
          <IndividualQuestionListCards
            rows={rows}
            emptyTitle="아직 개별 질문이 없습니다"
            emptyDescription="공개 질문을 등록하거나 멘토 프로필에서 지정형 질문을 보낼 수 있어요."
            detailBaseHref="/individual-questions"
            counterpartLabel="멘토"
          />
        ) : (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <p className="text-base font-black text-slate-900">로그인하면 내 개별 질문이 보여요</p>
            <p className="mt-2 text-sm text-slate-500">학생 계정으로 로그인하면 보낸 질문과 답변 상태를 확인할 수 있어요.</p>
            <Link
              href="/login/student?next=/individual-questions"
              className="mt-4 inline-flex items-center justify-center rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-extrabold text-white shadow-sm hover:bg-blue-700"
            >
              학생 로그인
            </Link>
          </div>
        )}
      </article>
    </div>
  );
}
