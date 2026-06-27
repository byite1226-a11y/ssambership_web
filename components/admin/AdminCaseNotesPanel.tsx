import type { AdminCaseNotesResult } from "@/lib/admin/adminCaseNotes";
import { saveDisputeAdminNoteAction } from "@/lib/admin/adminDisputeActions";
import { saveContentReportAdminNoteAction } from "@/lib/admin/adminReportActions";

type Props = {
  targetKind: "dispute" | "content_report";
  targetId: string;
  notes: AdminCaseNotesResult;
  legacyNote?: string | null;
};

function targetInputName(kind: Props["targetKind"]): "disputeId" | "reportId" {
  return kind === "dispute" ? "disputeId" : "reportId";
}

function targetFormAction(kind: Props["targetKind"]) {
  return kind === "dispute" ? saveDisputeAdminNoteAction : saveContentReportAdminNoteAction;
}

export function AdminCaseNotesPanel(props: Props) {
  const missing = props.notes.status === "missing";
  const legacy = props.legacyNote?.trim() ?? "";

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="text-sm font-extrabold text-slate-900">운영 메모</h2>
          <p className="mt-1 text-xs text-slate-600">관리자 내부 타임라인으로 저장됩니다. 환불·정산·주문 상태는 변경하지 않습니다.</p>
        </div>
        <span className="rounded-lg border border-blue-100 bg-blue-50 px-2 py-1 text-[11px] font-bold text-[#2563EB]">
          {props.notes.notes.length}건
        </span>
      </div>

      {legacy ? (
        <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
          <p className="text-xs font-extrabold text-slate-600">기존 단일 메모</p>
          <p className="mt-1 whitespace-pre-wrap text-sm text-slate-800">{legacy}</p>
        </div>
      ) : null}

      {missing ? (
        <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs font-semibold text-amber-950">
          운영 메모 테이블이 아직 적용되지 않았습니다. 084 SQL 적용 후 새 메모 저장과 타임라인 조회가 활성화됩니다.
        </p>
      ) : (
        <form action={targetFormAction(props.targetKind)} className="mt-3 space-y-2 border-t border-slate-100 pt-3">
          <input type="hidden" name={targetInputName(props.targetKind)} value={props.targetId} />
          <label className="block text-xs font-extrabold text-slate-700" htmlFor={`admin-note-${props.targetKind}`}>
            새 메모
          </label>
          <textarea
            id={`admin-note-${props.targetKind}`}
            name="adminNote"
            rows={3}
            className="w-full rounded-xl border border-slate-200 bg-white p-2 text-sm text-slate-900 placeholder:text-slate-400"
            placeholder="내부 공유용 메모를 입력하세요."
          />
          <button type="submit" className="rounded-lg bg-[#2563EB] px-3 py-2 text-xs font-extrabold text-white hover:bg-blue-800">
            메모 추가
          </button>
        </form>
      )}

      {props.notes.status === "error" ? (
        <p className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-950">
          운영 메모를 불러오지 못했습니다. 권한 또는 연결 상태를 확인해 주세요.
        </p>
      ) : null}

      {props.notes.notes.length ? (
        <ol className="mt-4 space-y-2">
          {props.notes.notes.map((note) => (
            <li key={note.id} className="rounded-xl border border-slate-200 bg-slate-50/70 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                <span className="font-extrabold text-slate-700">{note.adminDisplay}</span>
                <time dateTime={note.createdAt}>{note.createdAtLabel}</time>
              </div>
              <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-slate-900">{note.note}</p>
            </li>
          ))}
        </ol>
      ) : props.notes.status === "ready" ? (
        <p className="mt-4 rounded-xl border border-dashed border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
          아직 등록된 운영 메모가 없습니다.
        </p>
      ) : null}
    </section>
  );
}
