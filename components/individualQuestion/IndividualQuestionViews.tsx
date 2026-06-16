import Link from "next/link";
import type { ReactNode } from "react";
import { MessageSquareText, Paperclip, WalletCards } from "lucide-react";
import { FormSubmitButton } from "@/components/qna/FormSubmitButton";
import { answerDirectIndividualQuestionAction } from "@/lib/individualQuestion/individualQuestionActions";
import {
  formatIndividualQuestionDate,
  formatIndividualQuestionPrice,
  individualQuestionStatusBadgeClass,
  individualQuestionStatusLabel,
  type IndividualQuestionDetail,
  type IndividualQuestionListItem,
} from "@/lib/individualQuestion/individualQuestionQueries";

function SectionTitle(props: { title: string; hint?: string; right?: ReactNode }) {
  return (
    <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h2 className="cr-section-title-v5">
          <span className="bar" aria-hidden />
          {props.title}
        </h2>
        {props.hint ? <p className="mt-1 text-sm text-slate-500">{props.hint}</p> : null}
      </div>
      {props.right}
    </div>
  );
}

export function IndividualQuestionStatusBadge(props: { status: string | null | undefined }) {
  return (
    <span className={`rounded-full border px-2.5 py-1 text-xs font-extrabold ${individualQuestionStatusBadgeClass(props.status)}`}>
      {individualQuestionStatusLabel(props.status)}
    </span>
  );
}

