import Link from "next/link";
import "@/app/(public)/custom-request/landing.css";
import {
  IndividualQuestionListCards,
  MentorIndividualQuestionSummaryStrip,
  OpenIndividualQuestionBrowseCards,
} from "@/components/individualQuestion/IndividualQuestionViews";
import { requireRole } from "@/lib/auth/routeGuard";
import {
  fetchMentorOwnedIndividualQuestions,
  fetchOpenIndividualQuestionsForMentor,
  isIndividualQuestionAwaitingAnswer,
} from "@/lib/individualQuestion/individualQuestionQueries";
import { assertMentorApprovedForAction } from "@/lib/mentor/mentorVerificationGate";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function firstParam(value: string | string[] | undefined): string | null {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value[0] ?? null;
  return null;
}

export default async function MentorIndividualQuestionsPage(props: PageProps) {
  const { user } = await requireRole("mentor");
  const sp = (await props.searchParams) ?? {};
  const flashError = firstParam(sp.error);
  const supabase = await createClient();
  const approval = await assertMentorApprovedForAction(supabase, user.id);
  const [{ rows, error }, openList] = approval.ok
    ? await Promise.all([
        fetchMentorOwnedIndividualQuestions(supabase, user.id),
        fetchOpenIndividualQuestionsForMentor(supabase, 80),
      ])
    : [{ rows: [], error: null }, { rows: [], error: null }];

  const awaitingRows = rows.filter((row) => isIndividualQuestionAwaitingAnswer(row.status));
  const settledRows = rows.filter((row) => !isIndividualQuestionAwaitingAnswer(row.status));

  // 요약 스트립 숫자 — 이미 가져온 목록으로 계산(데이터 로직 미터치, 표시용 카운트).
  const lower = (s: string | null | undefined) => (s ?? "").toLowerCase();
  const now = new Date();
  const waitingCount = rows.filter((r) => ["assigned", "escrowed"].includes(lower(r.status))).length;
  const inProgressCount = rows.filter((r) => ["claimed", "answered"].includes(lower(r.status))).length;
  const doneThisMonthCount = rows.filter((r) => {
    if (lower(r.status) !== "released" || !r.released_at) return false;
    const d = new Date(r.released_at);
    return !Number.isNaN(d.getTime()) && d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  }).length;

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
        {flashError ? (
          <p className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-900">
            {flashError}
          </p>
        ) : null}
        {error ? (
          <p className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-900">
            개별 질문 목록을 불러오지 못했습니다. {error}
          </p>
        ) : null}

        {approval.ok ? (
          <MentorIndividualQuestionSummaryStrip
            waiting={waitingCount}
            inProgress={inProgressCount}
            doneThisMonth={doneThisMonthCount}
          />
        ) : null}

        {rows.length === 0 ? (
          <section>
            <h2 className="cr-section-title-v5 mb-4">
              <span className="bar" aria-hidden />
              내가 맡은 질문
            </h2>
            <IndividualQuestionListCards
              rows={rows}
              emptyTitle="아직 맡은 개별 질문이 없습니다"
              emptyDescription="학생이 멘토를 지정하거나 공개 질문에 답변을 맡으면 이곳에 표시됩니다."
              detailBaseHref="/mentor/individual-questions"
              counterpartLabel="학생"
            />
          </section>
        ) : (
          <>
            <section>
              <h2 className="cr-section-title-v5 mb-4">
                <span className="bar" aria-hidden />
                답변 대기 ({awaitingRows.length})
              </h2>
              <IndividualQuestionListCards
                rows={awaitingRows}
                emptyTitle="답변할 질문이 없어요"
                emptyDescription="새 지정 질문이 도착하거나 공개 질문에 답변을 맡으면 이곳에 표시됩니다."
                detailBaseHref="/mentor/individual-questions"
                counterpartLabel="학생"
              />
            </section>

            {settledRows.length > 0 ? (
              <>
                <hr className="cr-detail-divider" />
                <section>
                  <h2 className="cr-section-title-v5 mb-4">
                    <span className="bar" aria-hidden />
                    답변 완료·종료 ({settledRows.length})
                  </h2>
                  <IndividualQuestionListCards
                    rows={settledRows}
                    emptyTitle="완료된 질문이 없어요"
                    emptyDescription="답변을 완료하면 이곳에 정리됩니다."
                    detailBaseHref="/mentor/individual-questions"
                    counterpartLabel="학생"
                  />
                </section>
              </>
            ) : null}
          </>
        )}

        <hr className="cr-detail-divider" />

        <section>
          <div className="mb-4">
            <h2 className="cr-section-title-v5">
              <span className="bar" aria-hidden />
              공개 질문 답변하기
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              학생 신원과 본문은 답변을 맡기 전에는 공개되지 않습니다. 먼저 답변하기를 누른 멘토 1명만 답변할 수 있어요.
            </p>
          </div>
          <OpenIndividualQuestionBrowseCards rows={openList.rows} error={openList.error} />
        </section>
      </article>
    </div>
  );
}
