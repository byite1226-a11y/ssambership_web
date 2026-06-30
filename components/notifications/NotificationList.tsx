"use client";

import { useEffect, useState } from "react";
import type { AppRole } from "@/lib/types/user";
import { NotificationItemCard } from "@/components/notifications/NotificationItemCard";
import { NotificationEmptyState } from "@/components/notifications/NotificationEmptyState";
import type { NotificationHubLoad } from "@/lib/notifications/notificationsHubQueries";
import { typeRaw } from "@/lib/notifications/notificationRowDisplay";
import { notificationTypeMeta } from "@/components/notifications/notificationTypeIcon";

type Row = Record<string, unknown>;

type Filter = "all" | "unread";

const PAGE_SIZE = 10;

// 카테고리 후보 — notificationTypeMeta(type).label 값과 1:1 매칭(카드 배지와 동일 분류 재사용).
// 빈 상태 카드의 TYPE_HINTS와 동일한 5종.
const CATEGORY_CANDIDATES = ["질문방", "구독·결제", "맞춤의뢰", "환불", "공지"] as const;

export function NotificationList(props: {
  hub: NotificationHubLoad;
  filter: Filter;
  role: AppRole;
}) {
  const { hub, filter, role } = props;
  const [category, setCategory] = useState<string>("전체");
  const [page, setPage] = useState(1);
  // 모바일은 페이지당 5개, 데스크탑은 기존 10개. 초기값 데스크탑 기준(SSR/hydration 일치) → 마운트 후 보정.
  const [pageSize, setPageSize] = useState(PAGE_SIZE);

  // 서버에서 새 rows가 내려오면(읽음 필터 URL 전환 등) 1페이지로 리셋.
  useEffect(() => {
    setPage(1);
  }, [hub.rows]);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const apply = () => setPageSize(mq.matches ? 5 : PAGE_SIZE);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  // 로드 실패/전체 0건 — 기존 빈 상태 유지(카테고리·페이지네이션 이전에 처리, 카드 구조 미터치).
  if (hub.unreadFilterBlocked) {
    return <NotificationEmptyState filter={filter} hadTableError={false} unreadFilterBlocked />;
  }
  if (hub.error && hub.rows.length === 0) {
    return <NotificationEmptyState filter={filter} hadTableError={true} />;
  }
  if (hub.rows.length === 0) {
    return <NotificationEmptyState filter={filter} hadTableError={false} />;
  }

  // 카드 배지와 동일한 분류로 각 row의 카테고리 도출. 현재 rows에 실제 존재하는 카테고리만 탭 노출
  // (type 매핑이 불명확하면 자동으로 탭이 안 떠 '전체'만 남음 — 깨짐 방지).
  const rowCategory = (r: Row) => notificationTypeMeta(typeRaw(r, hub.typeColumn)).label;
  const presentCategories: string[] = CATEGORY_CANDIDATES.filter((c) =>
    hub.rows.some((r) => rowCategory(r as Row) === c)
  );
  const showCategoryTabs = presentCategories.length > 0;
  // 선택된 카테고리가 현재 rows에 없으면 '전체'로 폴백.
  const activeCategory = presentCategories.includes(category) ? category : "전체";

  const filteredRows =
    activeCategory === "전체" ? hub.rows : hub.rows.filter((r) => rowCategory(r as Row) === activeCategory);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const visibleRows = filteredRows.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const onCategory = (c: string) => {
    setCategory(c);
    setPage(1); // WalletLedgerPageBody 방식 — 필터 변경 시 1페이지 리셋.
  };

  return (
    <div className="space-y-3">
      {showCategoryTabs ? (
        // 모바일: 가로 스크롤 + peek(마지막 칩 살짝 잘림) / 데스크탑(md+): 기존 wrap 복원
        <div
          className="notif-filter-scroll -mx-1 flex flex-nowrap gap-2 overflow-x-auto px-1 [-ms-overflow-style:none] [scrollbar-width:none] md:mx-0 md:flex-wrap md:overflow-visible md:px-0"
          role="tablist"
          aria-label="알림 카테고리"
        >
          {["전체", ...presentCategories].map((c) => {
            const active = activeCategory === c;
            return (
              <button
                key={c}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => onCategory(c)}
                className={`shrink-0 whitespace-nowrap rounded-lg border px-3 py-1.5 text-xs font-extrabold transition ${
                  active
                    ? "border-[#2563EB] bg-[#2563EB] text-white"
                    : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                }`}
              >
                {c}
              </button>
            );
          })}
        </div>
      ) : null}

      {filteredRows.length === 0 ? (
        <NotificationEmptyState filter={filter} hadTableError={false} />
      ) : (
        <ul className="space-y-2">
          {visibleRows.map((r, i) => (
            <li key={String((r as Row).id ?? `${activeCategory}-${i}`)}>
              <NotificationItemCard row={r as Row} hub={hub} role={role} />
            </li>
          ))}
        </ul>
      )}

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
            <span className="text-[#2563EB]">{currentPage}</span>
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
      <style jsx global>{`
        .notif-filter-scroll::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}
