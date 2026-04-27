import Link from "next/link";
import type { DisputeBundle, DisputeActorSummary } from "@/lib/disputes/disputeQueries";
import { pickText, statusBadgeText, w22EntityLine } from "@/lib/disputes/disputeQueries";
import { DisputeKeyValueList } from "@/components/disputes/DisputeKeyValueList";

type Row = Record<string, unknown>;

function pickFirstString(row: Row | null, keys: string[]): string | null {
  if (!row) return null;
  for (const k of keys) {
    const v = row[k];
    if (typeof v === "string" && v.length > 0) {
      return v;
    }
  }
  return null;
}

function ActorLine(props: { label: string; a: DisputeActorSummary }) {
  return (
    <li className="text-sm">
      <span className="text-slate-500">{props.label}:</span>{" "}
      <span className="font-bold text-slate-900">{props.a.display}</span>{" "}
      <code className="text-[10px] text-slate-400">{props.a.id ?? "—"}</code>{" "}
      <span className="text-xs text-slate-500">({props.a.roleHint} · {props.a.probe})</span>
    </li>
  );
}

export function DisputeAdminPageBody(props: {
  bundle: DisputeBundle;
  actors: { reporter: DisputeActorSummary; student: DisputeActorSummary; mentor: DisputeActorSummary } | null;
}) {
  const d = props.bundle.dispute.row;
  const st = statusBadgeText(d, ["status", "state", "phase", "resolution", "outcome"]);
  const b = props.bundle;
  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-slate-200 bg-amber-50/40 p-4">
        <h2 className="text-sm font-extrabold text-slate-500">사건 요약(관리자)</h2>
        <p className="mt-1 text-slate-900">
          {pickText(d, ["title", "name", "summary", "id"])} · {pickText(d, ["type", "kind", "category", "source"])}
        </p>
        <p className="mt-1 text-xs text-slate-600">우선순위/심각도(있을 때): {pickText(d, ["priority", "severity", "impact", "urgency"])}</p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-500">처리 상태</span>
          <span className="rounded-full border border-amber-300 bg-amber-100 px-2 py-0.5 text-xs font-extrabold text-amber-950">{st}</span>
        </div>
        <p className="mt-2 font-mono text-[11px] leading-relaxed text-slate-600">Supabase probe: {b.probe}</p>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 text-sm">
        <h2 className="text-sm font-extrabold text-slate-900">관련 주문·결제·구독(한 줄)</h2>
        <ul className="mt-2 list-inside list-disc space-y-1 text-xs text-slate-800">
          <li>{w22EntityLine("환불", b.refund.table, b.refund.row, b.refund.error)}</li>
          <li>{w22EntityLine("결제", b.payment.table, b.payment.row, b.payment.error)}</li>
          <li>{w22EntityLine("구독", b.subscription.table, b.subscription.row, b.subscription.error)}</li>
          <li>{w22EntityLine("맞춤의뢰", b.customOrder.table, b.customOrder.row, b.customOrder.error)}</li>
        </ul>
        {(() => {
          const refId = pickFirstString(b.refund.row, ["id", "refund_id", "refundId"]);
          if (!refId) {
            return null;
          }
          return (
            <p className="mt-2 text-sm text-slate-800">
              <Link
                className="font-extrabold text-indigo-800 underline"
                href={`/admin/refunds?refundId=${encodeURIComponent(refId)}`}
                prefetch={false}
              >
                환불 큐(목록)에서 id 매칭
              </Link>
            </p>
          );
        })()}
      </section>

      {props.actors ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-4">
          <h2 className="text-sm font-extrabold text-slate-900">관련 사용자(users)</h2>
          <ul className="mt-2 list-inside list-disc space-y-1 text-slate-800">
            <ActorLine label="신청/신고" a={props.actors.reporter} />
            <ActorLine label="학생·의뢰" a={props.actors.student} />
            <ActorLine label="멘토" a={props.actors.mentor} />
          </ul>
        </section>
      ) : null}

      <div className="grid gap-2 md:grid-cols-2">
        <DisputeKeyValueList title="dispute (원시)" row={d} maxKeys={14} />
        <div className="space-y-2">
          <DisputeKeyValueList title="refunds" row={props.bundle.refund.row} maxKeys={8} />
          <DisputeKeyValueList title="payments" row={props.bundle.payment.row} maxKeys={8} />
        </div>
        <DisputeKeyValueList title="subscriptions" row={props.bundle.subscription.row} maxKeys={8} />
        <DisputeKeyValueList title="custom_request_orders" row={props.bundle.customOrder.row} maxKeys={8} />
      </div>

      <label className="block text-sm text-slate-800">
        <span className="font-extrabold">내부 메모(자리)</span>
        <p className="text-xs text-slate-500">DB 컬럼·또는 admin_notes(후순) + 감사 로그와 함께 쓰기</p>
        <textarea
          readOnly
          className="mt-1 w-full cursor-not-allowed rounded border border-slate-200 bg-slate-50 p-2 text-sm"
          rows={3}
          placeholder="server action + audit(후속)"
        />
      </label>

      <div className="flex flex-wrap gap-2">
        <button type="button" disabled className="cursor-not-allowed rounded-lg bg-slate-300 px-3 py-1.5 text-sm font-bold text-slate-600">
          승인·환불(연동 예정)
        </button>
        <button type="button" disabled className="cursor-not-allowed rounded-lg bg-slate-300 px-3 py-1.5 text-sm font-bold text-slate-600">
          반려·기각(연동 예정)
        </button>
        <button type="button" disabled className="cursor-not-allowed rounded-lg bg-amber-200/80 px-3 py-1.5 text-sm font-bold text-amber-950">
          부분 환불(연동 예정)
        </button>
      </div>

      <div>
        <h3 className="text-sm font-extrabold text-slate-800">처리 이력(로그)</h3>
        <p className="text-xs text-slate-500">moderation_logs / dispute_events 후보: {b.modLogs.table ?? "—"}</p>
        {b.modLogs.rows.length ? (
          <ul className="mt-1 max-h-48 list-disc space-y-1 overflow-auto pl-5 text-xs text-slate-700">
            {b.modLogs.rows.map((r, i) => {
              const row = r as Row;
              return (
                <li key={i}>
                  {String(row.id ?? i)}: {String(row.event_type ?? row.type ?? row.action ?? row.verb ?? JSON.stringify(r).slice(0, 120))}
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="text-sm text-slate-600">로그 없음 — {b.modLogs.error ?? "FK·RLS·테이블 프로브 확인"}</p>
        )}
      </div>
    </div>
  );
}
