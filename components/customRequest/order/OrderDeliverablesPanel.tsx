import { pickDisplayField } from "@/lib/customRequest/customRequestQueries";
import { downloadCustomOrderDeliverableAction } from "@/lib/customRequest/orderDeliverableDownloadActions";
import { pickStoragePathFromDeliverableRow } from "@/lib/customRequest/orderDeliverableFiles";
import { submitMentorOrderDeliverableAction } from "@/lib/customRequest/orderMentorActions";
import {
  deliverableVersionLabelKorean,
  formatOrderRoomDateTime,
  orderStatusLabelForUi,
  ORDER_ROOM_CARD_CLASS,
} from "@/lib/customRequest/orderLifecycleConstants";
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
  /** 종료 주문: 멘토 납품 등록 블록 전체 비표시(목록·다운로드는 유지) */
  orderTerminal?: boolean;
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
  const v = (() => {
    for (const k of ["submitted_at", "created_at", "updated_at"] as const) {
      const x = r[k];
      if (x != null) {
        return x;
      }
    }
    return null;
  })();
  return formatOrderRoomDateTime(v);
}

export function OrderDeliverablesPanel({
  detail,
  orderId,
  view,
  actorRole,
  mentorDeliverableBlockReason,
  orderTerminal = false,
}: Props) {
  const d = detail.bundle.deliverables;
  const err = d.error;
  const showMentorForm = view === "mentor" && actorRole === "mentor" && !mentorDeliverableBlockReason;
  const rows = (d.rows ?? []) as Row[];
  const canDownload = (actorRole === "student" || actorRole === "mentor" || actorRole === "admin") && orderId.trim().length > 0;

  return (
    <section className={ORDER_ROOM_CARD_CLASS}>
      <div className="space-y-3">
        <div className="mb-3">
          <h3 className="text-sm font-bold text-slate-950">납품</h3>
          <p className="mt-0.5 text-xs text-slate-500">버전별 납품물·멘토 등록</p>
        </div>
      {err ? <p className="text-sm text-amber-800">정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.</p> : null}
      {d.table && rows.length > 0 ? (
        <ul className="space-y-2">
          {rows.map((r, i) => {
            const id = String(r.id ?? i);
            const statusRaw = pickDisplayField(r, ["state", "status", "label"]);
            const status =
              statusRaw === "—" || !String(statusRaw).trim() ? "—" : orderStatusLabelForUi(String(statusRaw));
            const fileName = displayFileName(r);
            const dl = hasDownloadableFile(r);
            const hasNamedFile = fileName !== "—" && String(fileName).trim().length > 0;
            return (
              <li
                key={id}
                className="rounded-xl border border-blue-100/50 bg-white px-3 py-2.5 text-sm text-slate-800 shadow-sm"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="text-xs font-semibold text-slate-700">
                    {deliverableVersionLabelKorean((r as Row).version, i)}
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-600">
                  <span className="text-slate-500">등록일: </span>
                  <span className="font-medium text-slate-800">{submittedAt(r)}</span>
                </p>
                <p className="mt-1 text-xs text-slate-600">
                  상태: <span className="font-medium text-slate-800">{status}</span>
                </p>
                {dl && canDownload ? (
                  <div className="mt-2">
                    {hasNamedFile || pickSize(r) != null ? (
                      <p className="mb-1.5 break-all text-slate-900">
                        {hasNamedFile ? fileName : "첨부 파일"}
                        {pickSize(r) != null ? (
                          <span className="ml-2 text-xs text-slate-500">({formatBytes(pickSize(r))})</span>
                        ) : null}
                      </p>
                    ) : null}
                    <form action={downloadCustomOrderDeliverableAction} className="inline">
                      <input type="hidden" name="orderId" value={orderId} />
                      <input type="hidden" name="deliverableId" value={id} />
                      <button
                        type="submit"
                        className="rounded-md border border-slate-300 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-800 hover:bg-slate-100"
                      >
                        첨부 파일 다운로드
                      </button>
                    </form>
                  </div>
                ) : hasNamedFile || pickSize(r) != null ? (
                  <p className="mt-0.5 break-all text-slate-900">
                    {hasNamedFile ? fileName : "첨부"}
                    {pickSize(r) != null ? (
                      <span className="ml-2 text-xs text-slate-500">({formatBytes(pickSize(r))})</span>
                    ) : null}
                  </p>
                ) : (
                  <p className="mt-0.5 text-sm text-slate-600">첨부 파일 없음</p>
                )}
              </li>
            );
          })}
        </ul>
      ) : d.table ? (
        <p className="text-sm text-slate-600">아직 등록된 납품물이 없습니다.</p>
      ) : (
        <p className="text-sm text-slate-600">정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.</p>
      )}

      {!orderTerminal && view === "mentor" && actorRole === "mentor" ? (
        <div className="mt-2 rounded-xl border border-blue-100/60 bg-blue-50/50 p-3">
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
                className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-bold text-white enabled:hover:bg-blue-500"
              />
            </form>
          ) : null}
        </div>
      ) : null}
      </div>
    </section>
  );
}
