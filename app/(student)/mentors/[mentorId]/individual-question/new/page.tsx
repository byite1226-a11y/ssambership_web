import { randomUUID } from "crypto";
import Link from "next/link";
import { redirect } from "next/navigation";
import "@/app/(public)/custom-request/landing.css";
import { FormSubmitButton } from "@/components/qna/FormSubmitButton";
import { SubjectSelectOptions } from "@/components/subjects/SubjectSelectOptions";
import { requireRole } from "@/lib/auth/routeGuard";
import { createDirectIndividualQuestionAction } from "@/lib/individualQuestion/individualQuestionActions";
import { fetchMentorIndividualQuestionPrice } from "@/lib/individualQuestion/individualQuestionPricing";
import { formatIndividualQuestionPrice } from "@/lib/individualQuestion/individualQuestionQueries";
import { buildMentorProfileDisplay } from "@/lib/mentor/mentorDisplayFields";
import { mentorVerificationStatusAllowsActivity } from "@/lib/mentor/mentorVerificationGate";
import { loadPublicMentorBundle } from "@/lib/mentor/publicMentorBundle";
import { createClient } from "@/lib/supabase/server";

type PageProps = {
  params: Promise<{ mentorId: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};


function firstParam(value: string | string[] | undefined): string | null {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value[0] ?? null;
  return null;
}

export default async function NewDirectIndividualQuestionPage(props: PageProps) {
  await requireRole("student");
  const { mentorId } = await props.params;
  const sp = (await props.searchParams) ?? {};
  const error = firstParam(sp.error);
  const supabase = await createClient();

  const [bundle, pricing] = await Promise.all([
    loadPublicMentorBundle(supabase, mentorId),
    fetchMentorIndividualQuestionPrice(supabase, mentorId),
  ]);

  if (bundle.kind !== "ok") {
    redirect(`/mentors/${encodeURIComponent(mentorId)}`);
  }

  const display = buildMentorProfileDisplay(bundle.profileRow, bundle.userRow);
  const isApproved = mentorVerificationStatusAllowsActivity(bundle.profileRow?.verification_status);
  const canSubmit = isApproved && pricing.amountCents != null;
  const idempotencyKey = `iq_direct:${randomUUID()}`;

  return (
    <div className="cr-landing cr-detail-v5 cr-detail-shell mx-auto w-full max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
      <article className="cr-detail-card">
        <header className="cr-detail-header">
          <span className="eyebrow">개별 질문</span>
          <div className="cr-detail-header-row">
            <h1 className="cr-detail-title">{display.displayName} 멘토에게 질문하기</h1>
            <span className="cr-category-badge">지정형</span>
          </div>
          <p className="cr-detail-subtitle">
            구독 질문권과 별개로 캐시를 예치해 단건 질문을 보냅니다. 답변 완료 시 예치 금액이 멘토에게 지급됩니다.
          </p>
        </header>

        {error ? (
          <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-900">
            {error}
          </p>
        ) : null}

        <dl className="grid gap-3 rounded-2xl bg-[#eef4ff] p-4 sm:grid-cols-3">
          <div>
            <dt className="text-xs font-extrabold text-blue-700">담당 멘토</dt>
            <dd className="mt-1 text-sm font-black text-slate-900">{display.displayName}</dd>
          </div>
          <div>
            <dt className="text-xs font-extrabold text-blue-700">개별 질문 단가</dt>
            <dd className="mt-1 text-sm font-black text-slate-900">
              {pricing.amountCents ? formatIndividualQuestionPrice(pricing.amountCents) : "미설정"}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-extrabold text-blue-700">진행 방식</dt>
            <dd className="mt-1 text-sm font-black text-slate-900">등록 시 예치 · 답변 완료 시 지급</dd>
          </div>
        </dl>

        {!canSubmit ? (
          <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5">
            <p className="text-sm font-extrabold text-amber-900">
              {isApproved ? "이 멘토는 아직 개별 질문 단가를 설정하지 않았어요." : "승인 완료된 멘토에게만 개별 질문을 보낼 수 있어요."}
            </p>
            <Link
              href={`/mentors/${mentorId}`}
              className="mt-4 inline-flex rounded-xl border border-amber-200 bg-white px-4 py-2 text-sm font-extrabold text-amber-800"
            >
              멘토 프로필로 돌아가기
            </Link>
          </div>
        ) : (
          <form action={createDirectIndividualQuestionAction} className="mt-6 space-y-5">
            <input type="hidden" name="mentorId" value={mentorId} />
            <input type="hidden" name="idempotencyKey" value={idempotencyKey} />

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="text-sm font-extrabold text-slate-900">과목</span>
                <select
                  name="subject"
                  defaultValue=""
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-900 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                >
                  <option value="">선택 안 함</option>
                  <SubjectSelectOptions />
                </select>
              </label>
              <label className="block">
                <span className="text-sm font-extrabold text-slate-900">단원·개념</span>
                <input
                  name="topic"
                  type="text"
                  placeholder="예: 함수의 극한, 문학 개념어"
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                />
              </label>
            </div>

            <label className="block">
              <span className="text-sm font-extrabold text-slate-900">제목</span>
              <input
                name="title"
                type="text"
                required
                minLength={2}
                maxLength={120}
                placeholder="질문 제목을 입력해 주세요"
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
              />
            </label>

            <label className="block">
              <span className="text-sm font-extrabold text-slate-900">질문 내용</span>
              <textarea
                name="body"
                required
                minLength={5}
                rows={9}
                placeholder="풀이 과정, 막힌 지점, 원하는 설명 방식을 적어 주세요."
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm leading-7 text-slate-900 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
              />
            </label>

            <label className="block">
              <span className="text-sm font-extrabold text-slate-900">첨부 파일</span>
              <input
                name="attachment"
                type="file"
                className="mt-2 block w-full rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-600"
              />
              <span className="mt-1 block text-xs font-semibold text-slate-500">이미지, PDF, ZIP, 문서 파일 20MB 이하</span>
            </label>

            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Link
                href={`/mentors/${mentorId}`}
                className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-center text-sm font-extrabold text-slate-700 hover:bg-slate-50"
              >
                취소
              </Link>
              <FormSubmitButton
                idleLabel={`${formatIndividualQuestionPrice(pricing.amountCents)} 예치하고 질문 보내기`}
                pendingLabel="예치 처리 중..."
                className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-extrabold text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              />
            </div>
          </form>
        )}
      </article>
    </div>
  );
}
