import type { DisputeBundle } from "@/lib/disputes/disputeQueries";
import { formatModLogLine, pickText, statusBadgeText, w22EntityLine } from "@/lib/disputes/disputeQueries";
import { partyDisputeStatusKo, partyDisputeTypeKo, shortDisputeRef } from "@/lib/disputes/disputeListQueries";
import { DisputeKeyValueList } from "@/components/disputes/DisputeKeyValueList";
import { USER_UI_LOAD_FAILED } from "@/lib/constants/userFacingMessages";

type Row = Record<string, unknown>;

export function DisputePartyPageBody(props: { bundle: DisputeBundle; reasonLabel: string }) {
  const { bundle, reasonLabel } = props;
  if (bundle.modLogs.error) {
    console.error("[DisputePartyPageBody] modLogs.error", bundle.modLogs.error);
  }
  const d = bundle.dispute.row;
  const state = partyDisputeStatusKo(statusBadgeText(d, ["status", "state", "phase", "progress", "resolution"]));
  const reason = pickText(d, ["reason", "description", "message", "body", "summary", "title"]);
  const typeRaw = pickText(d, ["type", "kind", "category", "dispute_type", "reason_code"]);
  const typeLabel = partyDisputeTypeKo(typeRaw === "—" ? "" : typeRaw);
  const idPick = pickText(d, ["id", "uuid"]);
  const receiptRef = shortDisputeRef(idPick === "—" ? "" : idPick);
  return (
    <div className="space-y-3">
      <section className="rounded-2xl border border-slate-200 bg-white p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-extrabold text-slate-900">현재 처리 상태</h2>
          <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-extrabold text-amber-950">{state}</span>
        </div>
        <p className="mt-1 text-xs text-slate-500">접수 번호: {receiptRef || "—"}</p>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4">
        <h2 className="text-lg font-extrabold text-slate-900">신청 사유</h2>
        <p className="mt-2 text-sm text-slate-800">
          <span className="text-slate-500">{reasonLabel}</span> {reason}
        </p>
        <p className="mt-1 text-xs text-slate-500">유형: {typeLabel}</p>
      </section>

      <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50/60 p-3 text-sm text-slate-600">
        <h3 className="font-extrabold text-slate-800">증빙·첨부</h3>
        <p className="mt-1 text-xs">첨부된 증빙 파일이 없습니다.</p>
      </div>

      <div>
        <h3 className="text-sm font-extrabold text-slate-800">처리 로그(운영/모더레이션)</h3>
        <p className="text-xs text-slate-500">
          {bundle.modLogs.table ? `처리 이력 ${bundle.modLogs.rows.length}건` : "표시할 처리 이력이 없습니다."}
        </p>
        {bundle.modLogs.table && bundle.modLogs.rows.length ? (
          <ul className="mt-1 list-disc pl-5 text-sm text-slate-700">
            {bundle.modLogs.rows.map((r, i) => (
              <li key={i}>{formatModLogLine(r as Row)}</li>
            ))}
          </ul>
        ) : (
          <div className="mt-1 space-y-1 text-sm text-slate-600">
            <p>{bundle.modLogs.error ? USER_UI_LOAD_FAILED : "표시할 이벤트 로그가 없습니다."}</p>
            <p className="text-xs text-slate-500">
              접수·갱신 시각은 운영 확인 후 안내될 수 있어요. 급한 경우 고객센터로 문의해 주세요.
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
        <DisputeKeyValueList title="환불 정보" row={bundle.refund.row} />
        <DisputeKeyValueList title="결제 정보" row={bundle.payment.row} />
        <DisputeKeyValueList title="구독 정보" row={bundle.subscription.row} />
        <DisputeKeyValueList title="맞춤의뢰 주문 정보" row={bundle.customOrder.row} />
      </div>

      <p className="text-xs text-slate-500">일부 항목은 진행 단계에 따라 비어 있을 수 있어요.</p>
    </div>
  );
}
