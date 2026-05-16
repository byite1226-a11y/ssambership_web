import { submitCustomOrderRevisionRequestAction } from "@/lib/customRequest/orderRevisionActions";
import type { OrderDetailPageData } from "@/lib/customRequest/orderDetailQueries";
import { pickDisplayField } from "@/lib/customRequest/customRequestQueries";
import { formatOrderRoomDateTime } from "@/lib/customRequest/orderLifecycleConstants";
import type { AppRole } from "@/lib/types/user";

type Row = Record<string, unknown>;

type Props = {
  detail: OrderDetailPageData;
  orderId: string;
  actorRole: AppRole;
  hasOrderPartyAccess: boolean;
  /** null이면 학생 수정 요청 폼을 표시(서버 액션이 다시 검증) */
  studentRevisionRequestDisabledReason: string | null;
  /** 종료 주문: 폼·막힌 사유 박스 숨김(내역만) */
  orderTerminal?: boolean;
  /** 3열 레이아웃 우측: 히스토리 접기 */
  workspaceCompact?: boolean;
  /** 멘토 작업방: 수정 요청 블록 톤(reference 보라 계열) */
  revisionAccent?: "default" | "violet";
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
  orderTerminal = false,
  workspaceCompact = false,
  revisionAccent = "default",
}: Props) {
  const rev = detail.revisions;
  const rows = (rev.rows ?? []) as Row[];
  const hasTable = Boolean(rev.table) && !rev.error;
  const canShowComposer = actorRole === "student" && hasOrderPartyAccess && Boolean(String(orderId).trim());

  const accentSection =
    revisionAccent === "violet" ? "bg-gradient-to-br from-violet-50/40 via-white to-white ring-2 ring-violet-200/60" : "";

  return (
    <section
      id="order-revisions"
      className={`rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm hover:border-blue-200 hover:shadow-md transition-all duration-300 relative overflow-hidden text-sm text-slate-800 ${accentSection}`.trim()}
    >
      <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 mb-3">
        <h3 className="text-sm font-black uppercase tracking-wider text-slate-400">수정 요청 내역</h3>
      </div>
      <p className="mt-1 text-xs font-semibold text-slate-500 leading-normal">
        {workspaceCompact
          ? "의뢰자 → 멘토(납품·검토 중)"
          : "납품·검토 중 의뢰자가 멘토에게 보내는 수정 사항이 여기 누적됩니다(완료된 주문은 제외)."}
      </p>

      {!orderTerminal && canShowComposer && studentRevisionRequestDisabledReason == null ? (
        <form action={submitCustomOrderRevisionRequestAction} className="mt-4 space-y-3">
          <input type="hidden" name="orderId" value={orderId} />
          <label className="sr-only" htmlFor="order-revision-note">
            수정 요청 내용
          </label>
          <textarea
            id="order-revision-note"
            name="requestNote"
            className="min-h-[100px] w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-800 focus:border-violet-400 focus:ring-1 focus:ring-violet-400 transition"
            maxLength={8000}
            placeholder="수정이 필요한 부분을 구체적으로 적어 주세요."
            required
            autoComplete="off"
          />
          <button
            type="submit"
            className="rounded-xl bg-violet-600 px-4 py-2.5 text-xs font-black text-white hover:bg-violet-700 shadow-md shadow-violet-500/10 transition"
          >
            수정 요청 보내기
          </button>
        </form>
      ) : !orderTerminal && actorRole === "student" && canShowComposer && studentRevisionRequestDisabledReason ? (
        <p
          className={`mt-3 rounded-xl border px-3 py-2.5 text-xs leading-relaxed font-bold ${
            revisionAccent === "violet"
              ? "border-violet-200 bg-violet-50/80 text-violet-950"
              : "border-slate-200 bg-slate-50 text-slate-600"
          }`}
          role="status"
        >
          {studentRevisionRequestDisabledReason}
        </p>
      ) : null}

      <div className="mt-4">
        {workspaceCompact && hasTable && rows.length > 0 ? (
          <details className="group mt-1">
            <summary className="cursor-pointer list-none text-xs font-extrabold text-slate-500 marker:hidden [&::-webkit-details-marker]:hidden flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5">
                <span className="text-slate-400 group-open:rotate-90 transition-transform">▸</span> 수정 요청 히스토리 ({rows.length})
              </span>
            </summary>
            <ul className="mt-3 max-h-60 space-y-2.5 overflow-y-auto">
              {rows.map((r, i) => {
                const at = r.created_at != null ? formatOrderRoomDateTime(r.created_at) : "—";
                return (
                  <li key={String(r.id ?? i)} className="rounded-xl border border-slate-100 bg-slate-50/50 p-3 hover:border-violet-100 transition duration-200">
                    <p className="text-[10px] font-bold text-violet-400">{at}</p>
                    <p className="mt-1.5 whitespace-pre-wrap text-xs text-slate-700 leading-relaxed font-semibold">{revisionBody(r)}</p>
                  </li>
                );
              })}
            </ul>
          </details>
        ) : (
          <>
        <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">내역</h4>
        {hasTable && rows.length > 0 ? (
          <ul className="mt-2.5 max-h-72 space-y-3 overflow-y-auto">
            {rows.map((r, i) => {
              const at = r.created_at != null ? formatOrderRoomDateTime(r.created_at) : "—";
              return (
                <li
                  key={String(r.id ?? i)}
                  className={`rounded-xl border px-3 py-3 transition duration-200 hover:shadow-sm ${
                    revisionAccent === "violet"
                      ? "border-violet-100 bg-violet-50/20 hover:border-violet-300"
                      : "border-blue-100/50 bg-blue-50/10 hover:border-blue-300"
                  }`}
                >
                  <p className="text-[10px] font-bold text-slate-400">{at}</p>
                  <p className="mt-2 whitespace-pre-wrap text-xs text-slate-700 leading-relaxed font-semibold">{revisionBody(r)}</p>
                </li>
              );
            })}
          </ul>
        ) : hasTable && rows.length === 0 ? (
          <p className="mt-2 text-xs font-semibold text-slate-400 text-center py-4 bg-slate-50/30 rounded-xl">수정 요청이 아직 없습니다.</p>
        ) : (
          <p className="mt-2 text-xs font-semibold text-slate-400 text-center py-4 bg-slate-50/30 rounded-xl">
            {rev.error
              ? "수정 요청을 불러올 수 없습니다. 잠시 후 다시 시도해 주세요."
              : "수정 요청 내역을 불러올 수 없습니다. 잠시 후 다시 시도해 주세요."}
          </p>
        )}
          </>
        )}
      </div>
    </section>
  );
}
