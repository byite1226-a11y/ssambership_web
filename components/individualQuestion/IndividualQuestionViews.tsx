import Link from "next/link";
import type { ReactNode } from "react";
import { CheckCircle2, Clock, Inbox, MessageSquareText, Paperclip, Sparkles, WalletCards } from "lucide-react";
import { FormSubmitButton } from "@/components/qna/FormSubmitButton";
import { EmptyState } from "@/components/common/EmptyState";
import { listCardClassName, type ListCardTone } from "@/components/design-system/ListCard";
import { getSubjectLabel } from "@/lib/subjects/subjectCatalog";
import {
  claimOpenIndividualQuestionAction,
  confirmIndividualQuestionAnswerAction,
  confirmIndividualQuestionAnswerByMentorAction,
  sendIndividualQuestionMessageAction,
} from "@/lib/individualQuestion/individualQuestionActions";
import {
  formatIndividualQuestionDate,
  formatIndividualQuestionExpiryRemaining,
  formatIndividualQuestionPrice,
  individualQuestionStatusBadgeClass,
  individualQuestionStatusLabel,
  individualQuestionTypeLabel,
  isIndividualQuestionExpiringSoon,
  type IndividualQuestionDetail,
  type IndividualQuestionListItem,
  type OpenIndividualQuestionBrowseRow,
} from "@/lib/individualQuestion/individualQuestionQueries";

// 개별질문 상태 → 목록 카드 좌측 액센트 톤(상태 배지 색과 일치).
function iqCardTone(status: string | null | undefined): ListCardTone {
  switch ((status ?? "").toLowerCase()) {
    case "released":
      return "blue";
    case "answered":
      return "green";
    case "open":
    case "assigned":
    case "claimed":
    case "escrowed":
      return "amber";
    default:
      return "neutral"; // refunded / expired / canceled
  }
}

/** 멘토 개별질문 요약 스트립 — 답변 대기 / 진행 중 / 이번 달 완료 (숫자는 목록 데이터로 계산). */
export function MentorIndividualQuestionSummaryStrip(props: {
  waiting: number;
  inProgress: number;
  doneThisMonth: number;
}) {
  const cells = [
    { label: "답변 대기", value: props.waiting, color: "text-amber-600" },
    { label: "진행 중", value: props.inProgress, color: "text-blue-700" },
    { label: "이번 달 완료", value: props.doneThisMonth, color: "text-[#059669]" },
  ];
  return (
    <div className="mb-6 grid grid-cols-3 gap-3">
      {cells.map((c) => (
        <div key={c.label} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-center">
          <p className={`text-2xl font-black tabular-nums ${c.color}`}>{c.value}</p>
          <p className="mt-0.5 text-xs font-bold text-slate-500">{c.label}</p>
        </div>
      ))}
    </div>
  );
}

function ExpiringSoonBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-rose-100 bg-rose-50 px-2.5 py-1 text-xs font-extrabold text-rose-600">
      <Clock className="h-3 w-3" aria-hidden />
      마감 임박
    </span>
  );
}

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
      <EmptyState compact icon={<Inbox className="h-5 w-5" aria-hidden />} title={props.emptyTitle} description={props.emptyDescription} />
    );
  }

  return (
    <div className="grid gap-4">
      {props.rows.map((row) => {
        const counterpart = props.counterpartLabel === "멘토" ? row.mentorName : row.studentName;
        const expiringSoon = isIndividualQuestionExpiringSoon(row.expires_at, row.status);
        const remainingLabel = formatIndividualQuestionExpiryRemaining(row.expires_at, row.status);
        return (
          <Link
            key={row.id}
            href={`${props.detailBaseHref}/${row.id}`}
            className={listCardClassName(iqCardTone(row.status), true, "group block")}
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <IndividualQuestionStatusBadge status={row.status} />
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">
                    {individualQuestionTypeLabel(row.question_type)}
                  </span>
                  {row.subject ? (
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">
                      {getSubjectLabel(row.subject)}
                      {row.topic ? ` · ${row.topic}` : ""}
                    </span>
                  ) : null}
                  <span className="text-xs font-bold text-slate-900">{formatIndividualQuestionPrice(row.price_cents)} 예치</span>
                  {expiringSoon ? <ExpiringSoonBadge /> : null}
                </div>
                <h2 className="mt-2 truncate text-lg font-black text-slate-900 group-hover:text-blue-700">{row.title}</h2>
                <p className="mt-1 line-clamp-2 text-sm leading-6 text-slate-600">{row.body}</p>
                {remainingLabel ? (
                  <p className={`mt-2 text-xs font-bold ${expiringSoon ? "text-rose-600" : "text-slate-500"}`}>{remainingLabel}</p>
                ) : null}
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

export function OpenIndividualQuestionBrowseCards(props: {
  rows: OpenIndividualQuestionBrowseRow[];
  error?: string | null;
}) {
  if (props.error) {
    return (
      <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-900">
        공개 질문 목록을 불러오지 못했습니다. {props.error}
      </p>
    );
  }

  if (props.rows.length === 0) {
    return (
      <EmptyState
        compact
        icon={<Sparkles className="h-5 w-5" aria-hidden />}
        title="답변할 수 있는 공개 질문이 없습니다"
        description="학생이 공개형 질문을 등록하면 이곳에 표시됩니다. 단가를 설정해 두면 지정 질문도 받을 수 있어요."
        action={
          <Link
            href="/mentor/profile/edit"
            className="inline-flex items-center rounded-xl bg-[#1A56DB] px-4 py-2 text-sm font-extrabold text-white hover:bg-[#1648c0]"
          >
            단가 설정
          </Link>
        }
      />
    );
  }

  return (
    <div className="grid gap-4">
      {props.rows.map((row) => {
        const expiringSoon = isIndividualQuestionExpiringSoon(row.expires_at, "open");
        const remainingLabel = formatIndividualQuestionExpiryRemaining(row.expires_at, "open");
        return (
          <article key={row.id} className={listCardClassName("amber", false)}>
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-amber-100 bg-amber-50 px-2.5 py-1 text-xs font-extrabold text-amber-700">
                    공개중
                  </span>
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">학생 신원 비공개</span>
                  <span className="text-xs font-bold text-slate-900">{formatIndividualQuestionPrice(row.price_cents)} 예치</span>
                  {expiringSoon ? <ExpiringSoonBadge /> : null}
                </div>
                <h2 className="mt-2 text-lg font-black text-slate-900">{row.title}</h2>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  본문과 첨부는 답변을 맡은 뒤에만 열람할 수 있어요.
                </p>
                <div className="mt-3 flex flex-wrap gap-2 text-xs font-bold text-slate-500">
                  {row.subject ? <span className="rounded-full bg-slate-100 px-2.5 py-1">과목 {getSubjectLabel(row.subject)}</span> : null}
                  {row.topic ? <span className="rounded-full bg-slate-100 px-2.5 py-1">단원 {row.topic}</span> : null}
                  <span className="rounded-full bg-slate-100 px-2.5 py-1">등록 {formatIndividualQuestionDate(row.created_at)}</span>
                  {remainingLabel ? (
                    <span className={`rounded-full px-2.5 py-1 ${expiringSoon ? "bg-rose-50 text-rose-600" : "bg-slate-100"}`}>
                      {remainingLabel}
                    </span>
                  ) : null}
                </div>
              </div>
              <form action={claimOpenIndividualQuestionAction} className="shrink-0">
                <input type="hidden" name="questionId" value={row.id} />
                <FormSubmitButton
                  idleLabel="답변하기"
                  pendingLabel="확인 중..."
                  className="w-full rounded-xl bg-blue-600 px-5 py-3 text-sm font-extrabold text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60 lg:w-auto"
                />
              </form>
            </div>
          </article>
        );
      })}
    </div>
  );
}

type IqAttachment = IndividualQuestionDetail["attachments"][number];

function isImageAttachment(att: IqAttachment): boolean {
  const mime = (att.mime_type ?? "").toLowerCase();
  if (mime.startsWith("image/")) return true;
  return /\.(png|jpe?g|webp|gif)$/i.test(att.file_name ?? "");
}

// 첨부 인라인 렌더 — 이미지는 썸네일(클릭 확대), 그 외는 파일칩. 질문 카드·메시지 버블 공용.
function AttachmentInline(props: { attachments: IqAttachment[] }) {
  if (props.attachments.length === 0) return null;
  return (
    <div className="mt-2 flex flex-wrap gap-2">
      {props.attachments.map((att) =>
        !att.signedUrl ? (
          <span key={att.id} className="rounded-lg bg-white/70 px-2.5 py-1.5 text-xs font-semibold text-slate-400">
            열람 불가
          </span>
        ) : isImageAttachment(att) ? (
          <Link key={att.id} href={att.signedUrl} target="_blank" rel="noreferrer" className="block">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={att.signedUrl}
              alt={att.file_name || "첨부 이미지"}
              className="max-h-48 rounded-xl border border-slate-200 bg-white object-contain"
            />
          </Link>
        ) : (
          <Link
            key={att.id}
            href={att.signedUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-w-0 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-extrabold text-slate-800 hover:bg-slate-50"
          >
            <Paperclip className="h-4 w-4 shrink-0 text-blue-600" aria-hidden />
            <span className="max-w-[180px] truncate">{att.file_name || "첨부 파일"}</span>
          </Link>
        )
      )}
    </div>
  );
}

export function IndividualQuestionDetailView(props: {
  detail: IndividualQuestionDetail;
  backHref: string;
  backLabel: string;
  actor: "student" | "mentor";
  flash?: string | null;
  warning?: string | null;
  transfer?: { roomId: string | null; threadId: string | null; transferredAt?: string | null } | null;
}) {
  const { detail, actor } = props;
  const transferThreadHref =
    props.transfer?.roomId && props.transfer?.threadId
      ? `/question-room/${props.transfer.roomId}/thread/${props.transfer.threadId}`
      : null;
  const counterpartName = actor === "student" ? detail.mentorName : detail.studentName;
  const counterpartLabel = actor === "student" ? (detail.question_type === "open" ? "답변 멘토" : "담당 멘토") : "학생";

  // 질문 자체 첨부(message_id 없음)와 메시지별 첨부 분리.
  const questionAttachments = detail.attachments.filter((a) => !a.message_id);
  const attachmentsByMessage = new Map<string, IqAttachment[]>();
  for (const att of detail.attachments) {
    if (!att.message_id) continue;
    const list = attachmentsByMessage.get(att.message_id) ?? [];
    list.push(att);
    attachmentsByMessage.set(att.message_id, list);
  }

  const status = (detail.status ?? "").toLowerCase();
  const terminal = status === "released" || status === "refunded" || status === "expired" || status === "canceled";
  const canCompose = !terminal;
  const canMentorConfirm = actor === "mentor" && (status === "assigned" || status === "claimed");
  const canStudentConfirm = actor === "student" && status === "answered";
  const answeredWaiting = actor === "mentor" && status === "answered";

  return (
    <div className="cr-landing cr-detail-v5 cr-detail-shell mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
      <article className="cr-detail-card">
        <header className="cr-detail-header">
          <span className="eyebrow">개별 질문</span>
          <div className="cr-detail-header-row">
            <h1 className="cr-detail-title">{detail.title}</h1>
            <IndividualQuestionStatusBadge status={detail.status} />
          </div>
          <p className="cr-detail-subtitle">구독 질문권과 별개로 캐시를 예치해 진행하는 단건 질문입니다.</p>
        </header>

        {props.flash ? (
          <p className="mb-4 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-bold text-blue-900">{props.flash}</p>
        ) : null}
        {props.warning ? (
          <p className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-900">{props.warning}</p>
        ) : null}

        {props.transfer ? (
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3">
            <p className="text-sm font-bold text-blue-900">
              이 개별 질문은 구독 질문방으로 이어졌어요. 이어서 대화하려면 구독 질문방에서 확인하세요.
            </p>
            {transferThreadHref ? (
              <Link
                href={transferThreadHref}
                className="shrink-0 rounded-lg border border-blue-200 bg-white px-3 py-1.5 text-xs font-extrabold text-blue-700 hover:bg-blue-100"
              >
                구독 질문방에서 보기 →
              </Link>
            ) : null}
          </div>
        ) : null}

        {/* 질문 카드 — 본문·첨부 미리보기를 상단에 고정해 대화 중에도 보이게 */}
        <section className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-extrabold text-blue-700">질문 내용</span>
            <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-slate-500">
              <span className="rounded-full bg-slate-100 px-2.5 py-1">{counterpartLabel} {counterpartName}</span>
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-900">예치 {formatIndividualQuestionPrice(detail.price_cents)}</span>
            </div>
          </div>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-700">{detail.body}</p>
          <div className="mt-3 flex flex-wrap gap-2 text-xs font-bold text-slate-500">
            {detail.subject ? <span className="rounded-full bg-slate-100 px-2.5 py-1">과목 {getSubjectLabel(detail.subject)}</span> : null}
            {detail.topic ? <span className="rounded-full bg-slate-100 px-2.5 py-1">단원 {detail.topic}</span> : null}
            <span className="rounded-full bg-slate-100 px-2.5 py-1">등록 {formatIndividualQuestionDate(detail.created_at)}</span>
          </div>
          <AttachmentInline attachments={questionAttachments} />
        </section>

        <hr className="cr-detail-divider" />

        {/* 대화 스레드 */}
        <section>
          <SectionTitle
            title="대화"
            hint={detail.messages.length > 0 ? "멘토와 학생이 주고받은 메시지입니다." : "아직 메시지가 없어요. 첫 메시지를 보내 보세요."}
            right={
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-3 py-1 text-xs font-bold text-slate-600">
                <MessageSquareText className="h-3.5 w-3.5" aria-hidden />
                {detail.messages.length}건
              </span>
            }
          />
          {detail.messages.length > 0 ? (
            <ol className="space-y-3">
              {detail.messages.map((message) => {
                const mine = message.authorRole === actor;
                const atts = attachmentsByMessage.get(message.id) ?? [];
                const initial = (message.authorName.trim().charAt(0) || (message.authorRole === "mentor" ? "멘" : "학")).toUpperCase();
                return (
                  <li key={message.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                    <div className={`flex max-w-[82%] gap-2 ${mine ? "flex-row-reverse" : "flex-row"}`}>
                      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-black text-slate-600">
                        {mine ? "나" : initial}
                      </span>
                      <div className="min-w-0">
                        <div className={`rounded-2xl px-4 py-3 ${mine ? "bg-blue-600 text-white" : "border border-slate-200 bg-white text-slate-700"}`}>
                          <p className="whitespace-pre-wrap text-sm leading-7">{message.body}</p>
                          <AttachmentInline attachments={atts} />
                        </div>
                        <p className={`mt-1 text-[11px] font-semibold text-slate-400 ${mine ? "text-right" : "text-left"}`}>
                          {mine ? "나" : message.authorName} · {formatIndividualQuestionDate(message.created_at)}
                        </p>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ol>
          ) : (
            <p className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
              {actor === "mentor" ? "학생 질문을 확인하고 답변을 보내 보세요." : "멘토 답변을 기다리고 있어요. 추가로 설명할 내용이 있으면 메시지를 보내세요."}
            </p>
          )}
        </section>

        {/* 메시지 입력바 — 멘토·학생 공통(서버가 작성자 판별) */}
        {canCompose ? (
          <>
            <hr className="cr-detail-divider" />
            <form action={sendIndividualQuestionMessageAction} className="space-y-2">
              <input type="hidden" name="questionId" value={detail.id} />
              <textarea
                name="body"
                rows={4}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm leading-7 text-slate-900 outline-none ring-blue-100 transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-4"
                placeholder={actor === "mentor" ? "학생에게 보낼 답변·메시지를 작성하세요." : "멘토에게 보낼 메시지를 작성하세요."}
              />
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className="inline-flex cursor-pointer items-center gap-2 text-xs font-bold text-slate-600">
                  <Paperclip className="h-4 w-4 text-blue-600" aria-hidden />
                  <span>파일 첨부</span>
                  <input
                    type="file"
                    name="attachment"
                    accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf"
                    className="block max-w-[200px] text-xs text-slate-500"
                  />
                </label>
                <FormSubmitButton
                  idleLabel="보내기"
                  pendingLabel="전송 중..."
                  className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-extrabold text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                />
              </div>
            </form>
          </>
        ) : null}

        {/* 멘토 답변 확정 */}
        {canMentorConfirm ? (
          <>
            <hr className="cr-detail-divider" />
            <div className="rounded-2xl border border-blue-200 bg-blue-50/60 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-bold text-slate-700">답변을 모두 작성했다면 확정해 학생 확인을 요청하세요.</p>
                <span className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-xs font-bold text-blue-700">
                  <WalletCards className="h-3.5 w-3.5" aria-hidden />
                  학생 확정 시 지급
                </span>
              </div>
              <form action={confirmIndividualQuestionAnswerByMentorAction} className="mt-3 flex justify-end">
                <input type="hidden" name="questionId" value={detail.id} />
                <FormSubmitButton
                  idleLabel="답변 확정"
                  pendingLabel="처리 중..."
                  className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-extrabold text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                />
              </form>
            </div>
          </>
        ) : null}

        {answeredWaiting ? (
          <p className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50/60 px-4 py-3 text-sm font-bold text-emerald-800">
            답변을 확정했어요. 학생이 [해결됨]을 누르면 예치 금액이 지급됩니다. 보충 설명은 계속 보낼 수 있어요.
          </p>
        ) : null}

        {/* 학생 해결됨(확정 → 지급) */}
        {canStudentConfirm ? (
          <>
            <hr className="cr-detail-divider" />
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm leading-6 text-slate-700">
                  멘토가 답변을 확정했어요. 도움이 되었다면 [해결됨]을 눌러 주세요. 확정 전까지 예치 캐시는 보관됩니다.
                </p>
                <span className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-xs font-bold text-emerald-700">
                  <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
                  확정 시 지급
                </span>
              </div>
              <form action={confirmIndividualQuestionAnswerAction} className="mt-3 flex justify-end">
                <input type="hidden" name="questionId" value={detail.id} />
                <FormSubmitButton
                  idleLabel="해결됨 (답변 확정)"
                  pendingLabel="확정 처리 중..."
                  className="rounded-xl bg-emerald-600 px-5 py-3 text-sm font-extrabold text-white shadow-sm hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                />
              </form>
            </div>
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
