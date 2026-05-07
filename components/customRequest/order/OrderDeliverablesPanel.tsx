import { pickDisplayField } from "@/lib/customRequest/customRequestQueries";
import { downloadCustomOrderDeliverableAction } from "@/lib/customRequest/orderDeliverableDownloadActions";
import { pickStoragePathFromDeliverableRow } from "@/lib/customRequest/orderDeliverableFiles";
import { submitMentorOrderDeliverableAction } from "@/lib/customRequest/orderMentorActions";
import {
  deliverableVersionLabelKorean,
  formatOrderRoomDateTime,
  orderStatusLabelForUi,
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
  const showMentorForm =
    view === "mentor" && actorRole === "mentor" && !orderTerminal && !mentorDeliverableBlockReason;
  const rows = (d.rows ?? []) as Row[];
  const canDownload = (actorRole === "student" || actorRole === "mentor" || actorRole === "admin") && orderId.trim().length > 0;

  return (
    <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm hover:border-blue-200 hover:shadow-md transition-all duration-300 relative overflow-hidden">
      <div className="space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 mb-3">
          <h3 className="text-sm font-black uppercase tracking-wider text-slate-400">납품 완료물</h3>
          <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[9px] font-black text-blue-600">파일 보관함</span>
        </div>
      {err ? <p className="text-sm font-bold text-amber-800">정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.</p> : null}
      {d.table && rows.length > 0 ? (
        <ul className="space-y-2.5">
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
                className="group/item rounded-xl border border-slate-100 bg-slate-50/50 p-3 text-sm text-slate-800 hover:bg-slate-50 hover:border-blue-100 transition-all duration-200"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-extrabold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                    {deliverableVersionLabelKorean((r as Row).version, i)}
                  </span>
                  <span className="text-[10px] font-bold text-slate-400">{submittedAt(r)}</span>
                </div>
                <div className="mt-2.5">
                  <p className="text-xs font-bold text-slate-800">상태: <span className="font-extrabold text-slate-900">{status}</span></p>
                </div>
                {dl && canDownload ? (
                  <div className="mt-3 border-t border-slate-100/50 pt-2.5">
                    {hasNamedFile || pickSize(r) != null ? (
                      <p className="mb-2 break-all text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                        <svg className="h-4 w-4 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span className="truncate">{hasNamedFile ? fileName : "첨부 파일"}</span>
                        {pickSize(r) != null ? (
                          <span className="shrink-0 text-[10px] font-bold text-slate-400">({formatBytes(pickSize(r))})</span>
                        ) : null}
                      </p>
                    ) : null}
                    <form action={downloadCustomOrderDeliverableAction} className="inline">
                      <input type="hidden" name="orderId" value={orderId} />
                      <input type="hidden" name="deliverableId" value={id} />
                      <button
                        type="submit"
                        className="inline-flex min-h-[32px] w-full items-center justify-center rounded-lg border border-slate-200 bg-white px-3 text-[11px] font-bold text-slate-700 shadow-sm hover:border-blue-300 hover:text-blue-600 transition"
                      >
                        다운로드 받기
                      </button>
                    </form>
                  </div>
                ) : hasNamedFile || pickSize(r) != null ? (
                  <p className="mt-2.5 break-all text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                    <span className="truncate">{hasNamedFile ? fileName : "첨부"}</span>
                    {pickSize(r) != null ? (
                      <span className="shrink-0 text-[10px] font-bold text-slate-400">({formatBytes(pickSize(r))})</span>
                    ) : null}
                  </p>
                ) : (
                  <p className="mt-2 text-xs text-slate-400 font-semibold">첨부 파일이 없습니다</p>
                )}
              </li>
            );
          })}
        </ul>
      ) : d.table ? (
        <p className="text-xs font-bold text-slate-400 text-center py-4 bg-slate-50/50 rounded-xl">아직 등록된 납품물이 없습니다.</p>
      ) : (
        <p className="text-xs font-bold text-slate-400 text-center py-4 bg-slate-50/50 rounded-xl">정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.</p>
      )}

      {!orderTerminal && view === "mentor" && actorRole === "mentor" ? (
        <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50/30 p-4 shadow-sm relative overflow-hidden">
          <p className="text-xs font-black text-blue-900 flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-600 animate-pulse" />
            멘토 납품 등록 (파일 + 설명)
          </p>
          <p className="mt-1 text-[11px] font-medium text-slate-500 leading-normal">
            PDF·이미지·ZIP·docx·pptx (최대 20MB) 업로드 지원. 파일 또는 설명 중 최소 1개는 포함되어야 등록 가능합니다.
          </p>
          {mentorDeliverableBlockReason ? (
            <p className="mt-2 text-xs font-bold text-amber-700 bg-amber-50 rounded-lg p-2 border border-amber-100" title={mentorDeliverableBlockReason}>
              {mentorDeliverableBlockReason}
            </p>
          ) : null}
          {showMentorForm && orderId ? (
            <form
              action={submitMentorOrderDeliverableAction}
              encType="multipart/form-data"
              className="mt-3.5 space-y-3"
            >
              <input type="hidden" name="orderId" value={orderId} />
              <label className="block text-xs font-bold text-slate-700">
                납품 파일 선택
                <input
                  type="file"
                  name="deliverableFile"
                  className="mt-1 block w-full text-xs text-slate-500 file:mr-2 file:rounded-lg file:border-0 file:bg-blue-600 file:px-3 file:py-1.5 file:text-xs file:font-bold file:text-white hover:file:bg-blue-700 transition cursor-pointer"
                  accept=".pdf,.zip,.docx,.pptx,image/png,image/jpeg,image/webp,application/pdf,application/zip,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.presentationml.presentation"
                />
              </label>
              <label className="block text-xs font-bold text-slate-700">
                납품 설명 작성 (선택)
                <textarea
                  name="deliverableBody"
                  rows={3}
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-white p-2.5 text-xs text-slate-800 placeholder-slate-400 focus:border-blue-400 focus:ring-1 focus:ring-blue-400 transition"
                  placeholder="다운로드 후 확인할 추가 가이드나 최종 산출물에 대한 상세 설명을 기입해 주세요."
                />
              </label>
              <FormSubmitButton
                idleLabel="납품물 제출하기"
                pendingLabel="제출 중…"
                className="min-h-[36px] w-full rounded-xl bg-blue-600 text-xs font-extrabold text-white shadow-md shadow-blue-500/10 hover:bg-blue-700 transition"
              />
            </form>
          ) : null}
        </div>
      ) : null}
      </div>
    </section>
  );
}
