/**
 * 관리자 목록 공용 툴바: 검색 input + 상태 탭.
 * Server Component (form GET) — JS 없이도 동작.
 */
import Link from "next/link";
import type { AdminListParams } from "@/lib/admin/adminListParams";
import { buildAdminListUrl } from "@/lib/admin/adminListParams";

export type AdminStatusTab = { value: string; label: string; count?: number };

type Props = {
  basePath: string;
  params: AdminListParams;
  searchPlaceholder?: string;
  statusTabs?: AdminStatusTab[];
};

export function AdminListToolbar(props: Props) {
  const { basePath, params, searchPlaceholder, statusTabs } = props;
  const activeStatus = params.status || "all";

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4">
      {/* 검색 */}
      <form action={basePath} method="GET" className="flex flex-wrap items-center gap-2">
        <input
          type="text"
          name="q"
          defaultValue={params.search}
          placeholder={searchPlaceholder ?? "검색어를 입력하세요"}
          autoComplete="off"
          aria-label="검색"
          className="min-w-[200px] flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-800 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
        />
        {/* 상태/페이지사이즈 유지 */}
        {params.status && params.status !== "all" ? (
          <input type="hidden" name="status" value={params.status} />
        ) : null}
        <button
          type="submit"
          className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-extrabold text-white hover:bg-blue-500"
        >
          검색
        </button>
        {params.search ? (
          <Link
            href={buildAdminListUrl(basePath, params, { search: "" })}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50"
          >
            초기화
          </Link>
        ) : null}
      </form>

      {/* 상태 탭 */}
      {statusTabs && statusTabs.length > 0 ? (
        <nav className="flex flex-wrap gap-1.5" aria-label="상태 필터">
          {statusTabs.map((tab) => {
            const isActive = activeStatus === tab.value;
            const href = buildAdminListUrl(basePath, params, { status: tab.value });
            return (
              <Link
                key={tab.value}
                href={href}
                className={[
                  "rounded-xl border px-3 py-1.5 text-xs font-extrabold transition",
                  isActive
                    ? "border-blue-600 bg-blue-600 text-white"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
                ].join(" ")}
                aria-current={isActive ? "page" : undefined}
              >
                {tab.label}
                {typeof tab.count === "number" ? (
                  <span className={["ml-1.5 text-[10px]", isActive ? "text-blue-100" : "text-slate-500"].join(" ")}>
                    {tab.count}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </nav>
      ) : null}
    </div>
  );
}
