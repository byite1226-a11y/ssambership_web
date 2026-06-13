"use client";

import { useMemo, useState } from "react";
import {
  approveMentorApplicationAction,
  rejectMentorApplicationAction,
  requestMentorDocumentsAction,
} from "@/lib/admin/mentorApprovalActions";
import { mentorApprovalStatusLabel, mentorApprovalStatusRaw } from "@/lib/admin/mentorApprovalLabels";

type Row = Record<string, unknown>;
type UserDisplay = { nickname: string | null; full_name: string | null };

type Props = {
  rows: Row[];
  userById: Record<string, UserDisplay>;
  /** 서버에서 createSignedUrl(300s)로 발급한 학생증 미리보기 URL */
  studentIdImageSignedUrlByUserId?: Record<string, string | null>;
  statusFilter: string;
  statusColumn: string | null;
};

function displayName(row: Row, user?: UserDisplay): string {
  const u = user?.full_name?.trim() || user?.nickname?.trim();
  if (u) return u;
  const uni = row.university_name ?? row.department_name;
  if (typeof uni === "string" && uni.trim()) return uni.trim();
  return "—";
}

function formatTs(v: unknown): string {
  if (!v) return "—";
  const d = new Date(String(v));
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("ko-KR", { dateStyle: "medium" }).format(d);
}

const FILTERS = [
  { id: "all", label: "전체" },
  { id: "pending", label: "대기" },
  { id: "approved", label: "승인" },
  { id: "rejected", label: "반려" },
] as const;

export function AdminMentorApprovalWorkspace(props: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filter, setFilter] = useState(props.statusFilter || "all");
  const [rejectOpen, setRejectOpen] = useState(false);

  const filtered = useMemo(() => {
    if (filter === "all") return props.rows;
    return props.rows.filter((r) => {
      const s = mentorApprovalStatusRaw(r, props.statusColumn);
      if (filter === "pending") return /pending|submitted|review|await/i.test(s);
      if (filter === "approved") return /approved|success/i.test(s);
      if (filter === "rejected") return /reject/i.test(s);
      return true;
    });
  }, [props.rows, filter, props.statusColumn]);

  const selected = filtered.find((r) => String(r.user_id ?? r.id) === selectedId) ?? null;
  const mentorUserId = selected ? String(selected.user_id ?? selected.id ?? "") : "";
  const user = mentorUserId ? props.userById[mentorUserId] : undefined;
  const img =
    (mentorUserId && props.studentIdImageSignedUrlByUserId?.[mentorUserId]) || null;

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-2xl font-black text-slate-900">멘토 승인</h1>
        <p className="mt-1 text-sm text-slate-600">신청 목록을 검토하고 승인·반려합니다.</p>
      </header>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFilter(f.id)}
            className={[
              "rounded-full px-3.5 py-1.5 text-xs font-bold",
              filter === f.id ? "bg-[#1A56DB] text-white" : "border border-slate-200 bg-white text-slate-700",
            ].join(" ")}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-xs font-bold text-slate-600">
                <th className="px-4 py-3">이름</th>
                <th className="px-4 py-3">학교</th>
                <th className="px-4 py-3">학과</th>
                <th className="px-4 py-3">신청일</th>
                <th className="px-4 py-3">상태</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((r) => {
                const id = String(r.user_id ?? r.id ?? "");
                return (
                  <tr
                    key={id}
                    className={["cursor-pointer hover:bg-slate-50", selectedId === id ? "bg-blue-50/50" : ""].join(" ")}
                    onClick={() => setSelectedId(id)}
                  >
                    <td className="px-4 py-3 font-semibold">{displayName(r, props.userById[id])}</td>
                    <td className="px-4 py-3 text-slate-600">{String(r.university_name ?? "—")}</td>
                    <td className="px-4 py-3 text-slate-600">{String(r.department_name ?? "—")}</td>
                    <td className="px-4 py-3 text-slate-500">{formatTs(r.created_at ?? r.submitted_at)}</td>
                    <td className="px-4 py-3 text-xs font-bold">
                      {mentorApprovalStatusLabel(mentorApprovalStatusRaw(r, props.statusColumn))}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <aside
          className={[
            "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:sticky lg:top-6 lg:self-start",
            selected ? "block" : "hidden lg:block",
          ].join(" ")}
        >
          {!selected ? (
            <p className="text-sm text-slate-500">목록에서 신청을 선택하세요.</p>
          ) : (
            <div className="space-y-4">
              <h2 className="text-lg font-black text-slate-900">{displayName(selected, user)}</h2>
              <p className="text-xs text-slate-500">
                상태: {mentorApprovalStatusLabel(mentorApprovalStatusRaw(selected, props.statusColumn))}
              </p>
              {img ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={img} alt="학생증" className="max-h-48 w-full rounded-xl border object-contain" />
              ) : (
                <p className="rounded-xl border border-dashed border-slate-200 py-8 text-center text-xs text-slate-500">
                  학생증 이미지 없음
                </p>
              )}
              {mentorUserId ? (
                <div className="space-y-2 border-t border-slate-100 pt-4">
                  <form action={approveMentorApplicationAction} className="space-y-2">
                    <input type="hidden" name="mentorUserId" value={mentorUserId} />
                    <input name="adminNote" placeholder="승인 메모(선택)" className="w-full rounded-lg border px-3 py-2 text-sm" />
                    <button type="submit" className="w-full rounded-xl bg-[#1A56DB] py-2.5 text-sm font-bold text-white">
                      승인
                    </button>
                  </form>
                  <form action={requestMentorDocumentsAction} className="space-y-2">
                    <input type="hidden" name="mentorUserId" value={mentorUserId} />
                    <input name="adminNote" placeholder="추가 서류 요청 사유" className="w-full rounded-lg border px-3 py-2 text-sm" />
                    <button type="submit" className="w-full rounded-xl border border-amber-300 bg-amber-50 py-2.5 text-sm font-bold text-amber-950">
                      추가서류 요청
                    </button>
                  </form>
                  <button
                    type="button"
                    onClick={() => setRejectOpen(true)}
                    className="w-full rounded-xl bg-red-600 py-2.5 text-sm font-bold text-white hover:bg-red-700"
                  >
                    반려
                  </button>
                </div>
              ) : null}
            </div>
          )}
        </aside>
      </div>

      {rejectOpen && selected && mentorUserId ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal>
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
            <h3 className="text-lg font-black text-slate-900">반려 사유 입력</h3>
            <p className="mt-1 text-xs text-slate-500">{displayName(selected, user)} 멘토 신청을 반려합니다.</p>
            <form action={rejectMentorApplicationAction} className="mt-4 space-y-3">
              <input type="hidden" name="mentorUserId" value={mentorUserId} />
              <textarea
                name="rejectionReason"
                required
                rows={4}
                placeholder="반려 사유를 입력해 주세요"
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setRejectOpen(false)}
                  className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-bold text-slate-700"
                >
                  취소
                </button>
                <button type="submit" className="flex-1 rounded-xl bg-red-600 py-2.5 text-sm font-bold text-white">
                  반려 확정
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
