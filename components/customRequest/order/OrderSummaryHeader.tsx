import Link from "next/link";
import type { OrderDetailPageData } from "@/lib/customRequest/orderDetailQueries";
import {
  isOrderRowPaymentConfirmedForMentorWork,
  isOrderRowTerminalForActions,
  isOrderStatusTerminal,
  ORDER_ROOM_CARD_CLASS,
  ORDER_ROOM_TERMINAL_MENTOR_NOTICE,
  ORDER_ROOM_TERMINAL_STUDENT_NOTICE,
  ORDER_WORKSPACE_STEP_LABELS,
  formatOrderRoomDateTime,
  normalizedPrimaryOrderStatus,
  orderWorkspaceCurrentStepIndex,
} from "@/lib/customRequest/orderLifecycleConstants";
import { confirmStudentCustomOrderPaymentAction } from "@/lib/customRequest/orderStudentActions";
import type { AppRole } from "@/lib/types/user";
import { OrderStatusBadge, PaymentStatusBadge } from "@/components/customRequest/order/OrderStatusBadge";
import { shortOrderIdForDisplay } from "@/lib/utils/formatOrderIdForDisplay";

type View = "student" | "mentor";

/** active 분쟁 시 OrderStatusBadge 대신 — 주문 row의 norm과 무관하게 동일 문구 */
function ActiveDisputeOrderStatusBadge() {
  return (
    <span
      className="inline-flex max-w-full items-center rounded-full border border-amber-300/90 bg-amber-100 px-2.5 py-0.5 text-xs font-semibold leading-tight text-amber-950"
      title="진행 중인 분쟁이 있어 주문 단계 칩보다 우선 표시됩니다."
    >
      분쟁 검토 중
    </span>
  );
}

