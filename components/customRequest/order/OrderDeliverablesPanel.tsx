import { pickDisplayField } from "@/lib/customRequest/customRequestQueries";
import { downloadCustomOrderDeliverableAction } from "@/lib/customRequest/orderDeliverableDownloadActions";
import { pickStoragePathFromDeliverableRow } from "@/lib/customRequest/orderDeliverableFiles";
import { submitMentorOrderDeliverableAction } from "@/lib/customRequest/orderMentorActions";
import { FormSubmitButton } from "@/components/qna/FormSubmitButton";
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

function formatBytes(n: unknown): string {
  if (typeof n !== "number" || !Number.isFinite(n) || n < 0) {
    return "—";
  }
  if (n < 1024) {
    return `${n} B`;
  }
  if (n < 1024 * 1024) {
    return `${(n / 1024).toFixed(1)} KB`;
  }
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

function displayFileName(r: Row): string {
  const fromMeta = pickDisplayField(r, ["original_filename", "file_name", "filename", "original_name"]);
  if (fromMeta && fromMeta !== "—") {
    return fromMeta;
  }
  return "—";
}

function pickSize(r: Row): number | null {
  for (const k of ["file_size", "file_size_bytes", "size_bytes", "size"] as const) {
    const v = r[k];
    if (typeof v === "number" && Number.isFinite(v)) {
      return v;
    }
  }
  return null;
}

function hasDownloadableFile(r: Row): boolean {
  const p = pickStoragePathFromDeliverableRow(r);
  return Boolean(p && p.length > 0 && !p.startsWith("http://") && !p.startsWith("https://"));
}

function submittedAt(r: Row): string {
  return pickDisplayField(r, ["submitted_at", "created_at", "updated_at"]);
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
  const rows = (d.rows ?? []) as Row[];
  const canDownload = (actorRole === "student" || actorRole === "mentor" || actorRole === "admin") && orderId.trim().length > 0;

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-extrabold text-slate-900">납품(버전)</h3>
      {err ? <p className="text-sm text-amber-800">납품: {err}</p> : null}
      {d.table && rows.length > 0 ? (
        <ul className="space-y-2">
          {rows.map((r, i) => {
            const id = String(r.id ?? i);
            const version = String(r.version ?? "—");
            const status = pickDisplayField(r, ["state", "status", "label"]);
            const fileName = displayFileName(r);
            const dl = hasDownloadableFile(r);
            return (
              <li
                key={id}
                className="rounded-xl border border-slate-200 bg-white/90 px-3 py-2.5 text-sm text-slate-800 shadow-sm"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="font-mono text-xs text-slate-500">v{version}</span>
                  <span className="text-xs text-slate-500">{submittedAt(r)}</span>
                </div>
                <p className="mt-1 text-xs text-slate-600">
                  상태: <span className="font-medium text-slate-800">{status}</span>
                </p>
                <p className="mt-0.5 break-all text-slate-900">
                  파일: {fileName}
                  {pickSize(r) != null ? (
                    <span className="ml-2 text-xs text-slate-500">({formatBytes(pickSize(r))})</span>
                  ) : null}
                </p>
                {dl && canDownload ? (
                  <form action={downloadCustomOrderDeliverableAction} className="mt-2">
                    <input type="hidden" name="orderId" value={orderId} />
                    <input type="hidden" name="deliverableId" value={id} />
                    <button
                      type="submit"
                      className="rounded-md border border-slate-300 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-800 hover:bg-slate-100"
                    >
                      다운로드
                    </button>
                  </form>
                ) : null}
              </li>
            );
          })}
        </ul>
      ) : d.table ? (
        <p className="text-sm text-slate-600">납품 행 없음. {d.error ?? d.sourceNote}</p>
      ) : (
        <p className="text-sm text-slate-600">납품: {d.error ?? d.sourceNote}</p>
      )}

      {latest && (
        <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-3 text-sm text-slate-800">
          <p className="text-xs font-bold text-blue-900/80">최신 납품(우선)</p>
          <ul className="mt-1 list-inside list-disc text-xs sm:text-sm">
            <li>id: {pickDisplayField(latest, ["id"])}</li>
            <li>version: {String((latest as Row).version ?? "—")}</li>
            <li>state: {pickDisplayField(latest, ["state", "status", "label"])}</li>
            <li>파일: {displayFileName(latest as Row)}</li>
            <li>갱신: {pickDisplayField(latest, ["updated_at", "submitted_at", "created_at"])}</li>
          </ul>
        </div>
      )}

      {view === "mentor" && actorRole === "mentor" ? (
        <div className="mt-2 rounded-xl border border-slate-200 bg-slate-50/90 p-3">
          <p className="text-xs font-extrabold text-slate-800">멘토 납품 등록 (파일 + 설명)</p>
          <p className="mt-1 text-xs text-slate-600">
            PDF·이미지·ZIP·docx·pptx, 최대 20MB. 파일만 또는 설명만도 가능(둘 중 하나 이상).
          </p>
          {mentorDeliverableBlockReason ? (
            <p className="mt-1 text-sm text-amber-900" title={mentorDeliverableBlockReason}>
              {mentorDeliverableBlockReason}
            </p>
          ) : null}
          {showMentorForm && orderId ? (
            <form
              action={submitMentorOrderDeliverableAction}
              encType="multipart/form-data"
              className="mt-2 space-y-2"
            >
              <input type="hidden" name="orderId" value={orderId} />
              <label className="block text-sm font-bold text-slate-800">
                납품 파일
                <input
                  type="file"
                  name="deliverableFile"
                  className="mt-1 block w-full max-w-md text-sm text-slate-800 file:mr-2 file:rounded file:border file:border-slate-300 file:bg-white file:px-2 file:py-1"
                  accept=".pdf,.zip,.docx,.pptx,image/png,image/jpeg,image/webp,application/pdf,application/zip,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.presentationml.presentation"
                />
              </label>
              <label className="block text-sm font-bold text-slate-800">
                납품 설명 (선택, 텍스트-only 납품 시 필수)
                <textarea
                  name="deliverableBody"
                  rows={4}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white p-2 text-sm text-slate-900"
                  placeholder="파일에 덧붙일 설명 또는 텍스트-only 납품"
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
    </div>
  );
}
