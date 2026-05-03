import { approveMentorApplicationAction, rejectMentorApplicationAction } from "@/lib/admin/mentorApprovalActions";
import {
  mentorApprovalRowIsPending,
  mentorApprovalStatusLabel,
  mentorApprovalStatusRaw,
} from "@/lib/admin/mentorApprovalLabels";
import type { AdminListResult } from "@/lib/admin/adminQueries";
import { adminListFetchFailedCopy } from "@/lib/admin/adminDisplayError";

type Row = Record<string, unknown>;

const ID_PREVIEW_LEN = 10;

function previewId(raw: unknown, maxLen = ID_PREVIEW_LEN): { display: string; title: string | undefined } {
  const s = raw == null ? "" : String(raw).trim();
  if (!s) return { display: "—", title: undefined };
  if (s.length <= maxLen) return { display: s, title: s };
  return { display: `${s.slice(0, maxLen)}…`, title: s };
}

function pickFirst(row: Row, keys: readonly string[]): unknown {
  for (const k of keys) {
    if (k in row) return row[k];
  }
  return undefined;
}

function displayName(row: Row, user: { nickname: string | null; full_name: string | null } | undefined): string {
  const u = user?.full_name?.trim() || user?.nickname?.trim();
  if (u) return u;
  const intro = pickFirst(row, ["intro_line"]);
  if (typeof intro === "string" && intro.trim()) return intro.trim();
  const uni = pickFirst(row, ["university_name", "department_name"]);
  if (typeof uni === "string" && uni.trim()) return uni.trim();
  return "—";
}

function formatTs(v: unknown): string {
  if (v === null || v === undefined) return "—";
  const s = String(v).trim();
  if (!s) return "—";
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("ko-KR", { dateStyle: "medium", timeStyle: "short" }).format(d);
}

const statusBadgeClass = (s: string) => {
  const u = s.toLowerCase();
  if (/pending|applied/i.test(u)) return "bg-amber-50 text-amber-700 border-amber-100";
  if (/approved|success|done/i.test(u)) return "bg-emerald-50 text-emerald-700 border-emerald-100";
  if (/rejected|fail/i.test(u)) return "bg-red-50 text-red-700 border-red-100";
  return "bg-slate-50 text-slate-600 border-slate-100";
};

export function AdminMentorApprovalsTable(props: {
  list: AdminListResult;
  userById: Map<string, { nickname: string | null; full_name: string | null }>;
}) {
  const { list, userById } = props;
  const statusCol = list.keyHints.status;

  if (list.error && !list.rows.length) {
    const { title, description } = adminListFetchFailedCopy("mentorApprovals");
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50/60 p-5 text-sm text-red-950">
        <p className="font-bold">{title}</p>
        <p className="mt-1 text-xs text-red-900/90">{description}</p>
      </div>
    );
  }

  if (!list.rows.length) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/40 p-8 text-center text-sm text-slate-500 font-semibold">
        승인 대기 중인 멘토 신청이 없습니다.
      </div>
    );
  }

  const missingStatus = !statusCol && Boolean(list.table);

  return (
    <div className="max-w-6xl mx-auto space-y-4 text-sm">
      {missingStatus ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-bold text-amber-950 animate-pulse">
          승인 상태를 변경할 수 있는 항목을 찾지 못했습니다. 잠시 후 다시 시도하거나 시스템 담당자에게 문의해 주세요.
        </p>
      ) : null}
      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 bg-slate-50/60 px-5 py-3.5 flex items-center justify-between">
          <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider">멘토 신청 내역</h2>
          <span className="text-xs bg-blue-50 text-blue-600 font-semibold px-2.5 py-1 rounded">
            {list.rows.length}건
          </span>
        </div>
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200/60 bg-slate-50/40">
              <th className="px-5 py-3 text-xs font-bold text-slate-600">신청 ID</th>
              <th className="px-5 py-3 text-xs font-bold text-slate-600">사용자</th>
              <th className="px-5 py-3 text-xs font-bold text-slate-600">상태</th>
              <th className="px-5 py-3 text-xs font-bold text-slate-600">이름/닉네임</th>
              <th className="px-5 py-3 text-xs font-bold text-slate-600">신청일</th>
              <th className="px-5 py-3 text-xs font-bold text-slate-600">수정일</th>
              <th className="px-5 py-3 text-xs font-bold text-slate-600">처리</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {(list.rows as Row[]).map((row, i) => {
              const uidRaw = pickFirst(row, ["user_id", "id"]);
              const uid = uidRaw != null && String(uidRaw).length ? String(uidRaw) : "";
              const idPrev = previewId(uid || pickFirst(row, ["id"]));
              const u = uid ? userById.get(uid) : undefined;
              const userPrev = previewId(u?.nickname || u?.full_name || uid);
              const rawStatus = mentorApprovalStatusRaw(row, statusCol ?? undefined);
              const label = statusCol ? mentorApprovalStatusLabel(rawStatus) : "—";
              const pending = Boolean(statusCol && mentorApprovalRowIsPending(row, statusCol));
              return (
                <tr key={`${uid || String(i)}`} className="hover:bg-slate-50/30 transition-colors">
                  <td className="max-w-[140px] truncate px-5 py-4 font-mono text-xs font-medium text-slate-800" title={idPrev.title}>
                    {idPrev.display}
                  </td>
                  <td className="max-w-[120px] truncate px-5 py-4 text-xs font-medium text-slate-600" title={userPrev.title}>
                    {userPrev.display}
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap">
                    <span className={`inline-block border rounded-lg px-2.5 py-1 text-xs font-bold ${statusBadgeClass(label)}`}>
                      {label}
                    </span>
                  </td>
                  <td className="max-w-[180px] truncate px-5 py-4 text-xs font-bold text-slate-800">{displayName(row, u)}</td>
                  <td className="whitespace-nowrap px-5 py-4 text-xs font-medium text-slate-500 leading-relaxed">{formatTs(pickFirst(row, ["created_at"]))}</td>
                  <td className="whitespace-nowrap px-5 py-4 text-xs font-medium text-slate-500 leading-relaxed">{formatTs(pickFirst(row, ["updated_at"]))}</td>
                  <td className="min-w-[220px] px-5 py-4 align-top">
                    {pending && statusCol && !missingStatus ? (
                      <form className="space-y-2">
                        <input type="hidden" name="mentorUserId" value={uid} />
                        <textarea
                          name="note"
                          rows={2}
                          placeholder="메모(선택)"
                          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all"
                        />
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="submit"
                            formAction={approveMentorApplicationAction}
                            className="flex-1 rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-blue-500 transition-colors shadow-sm whitespace-nowrap"
                          >
                            승인
                          </button>
                          <button
                            type="submit"
                            formAction={rejectMentorApplicationAction}
                            className="flex-1 rounded-xl bg-red-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-red-500 transition-colors shadow-sm whitespace-nowrap"
                          >
                            반려
                          </button>
                        </div>
                      </form>
                    ) : (
                      <span className="text-xs font-medium text-slate-400">처리 완료 또는 검토 불필요</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