function pickPaymentStatusRaw(row: Record<string, unknown> | null | undefined): string {
  if (!row) return "";
  for (const k of ["payment_status", "payment_state"] as const) {
    const v = row[k];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return "";
}

function paymentSettlementNotice(detail: OrderDetailPageData, orderRow: Record<string, unknown>): string[] {
  const lines: string[] = [];
  if (detail.hasActiveDispute) {
    lines.push("분쟁 처리 중에는 정산이 보류됩니다.");
  }
  const pay = pickPaymentStatusRaw(orderRow);
  const norm = normalizedPrimaryOrderStatus(orderRow);
  const isCompleted = norm === "completed" || (norm ? isOrderStatusTerminal(norm) : false);

  if (isCompleted) {
    lines.push("납품 수락이 완료되어 정산 예정 단계로 이동했습니다.");
    return lines;
  }

  if (pay === "paid" || pay === "succeeded" || pay === "escrowed" || pay === "complete" || pay === "completed") {
    lines.push("결제 확인이 완료된 주문입니다.");
  } else if (pay === "pending" || pay === "unpaid" || pay === "") {
    lines.push("결제 확인 전 주문입니다. 실제 결제 연동 전까지는 테스트 흐름으로 진행됩니다.");
  } else {
    lines.push("결제·주문 확정 단계를 진행 중입니다.");
  }
  return lines;
}

/** 우측 [정산] 열: 표시할 카드가 하나라도 있으면 true */
export function hasRightSettlementBlockContent(
  detail: OrderDetailPageData,
  orderRow: Record<string, unknown>,
  actorRole?: AppRole
): boolean {
  if (detail.settlementLoadError) {
    return true;
  }
  if (detail.settlementItem) {
    return true;
  }
  if (
    actorRole === "student" &&
    !isOrderRowTerminalForActions(orderRow) &&
    !isOrderRowPaymentConfirmedForMentorWork(orderRow)
  ) {
    return true;
  }
  return paymentSettlementNotice(detail, orderRow).length > 0;
}

function formatKrwWon(n: unknown): string {
  if (n == null) return "—";
  if (typeof n === "number" && Number.isFinite(n)) {
    return `${n.toLocaleString("ko-KR", { maximumFractionDigits: 0 })}원`;
  }
  const t = String(n).trim().replace(/[, ]/g, "");
  const v = Number(t);
  if (Number.isFinite(v)) {
    return `${v.toLocaleString("ko-KR", { maximumFractionDigits: 0 })}원`;
  }
  return "—";
}

function firstAmountish(row: Record<string, unknown>, keys: readonly string[]): unknown {
  for (const k of keys) {
    const v = row[k];
    if (v == null) continue;
    if (typeof v === "number" && Number.isFinite(v)) {
      return v;
    }
    if (typeof v === "string" && v.trim()) {
      return v;
    }
  }
  return null;
}

type HeaderProps = {
  detail: OrderDetailPageData;
  view: View;
};

/**
 * 주문방 상단: PageScaffold 아래, 큰 히어로가 아닌 한 줄짜리 제목/맥락
 */
export function OrderSummaryHeader({ detail, view }: HeaderProps) {
  const h = detail.header;
  const o = detail.bundle.order;

  if (o.error && !o.row) {
    return (
      <div className="rounded-2xl border border-amber-200/80 bg-amber-50/90 p-3 text-sm text-amber-950 sm:p-4">
        <h2 className="font-extrabold">주문 요약</h2>
        <p className="mt-2">정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.</p>
      </div>
    );
  }

  if (!o.row) {
    return (
      <div className="rounded-2xl border border-slate-200/80 bg-slate-50 p-3 text-sm text-slate-700 sm:p-4">
        <h2 className="font-extrabold">주문 요약</h2>
        <p className="mt-2">해당 주문을 찾을 수 없습니다.</p>
      </div>
    );
  }

  return (
    <header className="min-w-0">
      <p className="text-xs font-medium uppercase tracking-wide text-blue-600/90">맞춤의뢰 주문</p>
      <div className="mt-1.5 flex flex-wrap items-end justify-between gap-2">
        <h1 className="line-clamp-2 min-w-0 text-pretty text-lg font-bold leading-snug text-slate-900 sm:text-xl">
          {h.requestTitle}
        </h1>
        <span className="shrink-0 rounded-full border border-slate-200/80 bg-white/90 px-2.5 py-0.5 text-xs font-medium text-slate-600">
          {view === "mentor" ? "멘토" : "의뢰자"} 작업
        </span>
      </div>
      <p className="mt-1.5 line-clamp-2 text-sm text-slate-500">
        {h.category && h.category !== "—" ? h.category : "—"} · {h.subjectLine}
      </p>
    </header>
  );
}

type OrderRoomPageHeaderProps = {
  detail: OrderDetailPageData;
  view: View;
  /** 뒤로가기(기본: 맞춤의뢰 목록) */
  backHref?: string;
};

/**
 * 주문방 전용(학생/멘토 별도 마크업): 슬림 컨텍스트 바 + 핵심 한 줄(멘토·금액·범위·납기)
 */
export function OrderRoomPageHeader({ detail, view, backHref = "/custom-request" }: OrderRoomPageHeaderProps) {
  const h = detail.header;
  const o = detail.bundle.order;

  if (o.error && !o.row) {
    return (
      <div className="rounded-2xl border border-amber-200/80 bg-amber-50/90 p-3 text-sm text-amber-950 sm:p-4">
        <h2 className="font-extrabold">주문 요약</h2>
        <p className="mt-2">정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.</p>
      </div>
    );
  }

  if (!o.row) {
    return (
      <div className="rounded-2xl border border-slate-200/80 bg-slate-50 p-3 text-sm text-slate-700 sm:p-4">
        <h2 className="font-extrabold">주문 요약</h2>
        <p className="mt-2">해당 주문을 찾을 수 없습니다.</p>
      </div>
    );
  }

  const orderRow = o.row as Record<string, unknown>;
  const orderNorm = normalizedPrimaryOrderStatus(orderRow);
  const payRaw = (() => {
    for (const k of ["payment_status", "payment_state"] as const) {
      const v = orderRow[k];
      if (typeof v === "string" && v.trim()) return v.trim();
    }
    return "";
  })();

  const oneLineContext = (() => {
    const m = h.mentorName && h.mentorName !== "—" ? h.mentorName : "—";
    const p = h.priceLine && h.priceLine !== "—" ? h.priceLine : "—";
    const scope = h.subjects && h.subjects !== "—" ? h.subjects : null;
    const due = h.dueLine && h.dueLine !== "—" ? h.dueLine : "—";
    const base = `멘토 ${m} · ${p} · 마감 ${due}`;
    return scope != null && scope ? `${base} · 범위 ${scope}` : base;
  })();

  const detailLine =
    h.category && h.category !== "—" ? `${h.category} · ${h.subjectLine !== "—" ? h.subjectLine : "—"}` : h.subjectLine;

  if (view === "student") {
    return (
      <header className="rounded-2xl border border-slate-100 bg-white p-5 sm:p-6 mb-5 shadow-sm transition">
        {detail.hasActiveDispute ? (
          <div
            role="status"
            className="mb-3 rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-xs font-semibold leading-snug text-amber-950"
          >
            분쟁이 접수되어 운영 검토 중입니다. 납품 수락·수정 요청·추가 분쟁 신청은 일시적으로 사용할 수 없으며, 우측 작업
            관리에서도 동일하게 제한됩니다.
          </div>
        ) : null}
        <div className="mb-3 flex min-h-[44px] flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <Link
            href={backHref}
            className="shrink-0 text-sm font-bold text-slate-600 underline-offset-2 transition hover:text-blue-800 hover:underline"
          >
            ← 맞춤의뢰 목록으로
          </Link>
          <div className="flex min-w-0 flex-wrap items-center justify-end gap-2">
            {detail.hasActiveDispute ? <ActiveDisputeOrderStatusBadge /> : <OrderStatusBadge norm={orderNorm} />}
            <PaymentStatusBadge paymentRaw={payRaw} />
            <Link
              href="#order-room-order-info"
              className="inline-flex h-7 shrink-0 items-center rounded-full border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
            >
              요청 상세
            </Link>
          </div>
        </div>
        <h1 className="line-clamp-2 text-pretty text-lg font-extrabold leading-snug text-slate-950 sm:text-xl">
          {h.requestTitle}
        </h1>
        {detailLine && detailLine !== "—" ? <p className="mt-1.5 line-clamp-2 text-xs font-medium text-slate-500">{detailLine}</p> : null}
        <p className="mt-2 line-clamp-2 text-sm font-medium leading-relaxed text-slate-600">{oneLineContext}</p>
      </header>
    );
  }

  return (
    <header className="rounded-2xl border border-slate-100 bg-white p-5 sm:p-6 mb-5 shadow-sm transition">
      {detail.hasActiveDispute ? (
        <div
          role="status"
          className="mb-3 rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-xs font-semibold leading-snug text-amber-950"
        >
          분쟁이 접수되어 운영 검토 중입니다. 납품 등록·작업 진행·수정 요청 내역 확인 등은 우측 패널 정책에 따라 제한될 수
          있습니다.
        </div>
      ) : null}
      <div className="mb-3 flex min-h-[44px] flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <Link
          href={backHref}
          className="shrink-0 text-sm font-bold text-slate-600 underline-offset-2 transition hover:text-blue-800 hover:underline"
        >
          ← 맞춤의뢰 주문 목록
        </Link>
        <div className="flex min-w-0 flex-wrap items-center justify-end gap-2">
          {detail.hasActiveDispute ? <ActiveDisputeOrderStatusBadge /> : <OrderStatusBadge norm={orderNorm} />}
          <PaymentStatusBadge paymentRaw={payRaw} />
          <span className="inline-flex h-7 shrink-0 items-center rounded-full border border-slate-200 bg-slate-50 px-2.5 text-xs font-semibold text-slate-600">
            멘토
          </span>
          <Link
            href="#order-room-order-info"
            className="inline-flex h-7 shrink-0 items-center rounded-full border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
          >
            주문 정보
          </Link>
        </div>
      </div>
      <h1 className="line-clamp-2 text-pretty text-lg font-extrabold leading-snug text-slate-950 sm:text-xl">
        {h.requestTitle}
      </h1>
      {detailLine && detailLine !== "—" ? <p className="mt-1.5 line-clamp-2 text-xs font-medium text-slate-500">{detailLine}</p> : null}
      <p className="mt-2 line-clamp-2 text-sm font-medium leading-relaxed text-slate-600">{oneLineContext}</p>
    </header>
  );
}

type LeftContextProps = {
  detail: OrderDetailPageData;
  view: View;
  isTerminalOrder: boolean;
  orderIdDisplay: string;
};

function OrderStepStrip({ currentIndex }: { currentIndex: number }) {
  const n = ORDER_WORKSPACE_STEP_LABELS.length;
  return (
    <ol className="relative" aria-label="주문 단계">
      {ORDER_WORKSPACE_STEP_LABELS.map((label, i) => {
        const isDone = i < currentIndex;
        const isCurrent = i === currentIndex;
        const isLast = i === n - 1;
        return (
          <li key={String(label)} className="flex gap-3">
            <div className="flex w-7 shrink-0 flex-col items-center">
              <span
                className={
                  isCurrent
                    ? "inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-extrabold text-white shadow-sm"
                    : isDone
                      ? "inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-emerald-200 bg-emerald-50 text-xs font-extrabold text-emerald-900"
                      : "inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-xs font-extrabold text-slate-500"
                }
              >
                {i + 1}
              </span>
              {!isLast ? (
                <span
                  className={`my-1 block w-0.5 flex-1 min-h-[10px] rounded-full ${isDone ? "bg-emerald-200" : "bg-slate-200"}`}
                  aria-hidden
                />
              ) : null}
            </div>
            <div className={`min-w-0 ${!isLast ? "pb-3" : ""}`}>
              <span
                className={
                  isCurrent
                    ? "text-sm font-bold text-slate-900"
                    : isDone
                      ? "text-sm font-medium text-slate-800"
                      : "text-sm font-medium text-slate-500"
                }
              >
                {label}
              </span>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

/**
 * 왼쪽 열: 주문 정보, 단계(표시), 안내
 */
export function OrderLeftContextPanel({ detail, view, isTerminalOrder, orderIdDisplay }: LeftContextProps) {
  const o = detail.bundle.order;
  const h = detail.header;
  if (!o.row) return null;
  const orderRow = o.row as Record<string, unknown>;
  const orderNorm = normalizedPrimaryOrderStatus(orderRow);
  const payRaw = pickPaymentStatusRaw(orderRow);
  const hasDel = (detail.bundle.deliverables.rows ?? []).length > 0;
  const terminal = isOrderRowTerminalForActions(orderRow) || isTerminalOrder;
  const stepIndex = orderWorkspaceCurrentStepIndex(orderNorm, Boolean(terminal), hasDel);
  const orderCreated =
    (orderRow as { created_at?: unknown }).created_at != null
      ? formatOrderRoomDateTime((orderRow as { created_at?: unknown }).created_at)
      : "—";
  const shortId = shortOrderIdForDisplay(String(orderIdDisplay).trim());

  return (
    <div className="space-y-4">
      <div id="order-room-order-info" className={ORDER_ROOM_CARD_CLASS + " space-y-3 scroll-mt-24"}>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">주문 정보</p>
        {detail.hasActiveDispute ? (
          <div className="rounded-lg border border-amber-200 bg-amber-50/90 px-3 py-2 text-xs font-semibold text-amber-950">
            분쟁 접수 · 운영 검토 중입니다. 표시되는 주문 단계와 별도로, 납품·수락·수정 요청·분쟁 재신청은 제한됩니다.
          </div>
        ) : null}
        <dl className="space-y-2 text-sm">
          <div className="flex flex-wrap justify-between gap-2">
            <dt className="text-slate-500">주문번호</dt>
            <dd className="font-mono text-xs text-slate-800">{shortId}</dd>
          </div>
          <div className="flex flex-wrap justify-between gap-2">
            <dt className="text-slate-500">분야</dt>
            <dd className="text-right text-slate-900">{h.category && h.category !== "—" ? h.category : "—"}</dd>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <dt className="text-slate-500">금액(제안·확정)</dt>
            <dd className="text-right font-semibold text-slate-900">{h.priceLine}</dd>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <dt className="text-slate-500">결제</dt>
            <dd>
              <PaymentStatusBadge paymentRaw={payRaw} />
            </dd>
          </div>
          <div className="flex flex-wrap justify-between gap-2">
            <dt className="text-slate-500">주문일시</dt>
            <dd className="text-slate-800">{orderCreated}</dd>
          </div>
          <div className="flex flex-wrap justify-between gap-2">
            <dt className="text-slate-500">마감(납기)</dt>
            <dd className="text-slate-800">{h.dueLine !== "—" && h.dueLine ? h.dueLine : "—"}</dd>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100/90 pt-2">
            <dt className="text-slate-500">주문 상태</dt>
            <dd>{detail.hasActiveDispute ? <ActiveDisputeOrderStatusBadge /> : <OrderStatusBadge norm={orderNorm} />}</dd>
          </div>
        </dl>
        <p className="text-xs text-slate-500">
          멘토: <span className="text-slate-800">{h.mentorName}</span>
        </p>
        <p className="text-[11px] text-slate-400">보기 기준: {view === "mentor" ? "멘토" : "의뢰자"}</p>
      </div>

      <div className={ORDER_ROOM_CARD_CLASS}>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">주문 단계</p>
        <p className="mt-0.5 text-xs text-slate-500">현재 흐름(참고)</p>
        <div className="mt-3">
          <OrderStepStrip currentIndex={stepIndex} />
        </div>
        {terminal ? (
          <p className="mt-3 rounded-lg border border-emerald-100 bg-emerald-50/90 px-3 py-2 text-xs font-medium text-emerald-950">
            {view === "student" ? ORDER_ROOM_TERMINAL_STUDENT_NOTICE : ORDER_ROOM_TERMINAL_MENTOR_NOTICE}
          </p>
        ) : null}
      </div>

      <div className={ORDER_ROOM_CARD_CLASS + " text-sm text-slate-700"}>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">안내</p>
        <ul className="mt-2 list-disc space-y-2 pl-4 text-xs leading-relaxed text-slate-600 marker:text-slate-400">
          <li className="pl-0.5">납품이 등록되면 수락·수정 요청은 우측「작업 관리」에서 진행합니다.</li>
          <li className="pl-0.5">이견이 있을 때는 우측에서 정식 분쟁을 신청할 수 있습니다(진행 중 분쟁이 있으면 액션이 잠깁니다).</li>
        </ul>
      </div>
    </div>
  );
}

type OrderPaymentSettlementBlockProps = {
  detail: OrderDetailPageData;
  orderRow: Record<string, unknown>;
  orderId: string;
  actorRole: AppRole;
};

/**
 * 우측 열: 결제·정산 안내 문장
 */
export function OrderPaymentSettlementBlock({ detail, orderRow, orderId, actorRole }: OrderPaymentSettlementBlockProps) {
  const lines = paymentSettlementNotice(detail, orderRow);
  const showPayConfirm =
    actorRole === "student" &&
    orderId.trim().length > 0 &&
    !isOrderRowTerminalForActions(orderRow) &&
    !isOrderRowPaymentConfirmedForMentorWork(orderRow);

  if (lines.length === 0 && !showPayConfirm) {
    return null;
  }
  return (
    <div className={ORDER_ROOM_CARD_CLASS} role="status">
      <p className="text-xs font-semibold text-slate-500">진행 안내</p>
      {lines.length > 0 ? (
        <ul className="mt-1.5 list-inside list-disc space-y-0.5 text-sm text-slate-700">
          {lines.map((t, i) => (
            <li key={i}>{t}</li>
          ))}
        </ul>
      ) : null}
      {showPayConfirm ? (
        <div className="mt-4 border-t border-slate-100 pt-4">
          <p className="text-sm font-bold text-slate-900">결제 확인</p>
          <p className="mt-1 text-xs text-slate-600">
            실제 PG 결제가 붙기 전에는 아래 버튼으로 결제 완료를 표시해 멘토 작업을 시작할 수 있게 합니다.
          </p>
          <form action={confirmStudentCustomOrderPaymentAction} className="mt-3">
            <input type="hidden" name="orderId" value={orderId} />
            <button
              type="submit"
              className="w-full rounded-xl border border-blue-200 bg-blue-600 px-4 py-2.5 text-sm font-extrabold text-white shadow-sm hover:bg-blue-700"
            >
              결제 완료 확인
            </button>
          </form>
        </div>
      ) : null}
    </div>
  );
}

type SettlementCardProps = {
  detail: OrderDetailPageData;
};

/**
 * 정산 행이 있을 때 핵심 금액만(토큰·id 미노출)
 */
export function OrderSettlementLineCard({ detail }: SettlementCardProps) {
  const { settlementItem, settlementLoadError } = detail;
  if (settlementLoadError) {
    return (
      <div className={ORDER_ROOM_CARD_CLASS} role="status">
        <p className="text-sm text-slate-600">정산 항목을 지금은 불러올 수 없습니다. 잠시 후 다시 시도해 주세요.</p>
      </div>
    );
  }
  if (!settlementItem) {
    return null;
  }
  const row = settlementItem as Record<string, unknown>;
  const gross = firstAmountish(row, ["gross_amount", "gross", "total", "amount"]);
  const fee = firstAmountish(row, ["platform_fee_amount", "platform_fee", "fee_amount", "fee"]);
  const mentor = firstAmountish(row, ["mentor_amount", "mentor_net", "payout", "mentor_payout", "net"]);
  return (
    <div className={ORDER_ROOM_CARD_CLASS}>
      <p className="text-xs font-semibold text-slate-500">금액</p>
      <dl className="mt-2 space-y-1.5 text-sm">
        <div className="flex justify-between gap-2">
          <dt className="text-slate-500">총액(참고)</dt>
          <dd className="font-medium text-slate-900">{gross != null ? formatKrwWon(gross) : "—"}</dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-slate-500">플랫폼</dt>
          <dd className="font-medium text-slate-900">{fee != null ? formatKrwWon(fee) : "—"}</dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-slate-500">멘토</dt>
          <dd className="font-medium text-slate-900">{mentor != null ? formatKrwWon(mentor) : "—"}</dd>
        </div>
      </dl>
    </div>
  );
}
