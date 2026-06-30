"use client";

import "@/app/(public)/custom-request/landing.css";

import Link from "next/link";
import type { ReactNode } from "react";
import { Check, Download, Eye, Star } from "lucide-react";
import {
  CustomRequestCoreStrip,
  CustomRequestDetailDivider,
  CustomRequestSectionPane,
  fileExtensionLabel,
} from "@/components/customRequest/customRequestDetailLayout";
import { downloadCustomOrderDeliverableAction } from "@/lib/customRequest/orderDeliverableDownloadActions";
import type { OrderDetailPageData } from "@/lib/customRequest/orderDetailQueries";
import {
  formatOrderRoomDate,
  formatOrderRoomDateTime,
  orderEventKindLabelForUi,
  paymentStatusLabelForUi,
} from "@/lib/customRequest/orderLifecycleConstants";
import { shortOrderIdForDisplay } from "@/lib/utils/formatOrderIdForDisplay";

type Row = Record<string, unknown>;

type Props = {
  detail: OrderDetailPageData;
  orderId: string;
};

const ORDER_STEPS = ["작업 대기", "작업 중", "납품 완료", "주문 완료"] as const;

function pickString(row: Row | null | undefined, keys: readonly string[], fallback = "—"): string {
  if (!row) return fallback;
  for (const key of keys) {
    const value = row[key];
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number" && Number.isFinite(value)) return String(value);
  }
  return fallback;
}

function pickTimestamp(row: Row | null | undefined, keys: readonly string[]): unknown {
  if (!row) return null;
  for (const key of keys) {
    const value = row[key];
    if (value != null && String(value).trim()) return value;
  }
  return null;
}

function pickAmountLabel(order: Row | null, fallback: string): string {
  if (fallback && fallback !== "—") return fallback;
  for (const key of ["paid_amount", "total_amount", "agreed_price", "proposed_price", "price", "amount"] as const) {
    const value = order?.[key];
    if (typeof value === "number" && Number.isFinite(value)) {
      return `${value.toLocaleString("ko-KR")}캐시`;
    }
    if (typeof value === "string" && value.trim()) {
      const n = Number(value.replace(/[, ]/g, ""));
      if (Number.isFinite(n)) return `${n.toLocaleString("ko-KR")}캐시`;
      return value.trim();
    }
  }
  return "—";
}

function formatBytes(value: unknown): string {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) return "—";
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

function pickFileSize(row: Row | null): string {
  if (!row) return "—";
  for (const key of ["file_size", "file_size_bytes", "size_bytes", "size"] as const) {
    const value = row[key];
    if (typeof value === "number" && Number.isFinite(value)) return formatBytes(value);
  }
  return "—";
}

function hasDownloadableFile(row: Row | null): boolean {
  if (!row) return false;
  const path = pickString(row, ["storage_path", "file_path", "file_storage_path", "object_path", "file_url"], "");
  return Boolean(path && !path.startsWith("http://") && !path.startsWith("https://"));
}

function pickMentorId(order: Row | null, application: Row | null): string | null {
  const fromOrder = pickString(
    order,
    ["mentor_id", "selected_mentor_id", "assigned_mentor_id", "expert_id", "mentor_user_id"],
    ""
  );
  if (fromOrder) return fromOrder;
  const fromApplication = pickString(application, ["mentor_id", "applicant_id", "user_id", "proposer_id"], "");
  return fromApplication || null;
}

