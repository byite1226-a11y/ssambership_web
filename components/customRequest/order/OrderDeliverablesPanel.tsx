import { pickDisplayField } from "@/lib/customRequest/customRequestQueries";
import { CustomRequestSimpleTable } from "@/components/customRequest/CustomRequestSimpleTable";
import { FormSubmitButton } from "@/components/qna/FormSubmitButton";
import { submitMentorOrderDeliverableAction } from "@/lib/customRequest/orderMentorActions";
import type { AppRole } from "@/lib/types/user";
import type { OrderDetailPageData } from "@/lib/customRequest/orderDetailQueries";

type Row = Record<string, unknown>;
type Props = {
  detail: OrderDetailPageData;
  orderId: string;
  view: "student" | "mentor";
  actorRole: AppRole;
  /** null = 멘토 납품 등록 폼 사용 가능(상태·역할·접근 충족) */
  mentorDeliverableBlockReason: string | null;
};

function attachmentSkeleton() {
  return (
    <div className="flex flex-wrap gap-2">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="h-9 w-32 animate-pulse rounded border border-slate-200 bg-slate-200/60"
          aria-hidden
        />
      ))}
    </div>
  );
}

export function OrderDeliverablesPanel({
  detail,
  orderId,
  view,
  actorRole,
  mentorDeliverableBlockReason,
}: Props) {
  const d = detail.bundle.deliverables;
  const latest = detail.latestDeliverable;
  const err = d.error;
  const showMentorForm = view === "mentor" && actorRole === "mentor" && !mentorDeliverableBlockReason;

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-extrabold text-slate-900">납품(버전)</h3>
      {err ? <p className="text-sm text-amber-800">납품: {err}</p> : null}
      {d.table && d.rows.length ? (
        <CustomRequestSimpleTable result={d} title="custom_order_deliverables" />
      ) : (
        <p className="text-sm text-slate-600">
          납품 행 없음. {d.error ?? d.sourceNote}
        </p>
      )}

      {latest && (
        <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-3 text-sm text-slate-800">
          <p className="text-xs font-bold text-blue-900/80">최신 납품(우선)</p>
          <ul className="mt-1 list-inside list-disc text-xs sm:text-sm">
            <li>id: {pickDisplayField(latest, ["id"])}</li>
            <li>version: {String((latest as Row).version ?? "—")}</li>
            <li>state: {pickDisplayField(latest, ["state", "status", "label"])}</li>
            <li>갱신: {pickDisplayField(latest, ["updated_at", "submitted_at", "created_at"])}</li>
          </ul>
        </div>
      )}

      {view === "mentor" && actorRole === "mentor" ? (
        <div className="mt-2 rounded-xl border border-slate-200 bg-slate-50/90 p-3">
          <p className="text-xs font-extrabold text-slate-800">멘토 납품(텍스트) 등록</p>
          {mentorDeliverableBlockReason ? (
            <p className="mt-1 text-sm text-amber-900" title={mentorDeliverableBlockReason}>
              {mentorDeliverableBlockReason}
            </p>
          ) : null}
          {showMentorForm && orderId ? (
            <form action={submitMentorOrderDeliverableAction} className="mt-2 space-y-2">
              <input type="hidden" name="orderId" value={orderId} />
              <label className="block text-sm font-bold text-slate-800">
                납품 본문
                <textarea
                  name="deliverableBody"
                  required
                  rows={4}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white p-2 text-sm text-slate-900"
                  placeholder="텍스트 납품(스토리지 URL은 후속). 작업 시작(open) 뒤 제출."
                />
              </label>
              <FormSubmitButton
                idleLabel="납품 등록"
                pendingLabel="등록 중…"
                className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-bold text-white enabled:hover:bg-slate-800"
              />
            </form>
          ) : null}
        </div>
      ) : null}

      <div>
        <p className="text-xs font-bold text-slate-600">첨부·파일(자리)</p>
        <p className="mt-1 text-xs text-slate-500">스토리지/업로드 API 연결 전 — 비활성</p>
        {attachmentSkeleton()}
      </div>
    </div>
  );
}
