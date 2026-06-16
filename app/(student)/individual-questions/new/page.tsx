import { randomUUID } from "crypto";
import Link from "next/link";
import "@/app/(public)/custom-request/landing.css";
import { FormSubmitButton } from "@/components/qna/FormSubmitButton";
import { requireRole } from "@/lib/auth/routeGuard";
import { createOpenIndividualQuestionAction } from "@/lib/individualQuestion/individualQuestionActions";
import {
  OPEN_INDIVIDUAL_QUESTION_GUIDE_MAX_CENTS,
  OPEN_INDIVIDUAL_QUESTION_GUIDE_MIN_CENTS,
  OPEN_INDIVIDUAL_QUESTION_MIN_PRICE_CENTS,
} from "@/lib/individualQuestion/individualQuestionTypes";
import { formatIndividualQuestionPrice } from "@/lib/individualQuestion/individualQuestionFormat";

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

const SUBJECT_OPTIONS = [
  { value: "korean", label: "국어" },
  { value: "english", label: "영어" },
  { value: "math", label: "수학" },
  { value: "science", label: "과학" },
  { value: "social", label: "사회·역사" },
  { value: "essay", label: "논술·글쓰기" },
  { value: "career", label: "진로·입시" },
  { value: "etc", label: "기타" },
];

function firstParam(value: string | string[] | undefined): string | null {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value[0] ?? null;
  return null;
}

export default async function NewOpenIndividualQuestionPage(props: PageProps) {
  await requireRole("student");
  const sp = (await props.searchParams) ?? {};
  const error = firstParam(sp.error);
  const idempotencyKey = `iq_open:${randomUUID()}`;

  return (
    <div className="cr-landing cr-detail-v5 cr-detail-shell mx-auto w-full max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
      <article className="cr-detail-card">
        <header className="cr-detail-header">
          <span className="eyebrow">개별 질문</span>
          <div className="cr-detail-header-row">
            <h1 className="cr-detail-title">공개 질문 등록</h1>
            <span className="cr-category-badge">공개형</span>
          </div>
          <p className="cr-detail-subtitle">
            멘토를 지정하지 않고 질문과 가격을 공개하면, 승인된 멘토 중 먼저 가져간 1명이 답변합니다.
          </p>
        </header>

        {error ? (
          <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-900">
            {error}
          </p>
        ) : null}

        <dl className="grid gap-3 rounded-2xl bg-[#eef4ff] p-4 sm:grid-cols-3">
          <div>
            <dt className="text-xs font-extrabold text-blue-700">질문 방식</dt>
            <dd className="mt-1 text-sm font-black text-slate-900">공개형 · 선착순 claim</dd>
          </div>
          <div>
            <dt className="text-xs font-extrabold text-blue-700">최소 금액</dt>
            <dd className="mt-1 text-sm font-black text-slate-900">
              {formatIndividualQuestionPrice(OPEN_INDIVIDUAL_QUESTION_MIN_PRICE_CENTS)}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-extrabold text-blue-700">권장 범위</dt>
            <dd className="mt-1 text-sm font-black text-slate-900">
              {formatIndividualQuestionPrice(OPEN_INDIVIDUAL_QUESTION_GUIDE_MIN_CENTS)}~
              {formatIndividualQuestionPrice(OPEN_INDIVIDUAL_QUESTION_GUIDE_MAX_CENTS)}
            </dd>
          </div>
        </dl>

        <form action={createOpenIndividualQuestionAction} encType="multipart/form-data" className="mt-6 space-y-5">
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
                {SUBJECT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
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
            <span className="text-sm font-extrabold text-slate-900">제시 금액</span>
            <input
              name="priceCents"
              type="number"
              inputMode="numeric"
              required
              min={OPEN_INDIVIDUAL_QUESTION_MIN_PRICE_CENTS}
              step={100}
              placeholder={String(OPEN_INDIVIDUAL_QUESTION_GUIDE_MIN_CENTS)}
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
            />
            <span className="mt-1 block text-xs font-semibold text-slate-500">
              최소 금액만 강제됩니다. 권장 범위를 벗어나도 등록할 수 있지만, 답변 속도가 달라질 수 있어요.
            </span>
          </label>

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
            <span className="mt-1 block text-xs font-semibold text-slate-500">내가 올린 파일은 언제든 다시 볼 수 있어요. 다른 멘토에게는 질문을 가져가기 전까지 공개되지 않습니다.</span>
          </label>

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Link
              href="/individual-questions"
              className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-center text-sm font-extrabold text-slate-700 hover:bg-slate-50"
            >
              취소
            </Link>
            <FormSubmitButton
              idleLabel="예치하고 공개 등록"
              pendingLabel="예치 처리 중..."
              className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-extrabold text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            />
          </div>
        </form>
      </article>
    </div>
  );
}
