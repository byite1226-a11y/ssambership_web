import Link from "next/link";
import type { OrderDetailPageData } from "@/lib/customRequest/orderDetailQueries";
import {
  isOrderRowPaymentConfirmedForMentorWork,
  isOrderRowTerminalForActions,
  isOrderStatusTerminal,
  ORDER_ROOM_CARD_CLASS,
  ORDER_ROOM_TERMINAL_MENTOR_NOTICE,
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
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700 shadow-sm">
        <h2 className="font-extrabold">주문 요약</h2>
        <p className="mt-2 text-xs font-semibold">정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.</p>
      </div>
    );
  }

  if (!o.row) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700 shadow-sm">
        <h2 className="font-extrabold">주문 요약</h2>
        <p className="mt-2 text-xs font-semibold">해당 주문을 찾을 수 없습니다.</p>
      </div>
    );
  }

  const orderRow = o.row as Record<string, unknown>;
  const orderNorm = normalizedPrimaryOrderStatus(orderRow);

  const mName = h.mentorName && h.mentorName !== "—" ? h.mentorName : "매칭 멘토";
  const pLine = h.priceLine && h.priceLine !== "—" ? h.priceLine : "협의 중";
  const due = h.dueLine && h.dueLine !== "—" ? h.dueLine : "—";

  const isCompleted = orderNorm === "completed" || orderNorm === "settled" || isOrderStatusTerminal(orderNorm || "");
  const hasDeliverables = (detail.bundle.deliverables.rows ?? []).length > 0;
  const isReview = orderNorm === "delivered" || orderNorm === "under_review" || (orderNorm !== "completed" && hasDeliverables);

  let pageTitle = "주문방 / 납품";
  let pageDescription = "선택한 멘토와 대화하며 과제를 진행할 수 있어요. 납품 파일을 확인하고 수락하거나, 수정 요청을 할 수 있어요.";
  let statusCardTitle = "멘토 선택 완료";
  let statusCardDesc = "주문방이 생성되어 진행 중이에요.";
  let statusCardButtonLabel = "요청 상세 보기";

  if (isCompleted) {
    pageTitle = "5. 주문 완료 🎉";
    pageDescription = "주문이 성공적으로 완료되었습니다. 멘토님과 함께 좋은 결과물을 만들어주셔서 감사합니다!";
    statusCardTitle = "수락 완료 (주문 완료)";
    statusCardDesc = "주문이 완료되었습니다.";
    statusCardButtonLabel = "이용 후기 작성하기";
  } else if (isReview) {
    pageTitle = "4. 납품 확인 / 검토";
    pageDescription = "멘토가 최종 파일을 납품했어요. 내용을 확인하고 수락하거나 수정 요청을 할 수 있어요.";
    statusCardTitle = `납품 완료 (v${detail.bundle.deliverables.rows?.length ?? 2})`;
    statusCardDesc = "최종 납품을 확인하고 수락하거나 수정 요청을 보내세요.";
    statusCardButtonLabel = "요청 상세 보기";
  }

  const backLabel = view === "mentor" ? "맞춤의뢰 주문 목록으로 돌아가기" : "맞춤의뢰 목록으로 돌아가기";

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <Link
            href={backHref}
            className="group inline-flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-blue-600 transition mb-1"
          >
            <span className="transition-transform group-hover:-translate-x-0.5">←</span>
            <span>{backLabel}</span>
          </Link>
          <h1 className="text-xl font-black text-slate-900 tracking-tight sm:text-2xl">
            {pageTitle}
          </h1>
          <p className="text-xs font-bold text-slate-400 max-w-xl leading-relaxed">
            {pageDescription}
          </p>
        </div>

        <div className="flex items-center gap-4 border border-emerald-200 bg-emerald-50/40 p-4 rounded-xl shadow-sm max-w-md shrink-0">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div className="space-y-0.5 min-w-0 pr-2">
            <p className="text-xs font-black text-slate-800">{statusCardTitle}</p>
            <p className="text-[10px] font-bold text-slate-500 leading-normal truncate">{statusCardDesc}</p>
          </div>
          <Link
            href="#"
            className="ml-auto inline-flex items-center gap-1.5 rounded-xl border border-blue-200 bg-white px-3.5 py-2 text-xs font-black text-blue-600 hover:bg-blue-50 transition shadow-sm shrink-0"
          >
            <span>{statusCardButtonLabel}</span>
            <span>&gt;</span>
          </Link>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:border-blue-100 transition duration-300">
        <div className="grid grid-cols-2 gap-4 divide-y divide-slate-100 md:grid-cols-5 md:divide-x md:divide-y-0">
          <div className="col-span-2 md:col-span-1 pr-2">
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">요청 제목</p>
            <p className="mt-1.5 text-xs font-black text-slate-900 line-clamp-1" title={h.requestTitle || "수행평가 발표 구성 피드백 요청"}>
              {h.requestTitle || "수행평가 발표 구성 피드백 요청"}
            </p>
            <p className="mt-0.5 text-[10px] font-bold text-slate-400">
              {h.category && h.category !== "—" ? h.category : "일반 분야"}
            </p>
          </div>

          <div className="pt-2.5 md:pt-0 md:pl-4 flex items-center gap-2.5">
            <div className="h-9 w-9 shrink-0 rounded-full overflow-hidden bg-slate-100 border border-slate-200 flex items-center justify-center">
              <img
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80"
                className="h-full w-full object-cover"
                alt="Avatar"
              />
            </div>
            <div className="space-y-0.5">
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">선택된 멘토</p>
              <p className="text-xs font-black text-slate-900">{view === "mentor" ? "의뢰 학생" : `${mName} 멘토`}</p>
              <span className="inline-flex items-center rounded bg-blue-50 px-1 py-0.5 text-[8px] font-black text-blue-600">프리미엄 멘토</span>
            </div>
          </div>

          <div className="pt-2.5 md:pt-0 md:pl-4">
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">제안 금액</p>
            <p className="mt-1.5 text-xs font-black text-blue-600">
              {pLine}
            </p>
            <span className="inline-flex items-center rounded bg-blue-50 px-1 py-0.5 text-[8px] font-black text-blue-600">확정 제안가</span>
          </div>

          <div className="pt-2.5 md:pt-0 md:pl-4">
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">예상 소요 기간</p>
            <p className="mt-1.5 text-xs font-black text-slate-800">
              2일
            </p>
            <p className="mt-0.5 text-[10px] font-bold text-slate-400">작업 착수 기준</p>
          </div>

          <div className="pt-2.5 md:pt-0 md:pl-4">
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">최종 마감일 (납기)</p>
            <p className="mt-1.5 text-sm font-extrabold text-emerald-600">
              {due}
            </p>
            <p className="mt-0.5 text-[10px] font-bold text-slate-400">기한 엄수 필수</p>
          </div>
        </div>
      </div>
    </div>
  );
}

