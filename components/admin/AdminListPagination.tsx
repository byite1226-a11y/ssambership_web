/**
 * 관리자 목록 공용 페이지네이션. Prev/Next + 페이지 번호 + 총건수.
 */
import Link from "next/link";
import type { AdminListParams } from "@/lib/admin/adminListParams";
import { buildAdminListUrl } from "@/lib/admin/adminListParams";

type Props = {
  basePath: string;
  params: AdminListParams;
  totalCount: number;
  rowsOnPage: number;
};

export function AdminListPagination(props: Props) {
  const { basePath, params, totalCount, rowsOnPage } = props;
  const totalPages = Math.max(1, Math.ceil(totalCount / Math.max(1, params.pageSize)));
  const prevPage = Math.max(1, params.page - 1);
  const nextPage = Math.min(totalPages, params.page + 1);
  const hasPrev = params.page > 1;
  const hasNext = params.page < totalPages;
  const firstIdx = totalCount === 0 ? 0 : (params.page - 1) * params.pageSize + 1;
  const lastIdx = (params.page - 1) * params.pageSize + rowsOnPage;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/60 px-5 py-3">
      <p className="text-xs font-semibold text-slate-600">
        총 <strong className="text-slate-900">{totalCount.toLocaleString("ko-KR")}</strong>건 ·{" "}
        {firstIdx}–{lastIdx} 표시 (페이지 {params.page} / {totalPages})
      </p>
      <div className="flex items-center gap-1.5">
        <Link
          href={hasPrev ? buildAdminListUrl(basePath, params, { page: prevPage }) : "#"}
          aria-disabled={!hasPrev}
          className={[
            "rounded-xl border px-3 py-1.5 text-xs font-extrabold transition",
            hasPrev
              ? "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              : "pointer-events-none border-slate-100 bg-slate-50 text-slate-300",
          ].join(" ")}
        >
          ← 이전
        </Link>
        <Link
          href={hasNext ? buildAdminListUrl(basePath, params, { page: nextPage }) : "#"}
          aria-disabled={!hasNext}
          className={[
            "rounded-xl border px-3 py-1.5 text-xs font-extrabold transition",
            hasNext
              ? "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              : "pointer-events-none border-slate-100 bg-slate-50 text-slate-300",
          ].join(" ")}
        >
          다음 →
        </Link>
      </div>
    </div>
  );
}
