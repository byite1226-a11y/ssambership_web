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
  orderStatusBadgeLabelForNorm,
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
export function OrderRoomPageHeader(props: OrderRoomPageHeaderProps) {
  if (props.view === "mentor") {
    return <OrderRoomPageHeaderMentor {...props} />;
  }
  const { detail, view, backHref = "/custom-request" } = props;
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

  const backLabel = "맞춤의뢰 목록으로 돌아가기";

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
            <p className="mt-1.5 text-xs font-black text-slate-900 line-clamp-1" title={h.requestTitle || "제목 없음"}>
              {h.requestTitle || "제목 없음"}
            </p>
            <p className="mt-0.5 text-[10px] font-bold text-slate-400">
              {h.category && h.category !== "—" ? h.category : "일반 분야"}
            </p>
          </div>

          <div className="pt-2.5 md:pt-0 md:pl-4 flex items-center gap-2.5">
            <div className="h-9 w-9 shrink-0 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-[11px] font-black text-slate-500" aria-hidden>
              {(mName && mName !== "—" ? mName.trim().charAt(0) : "M").toUpperCase()}
            </div>
            <div className="space-y-0.5">
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">선택된 멘토</p>
              <p className="text-xs font-black text-slate-900">{`${mName} 멘토`}</p>
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

export type LeftContextProps = {
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

export function OrderLeftContextPanel(props: LeftContextProps) {
  if (props.view === "mentor") {
    return <OrderRightSidebarMentor {...props} />;
  }
  const { detail, view: _view, isTerminalOrder, orderIdDisplay } = props;
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

/**
 * ========================================================
 * MENTOR ONLY VISUAL UPGRADES (SAFETY ENCAPSULATED)
 * ========================================================
 */

function OrderRoomPageHeaderMentor({ detail, backHref = "/custom-request" }: OrderRoomPageHeaderProps) {
  const h = detail.header;
  const o = detail.bundle.order;

  if (o.error && !o.row) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600 shadow-sm">
        <h2 className="font-bold">주문 정보를 불러오지 못했습니다.</h2>
      </div>
    );
  }
  if (!o.row) return null;

  const orderRow = o.row as Record<string, unknown>;
  const orderNorm = normalizedPrimaryOrderStatus(orderRow);
  const orderIdRaw = String(orderRow.id ?? "");
  const orderDisplayId = shortOrderIdForDisplay(orderIdRaw);
  
  const orderDate = (orderRow.created_at as string)?.substring(0, 10)?.replaceAll('-', '.') || "—";
  const dueDate = h.dueLine && h.dueLine !== "—" ? h.dueLine : "—";

  const backLabel = "수락된 의뢰 상세로 돌아가기";
  
  // Status-dependent labels from current normalization
  const statusLabel = orderNorm === "completed" || orderNorm === "settled" ? "완료됨" : "수락됨"; 

  return (
    <div className="mb-6 flex flex-col space-y-4">
      {/* TOP: Breadcrumb */}
      <div>
        <Link
          href={backHref}
          className="group inline-flex items-center gap-1 text-[13px] font-medium text-slate-500 hover:text-blue-600 transition-colors"
        >
          <span>←</span>
          <span>{backLabel}</span>
        </Link>
      </div>

      {/* Header Title Stack */}
      <div className="space-y-1">
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">작업방</h1>
        <p className="text-[14px] text-slate-500">의뢰자와 1:1로 소통하며 작업을 진행하세요.</p>
      </div>

      {/* Summary Card (White & Rounded) */}
      <div className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_2px_10px_rgba(0,0,0,0.03)]">
        <div className="flex items-start gap-4 min-w-0">
          {/* Left Icon Box */}
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          </div>

          {/* Center Text Content */}
          <div className="min-w-0 space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center rounded bg-[#E8F9F1] px-2.5 py-0.5 text-[11px] font-bold text-[#059669]">
                {statusLabel}
              </span>
              <h2 className="text-[18px] font-extrabold text-slate-900 truncate" title={h.requestTitle || ""}>
                {h.requestTitle || "제목 정보 없음"}
              </h2>
            </div>
            <div className="flex items-center divide-x divide-slate-200 text-[13px] text-slate-500 font-medium">
              <span className="pr-3">의뢰번호 {orderDisplayId}</span>
              <span className="px-3">의뢰일 {orderDate}</span>
              <span className="pl-3">마감일 {dueDate}</span>
            </div>
          </div>
        </div>

        {/* Right Action Cluster */}
        <div className="flex shrink-0 items-center gap-2 ml-auto">
          <button
            type="button"
            className="inline-flex items-center justify-center h-9 rounded-lg border border-blue-100 bg-white px-4 text-[13px] font-bold text-blue-600 shadow-[0_1px_3px_rgba(59,130,246,0.08)] hover:bg-blue-50 hover:border-blue-200 transition-all duration-200"
          >
            의뢰 상세 보기
          </button>
          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition"
            aria-label="Options"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

export function OrderRightSidebarMentor({ detail, isTerminalOrder, orderIdDisplay }: LeftContextProps) {
  const o = detail.bundle.order;
  const h = detail.header;
  if (!o.row) return null;
  const orderRow = o.row as Record<string, unknown>;
  const orderNorm = normalizedPrimaryOrderStatus(orderRow);
  const hasDel = (detail.bundle.deliverables.rows ?? []).length > 0;
  const terminal = isOrderRowTerminalForActions(orderRow) || isTerminalOrder;
  const stepIndex = orderWorkspaceCurrentStepIndex(orderNorm, Boolean(terminal), hasDel);
  const orderCreated =
    (orderRow.created_at as string)?.substring(0, 10)?.replaceAll('-', '.') || "—";
  
  const shortId = shortOrderIdForDisplay(String(orderIdDisplay).trim());

  return (
    <div className="w-full flex flex-col gap-5 pb-8">
      {/* Section 1: 진행 단계 */}
      <div className="rounded-2xl border border-slate-200 bg-white px-5 py-6 shadow-[0_2px_10px_rgba(0,0,0,0.03)]">
        <h3 className="text-[15px] font-extrabold text-slate-900 mb-5">진행 단계</h3>
        <OrderStepStripMentor currentIndex={stepIndex} createdDate={orderCreated} />
      </div>

      {/* Section 2: 의뢰 정보 */}
      <div className="rounded-2xl border border-slate-200 bg-white px-5 py-6 shadow-[0_2px_10px_rgba(0,0,0,0.03)]">
        <h3 className="text-[15px] font-extrabold text-slate-900 mb-4">의뢰 정보</h3>
        <dl className="flex flex-col space-y-3.5 text-[13px]">
          <div className="flex justify-between items-center">
            <dt className="font-medium text-slate-500">의뢰번호</dt>
            <dd className="font-medium text-slate-900">{shortId}</dd>
          </div>
          <div className="flex justify-between items-center">
            <dt className="font-medium text-slate-500">의뢰일</dt>
            <dd className="font-medium text-slate-900">{orderCreated}</dd>
          </div>
          <div className="flex justify-between items-center">
            <dt className="font-medium text-slate-500">수락일</dt>
            <dd className="font-medium text-slate-900">{orderCreated}</dd>
          </div>
          <div className="flex justify-between items-center">
            <dt className="font-medium text-slate-500">마감일</dt>
            <dd className="font-medium text-slate-900">{h.dueLine && h.dueLine !== "—" ? h.dueLine.split(' ')[0] : "—"}</dd>
          </div>
          <div className="flex justify-between items-center">
            <dt className="font-medium text-slate-500">예상 금액</dt>
            <dd className="font-bold text-slate-900">{h.priceLine && h.priceLine !== "—" ? h.priceLine : "25,000캐시"}</dd>
          </div>
          <div className="flex justify-between items-center pt-1">
            <dt className="font-medium text-slate-500">상태</dt>
            <dd className="inline-flex items-center rounded bg-blue-50 px-1.5 py-0.5 text-[11px] font-bold text-blue-600">
              {orderStatusBadgeLabelForNorm(orderNorm)}
            </dd>
          </div>
        </dl>
      </div>

      {/* Section 3: 빠른 메뉴 */}
      <div className="rounded-2xl border border-slate-200 bg-white px-5 py-6 shadow-[0_2px_10px_rgba(0,0,0,0.03)]">
        <h3 className="text-[15px] font-extrabold text-slate-900 mb-4">빠른 메뉴</h3>
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: "의뢰 정보", icon: (
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            )},
            { label: "요청사항", icon: (
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9.5a2.5 2.5 0 00-2.5-2.5H15" />
              </svg>
            )},
            { label: "작업 파일", icon: (
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            )},
            { label: "진행 관리", icon: (
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
          ].map((item, idx) => (
            <button key={idx} className="flex flex-col items-center gap-2 group">
              <div className="flex h-[50px] w-[50px] items-center justify-center rounded-xl bg-slate-50 text-slate-500 group-hover:bg-blue-50 group-hover:text-blue-600 transition">
                {item.icon}
              </div>
              <span className="text-[11px] font-medium text-slate-600">{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Section 4: 안내 사항 */}
      <div className="rounded-2xl border border-slate-200 bg-white px-5 py-6 shadow-[0_2px_10px_rgba(0,0,0,0.03)]">
        <h3 className="text-[15px] font-extrabold text-slate-900 mb-4">안내 사항</h3>
        <ul className="space-y-3 text-[13px] font-medium text-slate-600">
          <li className="flex items-start gap-2">
            <span className="mt-1.5 h-1 w-1 rounded-full bg-slate-900 shrink-0" />
            <span className="leading-relaxed">의뢰자와 원활하게 소통하며 작업을 진행해주세요.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-1.5 h-1 w-1 rounded-full bg-slate-900 shrink-0" />
            <span className="leading-relaxed">작업 중 파일은 &apos;작업 파일&apos; 탭에 업로드하세요.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-1.5 h-1 w-1 rounded-full bg-slate-900 shrink-0" />
            <span className="leading-relaxed">모든 작업이 완료되면 &apos;납품하기&apos;를 통해 결과물을 제출해주세요.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-1.5 h-1 w-1 rounded-full bg-slate-900 shrink-0" />
            <span className="leading-relaxed">의뢰자와의 대화는 소중한 기록으로 남습니다.</span>
          </li>
        </ul>
      </div>
    </div>
  );
}

function OrderStepStripMentor({ currentIndex, createdDate }: { currentIndex: number; createdDate: string }) {
  const steps = [
    { title: "수락됨", date: createdDate },
    { title: "작업 중" },
    { title: "납품 대기" },
    { title: "수정 요청" },
    { title: "완료" },
  ];

  return (
    <div className="relative flex flex-col space-y-4 pl-2">
      {steps.map((s, i) => {
        const isDone = i < currentIndex;
        const isCurrent = i === currentIndex;
        const isLast = i === steps.length - 1;

        const circleBg = isCurrent || isDone ? "bg-blue-600" : "bg-white border border-slate-200";
        const circleText = isCurrent || isDone ? "text-white" : "text-slate-400";
        const lineBg = isDone ? "bg-blue-600" : "bg-slate-200";

        return (
          <div key={i} className="flex items-start gap-4">
            <div className="flex flex-col items-center relative z-10">
              <div className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold shadow-sm ${circleBg} ${circleText}`}>
                {isDone ? (
                  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  i + 1
                )}
              </div>
              {!isLast && (
                <div className={`absolute top-6 bottom-[-16px] w-0.5 ${lineBg} -z-10`} />
              )}
            </div>
            <div className="flex flex-col">
              <span className={`text-[13px] font-bold leading-6 ${isCurrent ? "text-blue-600" : isDone ? "text-slate-800" : "text-slate-400"}`}>
                {s.title}
              </span>
              {s.date && <span className="text-[11px] font-medium text-slate-400">{s.date}</span>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
