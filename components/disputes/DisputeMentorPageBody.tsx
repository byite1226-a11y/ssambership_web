import type { DisputeBundle } from "@/lib/disputes/disputeQueries";
import { pickText, statusBadgeText } from "@/lib/disputes/disputeQueries";
import { DisputeKeyValueList } from "@/components/disputes/DisputeKeyValueList";
import { USER_UI_LOAD_FAILED } from "@/lib/constants/userFacingMessages";

type Row = Record<string, unknown>;

/**
 * DisputePartyPageBody와 별도(학생 상세 페이지 import 유지) — 멘토 관점 사건/의뢰/로그
 */
export function DisputeMentorPageBody(props: { bundle: DisputeBundle }) {
  const { bundle } = props;
  if (bundle.modLogs.error) {
    console.error("[DisputeMentorPageBody] modLogs.error", bundle.modLogs.error);
  }
  const d = bundle.dispute.row;
  const state = statusBadgeText(d, ["status", "state", "phase", "progress", "resolution"]);
  const title = pickText(d, ["title", "summary", "id"]);
  return (
    <div className="space-y-3">
      <section className="rounded-2xl border border-slate-200 bg-white p-4">
        <h2 className="text-lg font-extrabold text-slate-900">사건 요약 (멘토)</h2>
        <p className="mt-1 text-sm text-slate-800">{title}</p>
        <p className="mt-1 text-sm text-slate-700">
          <span className="text-slate-500">이슈/사유: </span>
          {pickText(d, ["reason", "description", "message", "body", "detail"])}
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-500">처리 상태</span>
          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-extrabold text-slate-800">{state}</span>
        </div>
        <p className="mt-1 text-xs text-slate-500">사건 정보를 불러왔습니다.</p>
      </section>

      <div className="grid gap-2 md:grid-cols-2">
        <DisputeKeyValueList title="맞춤의뢰/주문" row={bundle.customOrder.row} />
        <DisputeKeyValueList title="결제" row={bundle.payment.row} />
        <DisputeKeyValueList title="구독" row={bundle.subscription.row} />
        <DisputeKeyValueList title="환불" row={bundle.refund.row} maxKeys={10} />
      </div>

      <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50/60 p-3 text-sm text-slate-600">
        증빙·첨부(멘토): <input type="file" disabled className="ml-1 text-xs" title="Storage 후속" />
      </div>

      <div>
        <h3 className="text-sm font-extrabold text-slate-800">처리 로그</h3>
        {bundle.modLogs.table && bundle.modLogs.rows.length ? (
          <ul className="mt-1 list-disc pl-5 text-sm text-slate-700">
            {bundle.modLogs.rows.map((r, i) => {
              const row = r as Row;
              return (
                <li key={i}>
                  {String(row.created_at ?? row.id ?? i)}: {String(row.message ?? row.event_type ?? row.type ?? JSON.stringify(r).slice(0, 160))}
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="text-sm text-slate-600">{bundle.modLogs.error ? USER_UI_LOAD_FAILED : "표시할 처리 이력이 없습니다."}</p>
        )}
      </div>

      <p className="text-xs text-slate-500">일부 항목은 진행 단계에 따라 비어 있을 수 있어요.</p>
    </div>
  );
}