function BluePill({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex min-h-7 items-center rounded-full border border-[#bfdbfe] bg-[var(--c-blue-weak,#e9f0ff)] px-3 text-xs font-extrabold text-[#2563EB]">
      {children}
    </span>
  );
}

function NeutralPill({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex min-h-7 items-center rounded-full border border-[var(--c-border,#e2e8f2)] bg-white px-3 text-xs font-extrabold text-[var(--c-secondary,#3f4b5f)]">
      {children}
    </span>
  );
}

function SectionPaneWithAction(props: { title: string; hint?: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="cr-section-pane">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="cr-section-title-v5">
            <span className="bar" aria-hidden />
            {props.title}
          </h2>
          {props.hint ? <p className="cr-section-hint">{props.hint}</p> : null}
        </div>
        {props.action ? <div className="shrink-0">{props.action}</div> : null}
      </div>
      {props.children}
    </section>
  );
}

function CompleteStepper() {
  return (
    <div className="cr-stepper-shell mt-3 !mb-0">
      <div className="form-stepper-lifecycle">
        <ol aria-label="주문 완료 단계">
          {ORDER_STEPS.map((step, index) => {
            const current = index === ORDER_STEPS.length - 1;
            return (
              <li key={step} className={`step-item ${current ? "is-current" : "is-done"}`}>
                <span className="step-dot">✓</span>
                <span className="step-label">{step}</span>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}

function DeliverableSection(props: { orderId: string; deliverable: Row | null; submittedAtLabel: string }) {
  const id = String(props.deliverable?.id ?? "");
  const fileName = pickString(
    props.deliverable,
    ["original_filename", "file_name", "filename", "original_name"],
    "텍스트 납품"
  );
  const previewText = pickString(props.deliverable, ["note", "body", "content", "description"], "");
  const mimeType = pickString(props.deliverable, ["mime_type", "content_type"], "");
  const downloadable = Boolean(id && hasDownloadableFile(props.deliverable));

  return (
    <SectionPaneWithAction
      title="받은 결과물"
      hint="최종 납품 파일은 주문 완료 후에도 보관돼요"
      action={<BluePill>납품 완료</BluePill>}
    >
      {props.deliverable ? (
        <>
          <ul className="cr-file-list">
            <li className="cr-file-chip">
              <span className="cr-file-thumb" aria-hidden>
                {fileExtensionLabel(fileName, mimeType)}
              </span>
              <div className="cr-file-body">
                <p className="name">{fileName}</p>
                <p className="meta">
                  {pickFileSize(props.deliverable)} · {props.submittedAtLabel}
                </p>
              </div>
              <div className="cr-file-action">
                {downloadable ? (
                  <>
                    <form action={downloadCustomOrderDeliverableAction} target="_blank">
                      <input type="hidden" name="orderId" value={props.orderId} />
                      <input type="hidden" name="deliverableId" value={id} />
                      <button type="submit" className="btn btn-ghost !min-h-[40px] gap-1.5 !px-4 !py-2 !text-[13px]">
                        <Eye className="h-4 w-4" aria-hidden />
                        미리보기
                      </button>
                    </form>
                    <form action={downloadCustomOrderDeliverableAction}>
                      <input type="hidden" name="orderId" value={props.orderId} />
                      <input type="hidden" name="deliverableId" value={id} />
                      <button type="submit" className="btn btn-primary !min-h-[40px] gap-1.5 !px-4 !py-2 !text-[13px]">
                        <Download className="h-4 w-4" aria-hidden />
                        다운로드
                      </button>
                    </form>
                  </>
                ) : (
                  <>
                    <details className="rounded-xl border border-[var(--c-border,#e2e8f2)] bg-white px-3 py-2 text-sm font-bold text-[#0f172a]">
                      <summary className="cursor-pointer list-none">미리보기</summary>
                      <p className="mt-2 max-w-sm border-t border-[var(--c-border,#e2e8f2)] pt-2 text-xs font-semibold leading-relaxed text-[var(--c-secondary,#3f4b5f)]">
                        {previewText || "미리볼 텍스트 납품 내용이 없습니다."}
                      </p>
                    </details>
                    <button
                      type="button"
                      className="btn btn-ghost !min-h-[40px] gap-1.5 !px-4 !py-2 !text-[13px]"
                      disabled
                      title="이 납품에는 다운로드할 파일 경로가 없습니다."
                    >
                      <Download className="h-4 w-4" aria-hidden />
                      다운로드
                    </button>
                  </>
                )}
              </div>
            </li>
          </ul>
          <p className="cr-section-hint mt-2">결제가 완료된 주문이라 다운로드가 열려 있어요.</p>
        </>
      ) : (
        <p className="mt-3 rounded-xl border border-[var(--c-border,#e2e8f2)] bg-[var(--c-band,#f3f6fc)] px-4 py-4 text-sm font-semibold text-[var(--c-secondary,#3f4b5f)]">
          등록된 납품 파일이 없어요.
        </p>
      )}
    </SectionPaneWithAction>
  );
}

function PaymentReceipt(props: { method: string; paidAtLabel: string; statusLabel: string }) {
  return (
    <CustomRequestSectionPane title="결제 영수증" hint="학생 결제 내역만 표시돼요">
      <dl className="mt-3 grid gap-2 text-sm">
        <div className="flex items-center justify-between gap-4 rounded-xl border border-[var(--c-border,#e2e8f2)] bg-white px-4 py-3">
          <dt className="font-bold text-[var(--c-secondary,#3f4b5f)]">결제 수단</dt>
          <dd className="text-right font-extrabold text-[#0f172a]">{props.method}</dd>
        </div>
        <div className="flex items-center justify-between gap-4 rounded-xl border border-[var(--c-border,#e2e8f2)] bg-white px-4 py-3">
          <dt className="font-bold text-[var(--c-secondary,#3f4b5f)]">결제일시</dt>
          <dd className="text-right font-extrabold text-[#0f172a]">{props.paidAtLabel}</dd>
        </div>
        <div className="flex items-center justify-between gap-4 rounded-xl border border-[var(--c-border,#e2e8f2)] bg-white px-4 py-3">
          <dt className="font-bold text-[var(--c-secondary,#3f4b5f)]">결제 상태</dt>
          <dd className="text-right font-extrabold text-emerald-700">{props.statusLabel}</dd>
        </div>
      </dl>
    </CustomRequestSectionPane>
  );
}

function OrderInfoSection(props: {
  shortId: string;
  category: string;
  createdAtLabel: string;
  completedAtLabel: string;
}) {
  return (
    <SectionPaneWithAction title="주문 정보" action={<NeutralPill>완료</NeutralPill>}>
      <dl className="mt-3 grid gap-2 sm:grid-cols-2">
        <div className="rounded-xl border border-[var(--c-border,#e2e8f2)] bg-white px-4 py-3">
          <dt className="text-[11px] font-bold text-[var(--c-tertiary,#8a96a8)]">주문 번호</dt>
          <dd className="mt-1 break-words font-mono text-sm font-extrabold text-[#0f172a]">{props.shortId}</dd>
        </div>
        <div className="rounded-xl border border-[var(--c-border,#e2e8f2)] bg-white px-4 py-3">
          <dt className="text-[11px] font-bold text-[var(--c-tertiary,#8a96a8)]">카테고리</dt>
          <dd className="mt-1 text-sm font-extrabold text-[#0f172a]">{props.category}</dd>
        </div>
        <div className="rounded-xl border border-[var(--c-border,#e2e8f2)] bg-white px-4 py-3">
          <dt className="text-[11px] font-bold text-[var(--c-tertiary,#8a96a8)]">주문일</dt>
          <dd className="mt-1 text-sm font-extrabold text-[#0f172a]">{props.createdAtLabel}</dd>
        </div>
        <div className="rounded-xl border border-[var(--c-border,#e2e8f2)] bg-white px-4 py-3">
          <dt className="text-[11px] font-bold text-[var(--c-tertiary,#8a96a8)]">완료일</dt>
          <dd className="mt-1 text-sm font-extrabold text-[#0f172a]">{props.completedAtLabel}</dd>
        </div>
      </dl>
    </SectionPaneWithAction>
  );
}

function ConversationSummary(props: { messages: Row[] }) {
  return (
    <CustomRequestSectionPane title="주문방 대화 기록">
      <details className="mt-3 rounded-xl border border-[var(--c-border,#e2e8f2)] bg-[var(--c-band,#f3f6fc)] px-4 py-3">
        <summary className="cursor-pointer list-none text-sm font-extrabold text-[#2563EB]">
          대화 {props.messages.length.toLocaleString("ko-KR")}건 · 대화 보기
        </summary>
        <div className="mt-3 space-y-2 border-t border-[var(--c-border,#e2e8f2)] pt-3">
          {props.messages.length > 0 ? (
            props.messages.slice(-5).map((message, index) => {
              const body = pickString(message, ["body", "message", "content"], "메시지");
              const at = formatOrderRoomDateTime(pickTimestamp(message, ["created_at", "updated_at"]));
              return (
                <div key={`${String(message.id ?? index)}-${index}`} className="rounded-lg bg-white px-3 py-2">
                  <p className="line-clamp-2 text-sm font-semibold text-[#0f172a]">{body}</p>
                  <p className="mt-1 text-[11px] font-medium text-[var(--c-tertiary,#8a96a8)]">{at}</p>
                </div>
              );
            })
          ) : (
            <p className="text-sm font-semibold text-[var(--c-secondary,#3f4b5f)]">저장된 대화가 아직 없어요.</p>
          )}
        </div>
      </details>
    </CustomRequestSectionPane>
  );
}

function RevisionSummary(props: { revisions: Row[] }) {
  return (
    <CustomRequestSectionPane title="수정 요청 내역" hint="파일 수정 요청은 최대 2회까지 가능해요">
      {props.revisions.length > 0 ? (
        <ul className="mt-3 space-y-2">
          {props.revisions.map((revision, index) => {
            const body = pickString(revision, ["request_note", "note", "body", "message", "content"], "수정 요청");
            const at = formatOrderRoomDateTime(pickTimestamp(revision, ["created_at", "updated_at"]));
            return (
              <li
                key={`${String(revision.id ?? index)}-${index}`}
                className="rounded-xl border border-[var(--c-border,#e2e8f2)] bg-white px-4 py-3"
              >
                <p className="text-sm font-bold text-[#0f172a]">{body}</p>
                <p className="mt-1 text-[11px] font-medium text-[var(--c-tertiary,#8a96a8)]">{at}</p>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="mt-3 rounded-xl border border-[var(--c-border,#e2e8f2)] bg-[var(--c-band,#f3f6fc)] px-4 py-4 text-sm font-bold text-[var(--c-secondary,#3f4b5f)]">
          수정 요청 없이 완료됐어요.
        </p>
      )}
    </CustomRequestSectionPane>
  );
}

function CompletionGuide(props: { events: Row[] }) {
  return (
    <CustomRequestSectionPane title="완료 후 안내">
      <ul className="cr-guide-list">
        <li>납품 파일은 주문방에서 다시 내려받을 수 있어요.</li>
        <li>결제 내역은 학생용 영수증 기준으로 표시됩니다.</li>
        <li>멘토에게 남긴 후기는 멘토 프로필에 반영돼요.</li>
      </ul>
      <details className="mt-4 rounded-xl border border-[var(--c-border,#e2e8f2)] bg-white px-4 py-3">
        <summary className="cursor-pointer list-none text-sm font-extrabold text-[#2563EB]">진행 로그 열기</summary>
        <ol className="mt-3 space-y-2 border-t border-[var(--c-border,#e2e8f2)] pt-3">
          {props.events.length > 0 ? (
            props.events.map((event, index) => {
              const kind = pickString(event, ["kind", "event_type", "type", "status"], "기록");
              const label = orderEventKindLabelForUi(kind);
              const at = formatOrderRoomDateTime(pickTimestamp(event, ["created_at", "updated_at"]));
              return (
                <li key={`${String(event.id ?? index)}-${index}`} className="flex gap-3 rounded-lg bg-[var(--c-band,#f3f6fc)] px-3 py-2">
                  <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[#2563EB]" />
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-[#0f172a]">{label}</p>
                    <p className="mt-0.5 text-[11px] font-medium text-[var(--c-tertiary,#8a96a8)]">{at}</p>
                  </div>
                </li>
              );
            })
          ) : (
            <li className="text-sm font-semibold text-[var(--c-secondary,#3f4b5f)]">표시할 진행 로그가 아직 없어요.</li>
          )}
        </ol>
      </details>
    </CustomRequestSectionPane>
  );
}

export function StudentOrderCompleteView({ detail, orderId }: Props) {
  const order = detail.bundle.order.row as Row | null;
  const application = detail.application.row as Row | null;
  const deliverables = (detail.bundle.deliverables.rows ?? []) as Row[];
  const latestDeliverable = (detail.latestDeliverable as Row | null) ?? deliverables[0] ?? null;
  const messages = (detail.messages.rows ?? []) as Row[];
  const revisions = (detail.revisions.rows ?? []) as Row[];
  const events = (detail.events.rows ?? []) as Row[];
  const resolvedOrderId = pickString(order, ["id"], orderId);
  const shortId = shortOrderIdForDisplay(resolvedOrderId);
  const completedAtRaw = pickTimestamp(order, ["completed_at", "closed_at", "finished_at", "accepted_at"]);
  const createdAtRaw = pickTimestamp(order, ["created_at", "opened_at", "started_at"]);
  const paidAtRaw = pickTimestamp(order, ["paid_at", "payment_completed_at", "payment_paid_at"]);
  const deliveredAtRaw = pickTimestamp(latestDeliverable, ["submitted_at", "created_at", "updated_at"]);
  const amountLabel = pickAmountLabel(order, detail.header.priceLine);
  const paymentRaw = pickString(order, ["payment_status", "payment_state", "pay_status"], "paid");
  const paymentLabel = paymentStatusLabelForUi(paymentRaw);
  const paymentMethod = pickString(order, ["payment_method", "payment_provider", "pay_method"], "캐시");
  const mentorId = pickMentorId(order, application);
  const mentorLabel = `${detail.header.mentorName || "—"} 멘토`;
  const completedAtLabel = formatOrderRoomDate(completedAtRaw);
  const reviewHref = mentorId ? `/mentors/${encodeURIComponent(mentorId)}#reviews` : "/mentors";

  return (
    <div className="cr-landing cr-detail-v5 cr-detail-shell py-3" data-views="custom-order-room-complete">
      <article className="cr-detail-card">
        <header className="cr-detail-header">
          <span className="eyebrow">맞춤의뢰</span>
          <div className="cr-detail-header-row">
            <h1 className="cr-detail-title">거래가 완료됐어요</h1>
            <span className="cr-category-badge">완료</span>
          </div>
          <p className="cr-detail-subtitle">
            <span className="md:hidden">결과물·영수증을 한곳에서 확인하세요.</span>
            <span className="hidden md:inline">요청한 작업이 마무리됐어요. 받은 결과물과 결제 영수증, 진행 기록을 한곳에서 확인할 수 있어요.</span>
          </p>
          <span className="mt-4 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-extrabold text-slate-700">
            <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-slate-900 text-white" aria-hidden>
              <Check className="h-3 w-3" strokeWidth={3} />
            </span>
            결제 · 납품 · 정산이 모두 마무리됐어요
          </span>
        </header>

        <CustomRequestCoreStrip
          items={[
            { label: "결제 금액", value: amountLabel },
            { label: "완료일", value: completedAtLabel },
            { label: "담당 멘토", value: mentorLabel },
          ]}
        />

        <CustomRequestDetailDivider />

        <CustomRequestSectionPane title="진행 단계" hint="작업 흐름이 모두 마무리됐어요">
          <CompleteStepper />
        </CustomRequestSectionPane>

        <CustomRequestDetailDivider />

        <DeliverableSection
          orderId={resolvedOrderId}
          deliverable={latestDeliverable}
          submittedAtLabel={formatOrderRoomDateTime(deliveredAtRaw)}
        />

        <CustomRequestDetailDivider />

        <PaymentReceipt
          method={paymentMethod}
          paidAtLabel={formatOrderRoomDateTime(paidAtRaw ?? completedAtRaw)}
          statusLabel={paymentLabel !== "—" ? paymentLabel : "결제 완료"}
        />

        <CustomRequestDetailDivider />

        <OrderInfoSection
          shortId={shortId}
          category={detail.header.category && detail.header.category !== "—" ? detail.header.category : "—"}
          createdAtLabel={formatOrderRoomDate(createdAtRaw)}
          completedAtLabel={completedAtLabel}
        />

        <CustomRequestDetailDivider />

        <ConversationSummary messages={messages} />

        <CustomRequestDetailDivider />

        <RevisionSummary revisions={revisions} />

        <CustomRequestDetailDivider />

        <CompletionGuide events={events} />

        <div className="cr-detail-footer">
          <Link href="/custom-request/orders" className="btn btn-ghost">
            ← 맞춤의뢰 목록으로 돌아가기
          </Link>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Link href="/support" className="btn btn-ghost">
              문제 해결 신청
            </Link>
            <Link href={reviewHref} className="btn btn-primary">
              <Star className="h-4 w-4" aria-hidden />
              후기 작성하기
            </Link>
          </div>
        </div>
      </article>
    </div>
  );
}
