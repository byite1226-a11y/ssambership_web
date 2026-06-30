"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { DisputeListItem } from "@/lib/disputes/disputeListQueries";

const PAGE_SIZE = 10;

const badge = (s: string) => {
  const u = (s || "").toLowerCase();
  if (/escalat/i.test(u)) return "bg-red-50 text-red-700 border-red-100";
  if (/open|new|submitted|pend|ing|under_review|review/i.test(u)) return "bg-amber-50 text-amber-700 border-amber-100";
  if (/resolv|done|approved|complete/i.test(u)) return "bg-emerald-50 text-emerald-700 border-emerald-100";
  return "bg-slate-50 text-slate-600 border-slate-100";
};

type Props = {
  items: DisputeListItem[];
  /** 상세 경로 base — 행 링크는 `${detailHrefBase}/${id}`로 조립(함수 prop은 클라이언트 컴포넌트로 직렬화 불가). */
  detailHrefBase: string;
  listError: string | null;
  usedColumn: string | null;
  table: string | null;
  probe: string;
  /** 페이지네이션 활성 페이지 숫자 액센트 — green(멘토 기본)·blue(학생). 기본 green로 멘토 영향 0. */
  accent?: "green" | "blue";
};

const LIST_LOAD_FAIL =
  "분쟁 내역을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.";
const NO_TABLE_COPY = "분쟁·환불 현황을 불러올 수 없습니다. 잠시 후 다시 시도해 주세요.";
const EMPTY_LIST_COPY = "현재 확인할 분쟁이 없습니다.";

export function DisputesListView(props: Props) {
  const { items, detailHrefBase, listError, table, accent = "green" } = props;
  const activeAccentClass = accent === "blue" ? "text-[#2563EB]" : "text-[#059669]";
  const [page, setPage] = useState(1);
  // 모바일은 페이지당 5줄, 데스크탑은 기존 10줄. 초기값=데스크탑값(SSR/hydration 일치) → 마운트 후 보정.
  const [pageSize, setPageSize] = useState(PAGE_SIZE);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const apply = () => setPageSize(mq.matches ? 5 : PAGE_SIZE);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);
  if (listError && !items.length) {
    return (
      <div className="max-w-5xl mx-auto bg-red-50/60 border border-red-200 p-5 rounded-2xl">
        <p className="text-sm font-bold text-red-900">{LIST_LOAD_FAIL}</p>
      </div>
    );
  }
  if (!table) {
    void props.probe;
    void props.usedColumn;
    return (
      <div className="max-w-5xl mx-auto bg-slate-50/60 border border-slate-200 p-5 rounded-2xl text-center">
        <p className="text-sm font-semibold text-slate-500">{NO_TABLE_COPY}</p>
      </div>
    );
  }
  if (!items.length) {
    return (
      <div className="max-w-5xl mx-auto bg-slate-50/40 border border-dashed border-slate-200 p-8 rounded-2xl text-center">
        <p className="text-sm font-semibold text-slate-500">{EMPTY_LIST_COPY}</p>
      </div>
    );
  }
  const rows = items.filter((it) => it.id && it.id !== "—");
  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const visibleRows = rows.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12 text-sm text-slate-800">
      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 bg-slate-50/60 px-5 py-3 flex items-center justify-between">
          <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider">분쟁·환불 현황</h2>
          <span className="text-xs bg-slate-100 text-slate-600 font-semibold px-2.5 py-1 rounded">
            {items.length}건
          </span>
        </div>
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200/60 bg-slate-50/30">
              <th className="px-5 py-3 text-xs font-bold text-slate-600">분쟁 유형</th>
              <th className="px-5 py-3 text-xs font-bold text-slate-600">상태</th>
              <th className="px-5 py-3 text-xs font-bold text-slate-600">관련 주문·결제</th>
              <th className="px-5 py-3 text-xs font-bold text-slate-600 text-right">상세</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {visibleRows.map((it) => (
                <tr key={it.id} className="hover:bg-slate-50/30 transition-colors">
                  <td className="max-w-[min(11rem,32vw)] min-w-0 px-5 py-4 text-slate-800 font-medium break-words">
                    {it.typeLabel && it.typeLabel !== "—" ? (
                      it.typeLabel
                    ) : (
                      <span className="text-slate-400">유형 미지정</span>
                    )}
                  </td>
                  <td className="px-5 py-4 align-middle">
                    <span
                      className={`inline-flex shrink-0 items-center whitespace-nowrap border rounded-lg px-2.5 py-1 text-xs font-bold ${badge(it.statusRaw)}`}
                    >
                      {it.statusLabel}
                    </span>
                  </td>
                  <td className="min-w-0 max-w-[min(20rem,45vw)] px-5 py-4 text-xs text-slate-600 leading-relaxed font-medium break-words">
                    {it.orderSummary && it.orderSummary !== "—" ? (
                      <span className="line-clamp-2" title={it.orderSummary}>
                        {it.orderSummary}
                      </span>
                    ) : (
                      <span className="text-slate-400">연결된 주문 없음</span>
                    )}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <Link
                      className="inline-flex min-h-[36px] items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-xs font-bold text-slate-700 transition-colors hover:bg-slate-50"
                      href={`${detailHrefBase}/${encodeURIComponent(it.id)}`}
                    >
                      상세 보기
                    </Link>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 ? (
        <div className="flex items-center justify-center gap-2" aria-label="페이지 이동">
          <button
            type="button"
            disabled={currentPage <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold disabled:opacity-40"
          >
            이전
          </button>
          <span className="text-xs font-bold" aria-live="polite">
            <span className={activeAccentClass}>{currentPage}</span>
            <span className="text-slate-400"> · {totalPages}</span>
          </span>
          <button
            type="button"
            disabled={currentPage >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold disabled:opacity-40"
          >
            다음
          </button>
        </div>
      ) : null}
    </div>
  );
}
