import { submitCustomOrderRevisionRequestAction } from "@/lib/customRequest/orderRevisionActions";
import type { OrderDetailPageData } from "@/lib/customRequest/orderDetailQueries";
import { pickDisplayField } from "@/lib/customRequest/customRequestQueries";
import type { AppRole } from "@/lib/types/user";
import { mapDataErrorMessage } from "@/lib/utils/mapDataError";

type Row = Record<string, unknown>;

type Props = {
  detail: OrderDetailPageData;
  orderId: string;
  actorRole: AppRole;
  hasOrderPartyAccess: boolean;
  /** null이면 학생 수정 요청 폼을 표시(서버 액션이 다시 검증) */
  studentRevisionRequestDisabledReason: string | null;
};

function revisionBody(r: Row) {
  return pickDisplayField(r, ["request_note", "note", "body", "message", "text"]);
}

export function OrderRevisionsPanel({
  detail,
  orderId,
  actorRole,
  hasOrderPartyAccess,
  studentRevisionRequestDisabledReason,
}: Props) {
  const rev = detail.revisions;
  const rows = (rev.rows ?? []) as Row[];
  const hasTable = Boolean(rev.table) && !rev.error;
  const canShowComposer = actorRole === "student" && hasOrderPartyAccess && Boolean(String(orderId).trim());

  return (
    <section
      id="order-revisions"
      className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-800 shadow-sm"
    >
      <h3 className="text-base font-bold text-slate-900">수정 요청</h3>
      <p className="mt-1 text-xs text-slate-500">납품·검토 중 의뢰자가 멘토에게 보내는 수정 사항이 여기 누적됩니다(완료된 주문은 제외).</p>

      {canShowComposer && studentRevisionRequestDisabledReason == null ? (
        <form action={submitCustomOrderRevisionRequestAction} className="mt-4 space-y-2">
          <input type="hidden" name="orderId" value={orderId} />
          <label className="sr-only" htmlFor="order-revision-note">
            수정 요청 내용
          </label>
          <textarea
            id="order-revision-note"
            name="requestNote"
            className="min-h-[100px] w-full rounded-lg border border-slate-200 bg-slate-50/50 px-2.5 py-2 text-slate-900"
            maxLength={8000}
            placeholder="수정이 필요한 부분을 구체적으로 적어 주세요."
            required
            autoComplete="off"
          />
          <button
            type="submit"
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
          >
            수정 요청 보내기
          </button>
        </form>
      ) : actorRole === "student" && canShowComposer && studentRevisionRequestDisabledReason ? (
        <p className="mt-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600" role="status">
          {studentRevisionRequestDisabledReason}
        </p>
      ) : null}

      <div className="mt-5">
        <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-400">내역</h4>
        {hasTable && rows.length > 0 ? (
          <ul className="mt-2 max-h-72 space-y-3 overflow-y-auto">
            {rows.map((r, i) => {
              const at = r.created_at != null ? String(r.created_at).replace("T", " ").slice(0, 16) : "—";
              return (
                <li key={String(r.id ?? i)} className="rounded-lg border border-slate-200 bg-slate-50/30 px-3 py-2.5">
                  <p className="text-[11px] text-slate-400">{at}</p>
                  <p className="mt-1.5 whitespace-pre-wrap text-slate-800">{revisionBody(r)}</p>
                </li>
              );
            })}
          </ul>
        ) : hasTable && rows.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">수정 요청이 아직 없습니다.</p>
        ) : (
          <p className="mt-2 text-sm text-slate-500">
            {rev.error
              ? `수정 요청을 불러올 수 없습니다. ${mapDataErrorMessage(String(rev.error))}`
              : "수정 요청 내역을 불러올 수 없습니다. 잠시 후 다시 시도해 주세요."}
          </p>
        )}
      </div>
    </section>
  );
}
