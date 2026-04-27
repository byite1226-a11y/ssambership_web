import type { OrderDetailPageData } from "@/lib/customRequest/orderDetailQueries";

type Props = {
  detail: OrderDetailPageData;
  view: "student" | "mentor";
};

export function OrderSummaryHeader({ detail, view }: Props) {
  const h = detail.header;
  const o = detail.bundle.order;

  if (o.error && !o.row) {
    return (
      <section className="rounded-2xl border border-amber-200 bg-amber-50/80 p-4 text-sm text-amber-950">
        <h2 className="font-extrabold">주문 요약</h2>
        <p className="mt-2">Supabase: {o.error}</p>
      </section>
    );
  }

  if (!o.row) {
    return (
      <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
        <h2 className="font-extrabold">주문 요약</h2>
        <p className="mt-2">해당 id의 주문을 찾을 수 없습니다. {o.table ? `(${o.table})` : null}</p>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h2 className="text-sm font-extrabold text-slate-500">
          주문 요약 {view === "mentor" ? "· 멘토" : "· 의뢰자"}
        </h2>
        <span
          className="inline-flex rounded-full border border-slate-300 bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-800"
          title="custom_request_orders.status 등"
        >
          {h.statusLine}
        </span>
      </div>
      <h3 className="mt-2 text-base font-extrabold text-slate-900">{h.requestTitle}</h3>
      <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
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