type LeftContextProps = {
  detail: OrderDetailPageData;
  view: View;
  isTerminalOrder: boolean;
  orderIdDisplay: string;
};

function OrderStepStrip({ currentIndex }: { currentIndex: number }) {
  const steps = [
    { title: "주문 생성", desc: "주문방이 생성되었어요." },
    { title: "진행 중", desc: "멘토가 과제를 진행 중이에요." },
    { title: "납품 완료", desc: "멘토가 파일을 제출했어요." },
    { title: "검토 중", desc: "파일을 확인하고 있어요." },
    { title: "주문 완료", desc: "수락 시 주문이 완료됩니다." },
  ];

  return (
    <ol className="relative space-y-4" aria-label="주문 단계">
      {steps.map((s, i) => {
        const isDone = i < currentIndex;
        const isCurrent = i === currentIndex;
        const isLast = i === steps.length - 1;

        return (
          <li key={i} className="flex gap-3">
            <div className="flex w-6 shrink-0 flex-col items-center">
              {isDone ? (
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-white shadow-sm">
                  <svg className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </span>
              ) : isCurrent ? (
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-xs font-black text-white shadow-sm ring-4 ring-blue-50">
                  {i + 1}
                </span>
              ) : (
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-xs font-bold text-slate-400">
                  {i + 1}
                </span>
              )}
              {!isLast ? (
                <span
                  className={`my-1 block w-0.5 flex-1 min-h-[16px] ${isDone ? "bg-blue-600" : "bg-slate-100"}`}
                  aria-hidden
                />
              ) : null}
            </div>
            <div className={`min-w-0 ${!isLast ? "pb-1" : ""} flex-1`}>
              <div className="flex items-center gap-1.5">
                <span className={`text-xs font-black tracking-tight ${isCurrent ? "text-blue-600" : isDone ? "text-slate-800" : "text-slate-400"}`}>
                  {s.title}
                </span>
                {isCurrent && (
                  <span className="rounded bg-blue-50 px-1 py-0.5 text-[8px] font-black text-blue-600">현재 단계</span>
                )}
              </div>
              <p className="mt-0.5 text-[10px] font-semibold text-slate-400 leading-normal">{s.desc}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

export function OrderLeftContextPanel({ detail, view: _view, isTerminalOrder, orderIdDisplay }: LeftContextProps) {
  void _view;
  const o = detail.bundle.order;
  const h = detail.header;
  if (!o.row) return null;
  const orderRow = o.row as Record<string, unknown>;
  const orderNorm = normalizedPrimaryOrderStatus(orderRow);
  const hasDel = (detail.bundle.deliverables.rows ?? []).length > 0;
  const terminal = isOrderRowTerminalForActions(orderRow) || isTerminalOrder;
  const stepIndex = orderWorkspaceCurrentStepIndex(orderNorm, Boolean(terminal), hasDel);
  const orderCreated =
    (orderRow as { created_at?: unknown }).created_at != null
      ? formatOrderRoomDateTime((orderRow as { created_at?: unknown }).created_at)
      : "—";
  const shortId = shortOrderIdForDisplay(String(orderIdDisplay).trim());

  const cardClass = "rounded-xl border border-slate-200/90 bg-white p-4 shadow-sm hover:border-blue-100 hover:shadow-md transition-all duration-300";

  return (
    <div className="space-y-4">
      <div id="order-room-order-info" className={`${cardClass} space-y-3.5 scroll-mt-24`}>
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <p className="text-xs font-black uppercase tracking-wider text-slate-400">주문 정보</p>
          <span className="inline-flex h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
        </div>
        <dl className="space-y-2.5 text-xs">
          <div className="flex justify-between gap-2 border-b border-slate-50 pb-1.5">
            <dt className="font-bold text-slate-400">주문 번호</dt>
            <dd className="font-mono font-black text-slate-800">{shortId}</dd>
          </div>
          <div className="flex justify-between gap-2 border-b border-slate-50 pb-1.5">
            <dt className="font-bold text-slate-400">카테고리</dt>
            <dd className="font-extrabold text-slate-800 truncate max-w-[130px]">{h.category && h.category !== "—" ? h.category : "—"}</dd>
          </div>
          <div className="flex justify-between gap-2 border-b border-slate-50 pb-1.5">
            <dt className="font-bold text-slate-400">제안 금액</dt>
            <dd className="font-black text-blue-600">{h.priceLine}</dd>
          </div>
          <div className="flex justify-between gap-2 border-b border-slate-50 pb-1.5">
            <dt className="font-bold text-slate-400">결제 금액</dt>
            <dd className="font-black text-blue-600">{h.priceLine}</dd>
          </div>
          <div className="flex justify-between gap-2 border-b border-slate-50 pb-1.5">
            <dt className="font-bold text-slate-400">주문 일시</dt>
            <dd className="font-semibold text-slate-500 truncate max-w-[150px]">{orderCreated}</dd>
          </div>
          <div className="flex justify-between gap-2 border-b border-slate-50 pb-1.5">
            <dt className="font-bold text-slate-400">마감일 (납기)</dt>
            <dd className="font-black text-emerald-600">{h.dueLine !== "—" && h.dueLine ? h.dueLine : "—"}</dd>
          </div>
          <div className="flex items-center justify-between gap-2 pt-1">
            <dt className="font-bold text-slate-400">상태</dt>
            <dd>{detail.hasActiveDispute ? <ActiveDisputeOrderStatusBadge /> : <OrderStatusBadge norm={orderNorm} />}</dd>
          </div>
        </dl>
      </div>

      <div className={cardClass}>
        <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-3.5">
          <p className="text-xs font-black uppercase tracking-wider text-slate-400">주문 단계</p>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[8px] font-black text-slate-500">실시간 흐름</span>
        </div>
        <OrderStepStrip currentIndex={stepIndex} />
      </div>

      <div className={`${cardClass} space-y-3`}>
        <p className="text-xs font-black uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-2">안내 사항</p>
        <ul className="space-y-2.5 text-[11px] font-bold text-slate-500 leading-relaxed pl-1">
          <li className="flex gap-2">
            <span className="text-emerald-500 shrink-0">✓</span>
            <span>파일 수정 요청은 최대 2회까지 가능해요.</span>
          </li>
          <li className="flex gap-2">
            <span className="text-emerald-500 shrink-0">✓</span>
            <span>수락 후에는 추가 수정 요청이 불가능해요.</span>
          </li>
          <li className="flex gap-2">
            <span className="text-emerald-500 shrink-0">✓</span>
            <span>문제가 발생하면 고객센터 혹은 문제 해결을 신청해 주세요.</span>
          </li>
        </ul>
        <div className="pt-2 border-t border-slate-100">
          <Link
            href="/guide"
            className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white py-2 text-xs font-black text-slate-600 hover:bg-slate-50 transition"
          >
            <span>이용 가이드 보기</span>
            <span>&gt;</span>
          </Link>
        </div>
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