export function IndividualQuestionListCards(props: {
  rows: IndividualQuestionListItem[];
  emptyTitle: string;
  emptyDescription: string;
  detailBaseHref: string;
  counterpartLabel: "멘토" | "학생";
}) {
  if (props.rows.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <p className="text-base font-black text-slate-900">{props.emptyTitle}</p>
        <p className="mt-2 text-sm text-slate-500">{props.emptyDescription}</p>
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      {props.rows.map((row) => {
        const counterpart = props.counterpartLabel === "멘토" ? row.mentorName : row.studentName;
        return (
          <Link
            key={row.id}
            href={`${props.detailBaseHref}/${row.id}`}
            className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-200 hover:shadow-md"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <IndividualQuestionStatusBadge status={row.status} />
                  <span className="text-xs font-bold text-blue-700">{formatIndividualQuestionPrice(row.price_cents)} 예치</span>
                </div>
                <h2 className="mt-2 truncate text-lg font-black text-slate-900 group-hover:text-blue-700">{row.title}</h2>
                <p className="mt-1 line-clamp-2 text-sm leading-6 text-slate-600">{row.body}</p>
              </div>
              <dl className="grid min-w-[180px] gap-2 rounded-xl bg-slate-50 px-4 py-3 text-sm">
                <div>
                  <dt className="text-xs font-bold text-slate-500">{props.counterpartLabel}</dt>
                  <dd className="mt-0.5 font-extrabold text-slate-900">{counterpart}</dd>
                </div>
                <div>
                  <dt className="text-xs font-bold text-slate-500">등록일</dt>
                  <dd className="mt-0.5 font-extrabold text-slate-900">{formatIndividualQuestionDate(row.created_at)}</dd>
                </div>
              </dl>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

function AttachmentList(props: { attachments: IndividualQuestionDetail["attachments"] }) {
  if (props.attachments.length === 0) {
    return <p className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">첨부 파일이 없습니다.</p>;
  }

  return (
    <ul className="grid gap-2">
      {props.attachments.map((attachment) => (
        <li key={attachment.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3">
          <span className="inline-flex min-w-0 items-center gap-2 text-sm font-bold text-slate-800">
            <Paperclip className="h-4 w-4 shrink-0 text-blue-600" aria-hidden />
            <span className="truncate">{attachment.file_name || "첨부 파일"}</span>
          </span>
          {attachment.signedUrl ? (
            <Link
              href={attachment.signedUrl}
              target="_blank"
              rel="noreferrer"
              className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-extrabold text-blue-700 hover:bg-blue-100"
            >
              열기
            </Link>
          ) : (
            <span className="text-xs font-semibold text-slate-400">열람 불가</span>
          )}
        </li>
      ))}
    </ul>
  );
}

export function IndividualQuestionDetailView(props: {
  detail: IndividualQuestionDetail;
  backHref: string;
  backLabel: string;
  actor: "student" | "mentor";
  canAnswer?: boolean;
  flash?: string | null;
  warning?: string | null;
}) {
  const { detail } = props;
  const counterpartName = props.actor === "student" ? detail.mentorName : detail.studentName;
  const counterpartLabel = props.actor === "student" ? "담당 멘토" : "학생";

  return (
    <div className="cr-landing cr-detail-v5 cr-detail-shell mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
      <article className="cr-detail-card">
        <header className="cr-detail-header">
          <span className="eyebrow">개별 질문</span>
          <div className="cr-detail-header-row">
            <h1 className="cr-detail-title">{detail.title}</h1>
            <IndividualQuestionStatusBadge status={detail.status} />
          </div>
          <p className="cr-detail-subtitle">
            구독 질문권과 별개로 캐시를 예치해 진행하는 단건 질문입니다.
          </p>
        </header>

        {props.flash ? (
          <p className="mb-4 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-bold text-blue-900">
            {props.flash}
          </p>
        ) : null}
        {props.warning ? (
          <p className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-900">
            {props.warning}
          </p>
        ) : null}

        <dl className="grid gap-3 rounded-2xl bg-[#eef4ff] p-4 sm:grid-cols-3">
          <div>
            <dt className="text-xs font-extrabold text-blue-700">{counterpartLabel}</dt>
            <dd className="mt-1 text-sm font-black text-slate-900">{counterpartName}</dd>
          </div>
          <div>
            <dt className="text-xs font-extrabold text-blue-700">예치 금액</dt>
            <dd className="mt-1 text-sm font-black text-slate-900">{formatIndividualQuestionPrice(detail.price_cents)}</dd>
          </div>
          <div>
            <dt className="text-xs font-extrabold text-blue-700">등록일</dt>
            <dd className="mt-1 text-sm font-black text-slate-900">{formatIndividualQuestionDate(detail.created_at)}</dd>
          </div>
        </dl>

        <hr className="cr-detail-divider" />

        <section>
          <SectionTitle title="질문 내용" hint="멘토에게 전달된 원문입니다." />
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="whitespace-pre-wrap text-sm leading-7 text-slate-700">{detail.body}</p>
            <div className="mt-4 flex flex-wrap gap-2 text-xs font-bold text-slate-500">
              {detail.subject ? <span className="rounded-full bg-slate-100 px-2.5 py-1">과목 {detail.subject}</span> : null}
              {detail.topic ? <span className="rounded-full bg-slate-100 px-2.5 py-1">단원 {detail.topic}</span> : null}
            </div>
          </div>
        </section>

        <hr className="cr-detail-divider" />

        <section>
          <SectionTitle title="첨부 파일" hint="질문과 답변에 연결된 파일입니다." />
          <AttachmentList attachments={detail.attachments} />
        </section>

        <hr className="cr-detail-divider" />

        <section>
          <SectionTitle
            title="답변 기록"
            hint={detail.messages.length > 0 ? "멘토 답변과 후속 기록입니다." : "아직 답변이 등록되지 않았습니다."}
            right={
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-3 py-1 text-xs font-bold text-slate-600">
                <MessageSquareText className="h-3.5 w-3.5" aria-hidden />
                {detail.messages.length}건
              </span>
            }
          />
          {detail.messages.length > 0 ? (
            <ol className="space-y-3">
              {detail.messages.map((message) => (
                <li key={message.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-black text-slate-900">{message.authorName}</p>
                    <p className="text-xs font-semibold text-slate-500">{formatIndividualQuestionDate(message.created_at)}</p>
                  </div>
                  <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-700">{message.body}</p>
                </li>
              ))}
            </ol>
          ) : (
            <p className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">멘토 답변을 기다리고 있어요.</p>
          )}
        </section>

        {props.canAnswer ? (
          <>
            <hr className="cr-detail-divider" />
            <section>
              <SectionTitle
                title="답변 작성"
                hint="답변 완료를 누르면 예치 금액이 멘토 지갑으로 지급됩니다."
                right={
                  <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
                    <WalletCards className="h-3.5 w-3.5" aria-hidden />
                    답변 완료 즉시 지급
                  </span>
                }
              />
              <form action={answerDirectIndividualQuestionAction} encType="multipart/form-data" className="space-y-3">
                <input type="hidden" name="questionId" value={detail.id} />
                <textarea
                  name="body"
                  required
                  minLength={5}
                  rows={7}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm leading-7 text-slate-900 outline-none ring-blue-100 transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-4"
                  placeholder="학생에게 전달할 답변을 작성해 주세요."
                />
                <input
                  type="file"
                  name="attachment"
                  className="block w-full rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-600"
                />
                <div className="flex justify-end">
                  <FormSubmitButton
                    idleLabel="답변 완료"
                    pendingLabel="처리 중..."
                    className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-extrabold text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                  />
                </div>
              </form>
            </section>
          </>
        ) : null}

        <div className="mt-8 flex flex-wrap gap-2">
          <Link
            href={props.backHref}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-extrabold text-slate-700 hover:bg-slate-50"
          >
            ← {props.backLabel}
          </Link>
        </div>
      </article>
    </div>
  );
}
