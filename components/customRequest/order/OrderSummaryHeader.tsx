import type { OrderDetailPageData } from "@/lib/customRequest/orderDetailQueries";
import {
  isOrderStatusTerminal,
  ORDER_ROOM_CARD_CLASS,
  normalizedPrimaryOrderStatus,
} from "@/lib/customRequest/orderLifecycleConstants";
import { OrderStatusBadge, PaymentStatusBadge } from "@/components/customRequest/order/OrderStatusBadge";

type View = "student" | "mentor";

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
  orderRow: Record<string, unknown>
): boolean {
  if (detail.settlementLoadError) {
    return true;
  }
  if (detail.settlementItem) {
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

type LeftContextProps = {
  detail: OrderDetailPageData;
  view: View;
  isTerminalOrder: boolean;
};

/**
 * 왼쪽 열: 스캔 가능한 요약(상태·가격·납기·멘토·건수)
 * isTerminalOrder: 향후 배지/요약 톤 조정용(현재는 액션 열에서 종료 문구를 표시)
 */
export function OrderLeftContextPanel({ detail, view, isTerminalOrder: _isTerminalOrder }: LeftContextProps) {
  void _isTerminalOrder;
  const o = detail.bundle.order;
  const h = detail.header;
  if (!o.row) return null;
  const orderRow = o.row as Record<string, unknown>;
  const orderNorm = normalizedPrimaryOrderStatus(orderRow);
  const payRaw = pickPaymentStatusRaw(orderRow);
  const nDel = (detail.bundle.deliverables.rows ?? []).length;
  const nRev = (detail.revisions.rows ?? []).length;

  return (
    <div className="space-y-3">
      <div className={ORDER_ROOM_CARD_CLASS + " space-y-3"}>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">상태</p>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-500">주문</span>
          <OrderStatusBadge norm={orderNorm} />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-500">결제</span>
          <PaymentStatusBadge paymentRaw={payRaw} />
        </div>
        <div className="mt-1 grid grid-cols-1 gap-2.5 sm:grid-cols-1">
          <div className="flex flex-wrap items-baseline justify-between gap-2 rounded-xl border border-slate-100/90 bg-slate-50/80 px-3 py-2">
            <span className="text-xs text-slate-500">가격</span>
            <span className="text-sm font-semibold text-slate-900">{h.priceLine}</span>
          </div>
          <div className="flex flex-wrap items-baseline justify-between gap-2 rounded-xl border border-slate-100/90 bg-slate-50/80 px-3 py-2">
            <span className="text-xs text-slate-500">납기</span>
            <span className="text-sm font-semibold text-slate-900">{h.dueLine}</span>
          </div>
        </div>
      </div>

      <div className={ORDER_ROOM_CARD_CLASS + " text-sm text-slate-800"}>
        <p className="text-xs font-semibold text-slate-500">멘토</p>
        <p className="mt-1 font-medium text-slate-900">{h.mentorName}</p>
        {h.university && h.university !== "—" ? (
          <p className="text-xs text-slate-600">{h.university}</p>
        ) : null}
        {h.department && h.department !== "—" ? <p className="text-xs text-slate-600">{h.department}</p> : null}
        <p className="mt-2 border-t border-slate-100 pt-2 text-xs text-slate-500">보기: {view === "mentor" ? "멘토" : "의뢰자(학생)"} 기준</p>
      </div>

      <div className={ORDER_ROOM_CARD_CLASS + " text-sm"}>
        <p className="text-xs font-semibold text-slate-500">진행 건수</p>
        <p className="mt-1.5 text-slate-800">등록 납품 {nDel}건 · 수정 요청 {nRev}회</p>
      </div>
    </div>
  );
}

type OrderPaymentSettlementBlockProps = {
  detail: OrderDetailPageData;
  orderRow: Record<string, unknown>;
};

/**
 * 우측 열: 결제·정산 안내 문장
 */
export function OrderPaymentSettlementBlock({ detail, orderRow }: OrderPaymentSettlementBlockProps) {
  const lines = paymentSettlementNotice(detail, orderRow);
  if (lines.length === 0) {
    return null;
  }
  return (
    <div className={ORDER_ROOM_CARD_CLASS} role="status">
      <p className="text-xs font-semibold text-slate-500">진행 안내</p>
      <ul className="mt-1.5 list-inside list-disc space-y-0.5 text-sm text-slate-700">
        {lines.map((t, i) => (
          <li key={i}>{t}</li>
        ))}
      </ul>
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
