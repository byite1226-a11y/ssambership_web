"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ClipboardList } from "lucide-react";
import { mapPostRowToPublicDetail } from "@/lib/customRequest/customRequestPostMappers";
import {
  applicationCountFromRow,
  bodyPreviewTwoLines,
  formatBudgetRangeCash,
  formatDeadlineDday,
  studentPostStatusBadge,
  studentPostStatusBucket,
  type StudentPostListFilter,
} from "@/lib/customRequest/studentPostDisplay";

type Row = Record<string, unknown>;

export function CustomRequestStudentPostsList(props: { rows: Row[] }) {
  const [filter, setFilter] = useState<StudentPostListFilter>("all");
  const filtered = useMemo(() => {
    if (filter === "all") return props.rows;
    return props.rows.filter((r) => studentPostStatusBucket(r) === filter);
  }, [props.rows, filter]);

  const tabs: { id: StudentPostListFilter; label: string }[] = [
    { id: "all", label: "전체" },
    { id: "waiting", label: "지원대기" },
    { id: "active", label: "진행중" },
    { id: "done", label: "완료" },
  ];

  return (
    <div className="space-y-4">
      {props.rows.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-16 text-center">
          <ClipboardList className="h-12 w-12 text-slate-400" strokeWidth={1.5} aria-hidden />
          <h3 className="mt-4 text-lg font-black text-slate-900">아직 등록한 의뢰가 없어요</h3>
          <p className="mt-2 max-w-md text-sm font-medium text-slate-600">
            혼자 해결하기 어려운 공부 고민을 전문 멘토에게 맡겨보세요.
          </p>
          <Link
            href="/custom-request/new"
            className="mt-6 inline-flex min-h-[44px] items-center justify-center rounded-xl bg-[#1A56DB] px-5 text-sm font-extrabold text-white hover:bg-[#1648c0]"
          >
            첫 의뢰 등록하기
          </Link>
        </div>
      ) : (
        <>
          <nav className="flex flex-wrap gap-2">
            {tabs.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setFilter(t.id)}
                className={[
                  "rounded-full px-3.5 py-1.5 text-xs font-bold",
                  filter === t.id ? "bg-[#1A56DB] text-white" : "border border-slate-200 bg-white text-slate-700",
                ].join(" ")}
              >
                {t.label}
              </button>
            ))}
          </nav>
          {filtered.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-slate-200 py-12 text-center text-sm text-slate-500">
              해당 상태의 의뢰가 없습니다.
            </p>
          ) : (
            <ul className="space-y-3">
              {filtered.map((r) => {
                const d = mapPostRowToPublicDetail(r);
                const id = typeof r.id === "string" ? r.id : String(r.id ?? "");
                const badge = studentPostStatusBadge(r);
                const dday = formatDeadlineDday(r);
                const apps = applicationCountFromRow(r);
                const preview = bodyPreviewTwoLines(d.body !== "—" ? d.body : "");

                return (
                  <li key={id}>
                    <Link
                      href={`/custom-request/${id}/applications`}
                      className="block rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-slate-300 hover:shadow-md"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <span className="inline-flex rounded-full border border-blue-200 bg-white px-2.5 py-0.5 text-xs font-bold text-[#1A56DB]">
                          {d.category && d.category !== "—" ? d.category : "기타"}
                        </span>
                        <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-bold ${badge.cls}`}>
                          {badge.label}
                        </span>
                      </div>
                      <h3 className="mt-3 text-base font-extrabold text-slate-900">{d.title}</h3>
                      {preview ? (
                        <p className="mt-2 line-clamp-2 text-sm font-medium leading-relaxed text-slate-600">{preview}</p>
                      ) : null}
                      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-semibold text-slate-500">
                        <span className={dday.urgent ? "font-bold text-red-600" : ""}>마감 {dday.label}</span>
                        <span>{formatBudgetRangeCash(r)}</span>
                        <span>지원 {apps}명</span>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
