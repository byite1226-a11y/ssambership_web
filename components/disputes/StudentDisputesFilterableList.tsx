"use client";

import { useMemo, useState } from "react";
import { DisputesListView } from "@/components/disputes/DisputesListView";
import type { DisputeListItem } from "@/lib/disputes/disputeListQueries";

type Props = {
  items: DisputeListItem[];
  detailHrefBase: string;
  listError: string | null;
  usedColumn: string | null;
  table: string | null;
  probe: string;
  /** 역할 액센트 — 학생=blue(기본), 멘토=green. 탭 활성색 + 공유 페이지네이션 accent에 함께 적용. */
  accent?: "blue" | "green";
};

type StatusFilter = "all" | "active" | "resolved";

// 공유 DisputesListView의 badge()와 동일 기준으로 "처리완료" 판별(상태 분류 일관성 유지).
function isResolvedStatus(statusRaw: string): boolean {
  return /resolv|done|approved|complete/i.test(statusRaw || "");
}

export function StudentDisputesFilterableList(props: Props) {
  const [filter, setFilter] = useState<StatusFilter>("all");
  const accent = props.accent ?? "blue";
  const activeTabClass =
    accent === "green"
      ? "border-[#059669] bg-[#059669] text-white"
      : "border-[#2563EB] bg-[#2563EB] text-white";
  const inactiveTabClass =
    accent === "green"
      ? "border-slate-200 bg-white text-slate-600 hover:border-emerald-300 hover:text-[#047857]"
      : "border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:text-[#1D4ED8]";

  const resolvedCount = useMemo(
    () => props.items.filter((it) => isResolvedStatus(it.statusRaw)).length,
    [props.items]
  );
  const activeCount = props.items.length - resolvedCount;

  // 필터는 공유 리스트(slice/페이지네이션) "상위"에서 적용 — 거른 뒤 넘겨야 slice 전에 걸러진다.
  const filteredItems = useMemo(() => {
    if (filter === "all") return props.items;
    if (filter === "resolved") return props.items.filter((it) => isResolvedStatus(it.statusRaw));
    return props.items.filter((it) => !isResolvedStatus(it.statusRaw));
  }, [props.items, filter]);

  const tabs: { id: StatusFilter; label: string; count: number }[] = [
    { id: "all", label: "전체", count: props.items.length },
    { id: "active", label: "진행중", count: activeCount },
    { id: "resolved", label: "처리완료", count: resolvedCount },
  ];

  // 테이블 없음/목록 비어있음/에러는 공유 뷰가 처리 — 필터 탭 없이 그대로 위임.
  const showTabs = Boolean(props.table) && props.items.length > 0 && !props.listError;

  return (
    <div className="space-y-4">
      {showTabs ? (
        <div className="max-w-5xl mx-auto flex flex-wrap gap-2" role="tablist" aria-label="분쟁 상태 필터">
          {tabs.map((t) => {
            const active = filter === t.id;
            return (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setFilter(t.id)}
                className={[
                  "inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-bold transition",
                  active ? activeTabClass : inactiveTabClass,
                ].join(" ")}
              >
                {t.label}
                <span
                  className={[
                    "inline-flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[11px] font-extrabold tabular-nums",
                    active ? "bg-white/25 text-white" : "bg-slate-100 text-slate-500",
                  ].join(" ")}
                >
                  {t.count}
                </span>
              </button>
            );
          })}
        </div>
      ) : null}

      {/* key={filter} — 필터 전환 시 공유 뷰를 리마운트해 내부 page 상태를 1로 리셋(충돌 방지). */}
      <DisputesListView
        key={filter}
        items={filteredItems}
        detailHrefBase={props.detailHrefBase}
        accent={accent}
        listError={props.listError}
        usedColumn={props.usedColumn}
        table={props.table}
        probe={props.probe}
      />
    </div>
  );
}
