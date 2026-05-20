import Link from "next/link";
import { acceptCustomOrderDeliverableAction } from "@/lib/customRequest/orderStudentActions";
import { submitCustomOrderRevisionRequestAction } from "@/lib/customRequest/orderRevisionActions";
import { submitCustomOrderDisputeAction } from "@/lib/customRequest/orderDisputeActions";
import { downloadCustomOrderDeliverableAction } from "@/lib/customRequest/orderDeliverableDownloadActions";
import type { OrderDetailPageData } from "@/lib/customRequest/orderDetailQueries";

export function CustomRequestOrderReviewPanel(props: { orderId: string; detail: OrderDetailPageData }) {
  const deliverables = props.detail.bundle.deliverables.rows ?? [];
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header>
        <h1 className="text-2xl font-black text-slate-900">{"\uB0A9\uD488 \uD655\uC778"}</h1>
        <p className="mt-2 text-sm text-slate-600">{"\uB0A9\uD488 \uD30C\uC77C\uC744 \uD655\uC778\uD55C \uB4A4 \uC218\uB77D\uB7EC \uC8FC\uC138\uC694."}</p>
      </header>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-extrabold text-slate-900">{"\uB0A9\uD488 \uD30C\uC77C"}</h2>
        {deliverables.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">{"\uB4F1\uB85D\uB41C \uB0A9\uD488\uC774 \uC5C6\uC2B5\uB2C8\uB2E4."}</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {deliverables.map((r) => {
              const id = String(r.id ?? "");
              const name =
                (typeof r.original_filename === "string" && r.original_filename) ||
                (typeof r.file_name === "string" && r.file_name) ||
                "\uB0A9\uD488 \uD30C\uC77C";
              return (
                <li key={id}>
                  <form action={downloadCustomOrderDeliverableAction}>
                    <input type="hidden" name="orderId" value={props.orderId} />
                    <input type="hidden" name="deliverableId" value={id} />
                    <button
                      type="submit"
                      className="flex w-full items-center justify-between rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold text-[#1A56DB] hover:bg-slate-50"
                    >
                      {name}
                      <span>{"\uB2E4\uC6B4\uB85C\uB4DC"}</span>
                    </button>
                  </form>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-extrabold text-slate-900">{"\uCC98\uB9AC \uC120\uD0DD"}</h2>
        <form action={acceptCustomOrderDeliverableAction}>
          <input type="hidden" name="orderId" value={props.orderId} />
          <button type="submit" className="w-full rounded-xl bg-[#1A56DB] py-3 text-sm font-bold text-white">
            {"\uB0A9\uD488 \uC218\uB77D (\uC644\uB8CC)"}
          </button>
        </form>
        <form action={submitCustomOrderRevisionRequestAction} className="space-y-2">
          <input type="hidden" name="orderId" value={props.orderId} />
          <textarea
            name="requestNote"
            required
            rows={3}
            placeholder={"\uC218\uC815 \uC694\uCCAD \uC0AC\uC720"}
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
          />
          <button type="submit" className="w-full rounded-xl border border-amber-300 bg-amber-50 py-3 text-sm font-bold text-amber-950">
            {"\uC218\uC815 \uC694\uCCAD"}
          </button>
        </form>
        <form action={submitCustomOrderDisputeAction} className="space-y-2 border-t border-slate-100 pt-3">
          <input type="hidden" name="orderId" value={props.orderId} />
          <textarea
            name="disputeBody"
            required
            rows={3}
            placeholder={"\uBD84\uC7C1 \uC2E0\uCCAD \uC0AC\uC720"}
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
          />
          <button type="submit" className="w-full rounded-xl border border-red-200 bg-red-50 py-3 text-sm font-bold text-red-900">
            {"\uBD84\uC7C1 \uC2E0\uCCAD"}
          </button>
        </form>
      </section>

      <Link href={`/custom-request/orders/${props.orderId}`} className="inline-flex text-sm font-bold text-[#1A56DB] hover:underline">
        {"\u2190 \uC8FC\uBB38\uBC29\uC73C\uB85C"}
      </Link>
    </div>
  );
}
