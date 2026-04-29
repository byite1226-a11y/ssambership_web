import type { OrderDetailPageData } from "@/lib/customRequest/orderDetailQueries";
import { isOrderStatusTerminal, normalizedPrimaryOrderStatus } from "@/lib/customRequest/orderLifecycleConstants";

type Props = {
  detail: OrderDetailPageData;
  view: "student" | "mentor";
};

function pickPaymentStatusLabel(row: Record<string, unknown> | null | undefined): string {
  if (!row) return "";
  for (const k of ["payment_status", "payment_state"] as const) {
    const v = row[k];
    if (typeof v === "string" && v.trim()) return v.trim().toLowerCase();
  }
  return "";
}

function paymentSettlementNotice(detail: OrderDetailPageData, orderRow: Record<string, unknown>): string[] {
  const lines: string[] = [];
  if (detail.hasActiveDispute) {
    lines.push("분쟁 처리 중에는 정산이 보류됩니다.");
  }
  const pay = pickPaymentStatusLabel(orderRow);
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

export function OrderSummaryHeader({ detail, view }: Props) {
  const h = detail.header;
  const o = detail.bundle.order;
  const orderRow = o.row as Record<string, unknown> | null;

  if (o.error && !o.row) {
    return (
      <section className="rounded-2xl border border-amber-200 bg-amber-50/80 p-4 text-sm text-amber-950">
        <h2 className="font-extrabold">주문 요약</h2>
        <p className="mt-2">정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.</p>
      </section>
    );
  }

  if (!o.row) {
    return (
      <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
        <h2 className="font-extrabold">주문 요약</h2>
        <p className="mt-2">해당 주문을 찾을 수 없습니다.</p>
      </section>
    );
  }

  const paymentLines = orderRow ? paymentSettlementNotice(detail, orderRow) : [];

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4">
      {paymentLines.length > 0 ? (
        <div
          className="mb-4 rounded-xl border border-sky-100 bg-sky-50/80 px-3 py-2 text-xs font-medium text-sky-950"
          role="status"
        >
          <p className="font-extrabold text-sky-900">결제·정산 안내</p>
          <ul className="mt-1 list-inside list-disc space-y-0.5 text-sky-900/90">
            {paymentLines.map((t, i) => (
              <li key={i}>{t}</li>
            ))}
          </ul>
        </div>
      ) : null}
      <h2 className="text-sm font-extrabold text-slate-500">
        주문 요약 {view === "mentor" ? "· 멘토" : "· 의뢰자"}
      </h2>
      <h3 className="mt-2 text-base font-extrabold text-slate-900">{h.requestTitle}</h3>
      <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-slate-500">주문 상태</dt>
          <dd className="font-medium text-slate-800">{h.statusLine}</dd>
        </div>
        <div>
          <dt className="text-slate-500">결제</dt>
          <dd className="font-medium text-slate-800">{h.paymentLine}</dd>
        </div>
        <div>
          <dt className="text-slate-500">카테고리</dt>
          <dd className="font-medium text-slate-800">{h.category || "—"}</dd>
        </div>
        <div>
          <dt className="text-slate-500">과목·주제</dt>
          <dd className="font-medium text-slate-800">{h.subjectLine}</dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-slate-500">선택 멘토</dt>
          <dd className="font-medium text-slate-800">
            {h.mentorName}
            {h.university && h.university !== "—" ? (
              <span className="text-slate-600"> · {h.university}</span>
            ) : null}
            {h.department && h.department !== "—" ? (
              <span className="text-slate-600"> / {h.department}</span>
            ) : null}
          </dd>
        </div>
        <div>
          <dt className="text-slate-500">제안·확정 가격</dt>
          <dd className="font-medium text-slate-800">{h.priceLine}</dd>
        </div>
        <div>
          <dt className="text-slate-500">납기</dt>
          <dd className="font-medium text-slate-800">{h.dueLine}</dd>
        </div>
      </dl>
    </section>
  );
}
