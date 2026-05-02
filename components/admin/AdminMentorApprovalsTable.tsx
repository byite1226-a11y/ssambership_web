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

export function AdminMentorApprovalsTable(props: {
  list: AdminListResult;
  userById: Map<string, { nickname: string | null; full_name: string | null }>;
}) {
  const { list, userById } = props;
  const statusCol = list.keyHints.status;

  if (list.error && !list.rows.length) {
    const { title, description } = adminListFetchFailedCopy("mentorApprovals");
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-4 text-sm text-amber-950">
        <p className="font-semibold">{title}</p>
        <p className="mt-1 text-xs text-amber-900/90">{description}</p>
      </div>
    );
  }

  if (!list.rows.length) {
    return (
      <p className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">승인 대기 중인 멘토 신청이 없습니다.</p>
    );
  }

  const missingStatus = !statusCol && Boolean(list.table);

  return (
    <div className="space-y-3">
      {missingStatus ? (
        <p className="rounded-2xl border border-amber-200 bg-amber-50/70 p-3 text-sm text-amber-950">
          승인 상태를 변경할 수 있는 항목을 찾지 못했습니다. 잠시 후 다시 시도하거나 시스템 담당자에게 문의해 주세요.
        </p>
      ) : null}
      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/80">
              <th className="px-3 py-2 font-extrabold text-slate-800">신청 ID</th>
              <th className="px-3 py-2 font-extrabold text-slate-800">사용자</th>
              <th className="px-3 py-2 font-extrabold text-slate-800">상태</th>
              <th className="px-3 py-2 font-extrabold text-slate-800">이름/닉네임</th>
              <th className="px-3 py-2 font-extrabold text-slate-800">신청일</th>
              <th className="px-3 py-2 font-extrabold text-slate-800">수정일</th>
              <th className="px-3 py-2 font-extrabold text-slate-800">처리</th>
            </tr>
          </thead>
          <tbody>
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
                <tr key={`${uid || String(i)}`} className="border-b border-slate-100 last:border-0">
                  <td className="max-w-[140px] truncate px-3 py-2 font-mono text-xs text-slate-800" title={idPrev.title}>
                    {idPrev.display}
                  </td>
                  <td className="max-w-[120px] truncate px-3 py-2 text-slate-800" title={userPrev.title}>
                    {userPrev.display}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 text-slate-800">{label}</td>
                  <td className="max-w-[180px] truncate px-3 py-2 text-slate-800">{displayName(row, u)}</td>
                  <td className="whitespace-nowrap px-3 py-2 text-slate-700">{formatTs(pickFirst(row, ["created_at"]))}</td>
                  <td className="whitespace-nowrap px-3 py-2 text-slate-700">{formatTs(pickFirst(row, ["updated_at"]))}</td>
                  <td className="min-w-[220px] px-3 py-2 align-top">
                    {pending && statusCol && !missingStatus ? (
                      <form className="space-y-2">
                        <input type="hidden" name="mentorUserId" value={uid} />
                        <textarea
                          name="note"
                          rows={2}
                          placeholder="메모(선택)"
                          className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-800 placeholder:text-slate-400"
                        />
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="submit"
                            formAction={approveMentorApplicationAction}
                            className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700"
                          >
                            승인
                          </button>
                          <button
                            type="submit"
                            formAction={rejectMentorApplicationAction}
                            className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-red-700"
                          >
                            반려
                          </button>
                        </div>
                      </form>
                    ) : (
                      <span className="text-xs text-slate-500">처리 완료 또는 검토 불필요</span>
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
