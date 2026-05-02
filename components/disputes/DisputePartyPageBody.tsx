import type { DisputeBundle } from "@/lib/disputes/disputeQueries";
import { pickText, statusBadgeText, w22EntityLine } from "@/lib/disputes/disputeQueries";
import { DisputeKeyValueList } from "@/components/disputes/DisputeKeyValueList";
import { USER_UI_LOAD_FAILED } from "@/lib/constants/userFacingMessages";

type Row = Record<string, unknown>;

export function DisputePartyPageBody(props: { bundle: DisputeBundle; reasonLabel: string }) {
  const { bundle, reasonLabel } = props;
  if (bundle.modLogs.error) {
    console.error("[DisputePartyPageBody] modLogs.error", bundle.modLogs.error);
  }
  const d = bundle.dispute.row;
  const state = statusBadgeText(d, ["status", "state", "phase", "progress", "resolution"]);
  const reason = pickText(d, ["reason", "description", "message", "body", "summary", "title"]);
  return (
    <div className="space-y-3">
      <section className="rounded-2xl border border-slate-200 bg-white p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-extrabold text-slate-900">현재 처리 상태</h2>
          <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-extrabold text-amber-950">{state}</span>
        </div>
        <p className="mt-1 text-xs text-slate-500">접수 번호: {pickText(d, ["id", "uuid"])}</p>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4">
        <h2 className="text-lg font-extrabold text-slate-900">신청 사유</h2>
        <p className="mt-2 text-sm text-slate-800">
          <span className="text-slate-500">{reasonLabel}</span> {reason}
        </p>
        <p className="mt-1 text-xs text-slate-500">유형: {pickText(d, ["type", "kind", "category", "dispute_type", "reason_code"])}</p>
      </section>

      <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50/60 p-3 text-sm text-slate-600">
        <h3 className="font-extrabold text-slate-800">증빙·첨부(자리)</h3>
        <p className="mt-1 text-xs">Storage / 업로드 API 연동 전 — 아래는 스켈레톤</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-10 w-28 animate-pulse rounded border border-slate-200 bg-slate-200/50" />
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-extrabold text-slate-800">처리 로그(운영/모더레이션)</h3>
        <p className="text-xs text-slate-500">
          {bundle.modLogs.table ? `처리 이력 ${bundle.modLogs.rows.length}건` : "표시할 처리 이력이 없습니다."}
        </p>
        {bundle.modLogs.table && bundle.modLogs.rows.length ? (
          <ul className="mt-1 list-disc pl-5 text-sm text-slate-700">
            {bundle.modLogs.rows.map((r, i) => (
              <li key={i}>{JSON.stringify(r).slice(0, 220)}</li>
            ))}
          </ul>
        ) : (
          <div className="mt-1 space-y-1 text-sm text-slate-600">
            <p>{bundle.modLogs.error ? USER_UI_LOAD_FAILED : "표시할 이벤트 로그가 없습니다."}</p>
            <p className="text-xs text-slate-500">
              fallback(분쟁 본문 타임스탬프): created_at {String((d as Row).created_at ?? "—")} · updated_at{" "}
              {String((d as Row).updated_at ?? "—")}
            </p>
          </div>
        )}
      </div>

      <section className="rounded-xl border border-slate-200 bg-slate-50/80 p-3 text-sm text-slate-800">
        <h3 className="font-extrabold">관련 주문 / 결제 / 구독 요약</h3>
        <p className="mt-1 text-xs text-slate-600">환불·결제·구독·맞춤의뢰 주문 등 연결 정보를 요약해 보여 드려요.</p>
        <ul className="mt-2 list-inside list-disc space-y-1 text-xs text-slate-800">
          <li>{w22EntityLine("환불", bundle.refund.table, bundle.refund.row, bundle.refund.error)}</li>
          <li>{w22EntityLine("결제", bundle.payment.table, bundle.payment.row, bundle.payment.error)}</li>
          <li>{w22EntityLine("구독", bundle.subscription.table, bundle.subscription.row, bundle.subscription.error)}</li>
          <li>{w22EntityLine("맞춤의뢰 주문", bundle.customOrder.table, bundle.customOrder.row, bundle.customOrder.error)}</li>
        </ul>
      </section>

      <div className="grid gap-2 md:grid-cols-2">
        <DisputeKeyValueList title="관련 환불(refunds)" row={bundle.refund.row} />
        <DisputeKeyValueList title="관련 결제(payments / order_id 연계 시)" row={bundle.payment.row} />
        <DisputeKeyValueList title="구독(subscriptions) 연계" row={bundle.subscription.row} />
        <DisputeKeyValueList title="맞춤의뢰 주문(custom_request_orders · 별도 거래)" row={bundle.customOrder.row} />
      </div>

      <p className="text-xs text-slate-500">일부 항목은 진행 단계에 따라 비어 있을 수 있어요.</p>
    </div>
  );
}
