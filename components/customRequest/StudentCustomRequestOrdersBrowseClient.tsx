"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { StatusBadge } from "@/components/design-system";
import type { StudentCustomOrderListRowView } from "@/lib/customRequest/studentCustomRequestOrdersQueries";
import type { StudentOrderBrowseTabId } from "@/lib/customRequest/studentOrderBrowseTabClassify";
import { paymentLabelClassName } from "@/lib/customRequest/paymentLabelTone";

const TABS: { id: StudentOrderBrowseTabId; label: string }[] = [
  { id: "all", label: "전체" },
  { id: "waiting", label: "작업 대기" },
  { id: "work", label: "작업 진행 중" },
  { id: "review", label: "납품 검토" },
  { id: "done", label: "완료" },
];

export function StudentCustomRequestOrdersBrowseClient({ cards }: { cards: StudentCustomOrderListRowView[] }) {
  const [tab, setTab] = useState<StudentOrderBrowseTabId>("all");

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: cards.length, waiting: 0, work: 0, review: 0, done: 0 };
    for (const card of cards) {
      if (card.browseTab in c) c[card.browseTab] += 1;
    }
    return c;
  }, [cards]);

  const filtered = useMemo(
    () => (tab === "all" ? cards : cards.filter((card) => card.browseTab === tab)),
    [cards, tab]
  );

  return (
    <div>
      <nav
        className="mb-5 flex overflow-x-auto border-b border-ds-border-subtle [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        aria-label="주문 상태 필터"
      >
        {TABS.map((t) => {
          const active = t.id === tab;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`relative mr-6 flex shrink-0 items-center gap-1.5 whitespace-nowrap py-2.5 text-sm font-semibold transition ${
                active ? "text-ds-primary" : "text-ds-tertiary hover:text-ds-secondary"
              }`}
            >
              {t.label}
              <span
                className={`min-w-[20px] rounded-full px-1.5 text-center text-xs font-bold tabular-nums ${
                  active ? "bg-slate-800 text-white" : "border border-ds-border-subtle bg-ds-muted text-ds-tertiary"
                }`}
              >
                {counts[t.id] ?? 0}
              </span>
              {active ? <span className="absolute inset-x-0 -bottom-px h-0.5 bg-slate-800" /> : null}
            </button>
          );
        })}
      </nav>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-ds-border-subtle bg-slate-50/40 p-12 text-center">
          <p className="text-sm font-semibold text-ds-secondary">해당 상태의 주문이 없습니다.</p>
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {filtered.map((card) => {
            const isDispute = card.browseTab === "dispute" || card.statusTone === "danger";
            return (
              <li key={card.id}>
                <div
                  className={`relative overflow-hidden rounded-2xl border bg-ds-surface p-5 pl-6 transition-[box-shadow,border-color] duration-150 hover:shadow-[0_2px_8px_rgba(0,0,0,0.09)] ${
                    isDispute ? "border-red-200 hover:border-red-400" : "border-ds-border-subtle hover:border-violet-400"
                  }`}
                >
                  <span
                    className={`absolute left-0 top-0 bottom-0 w-1 ${isDispute ? "bg-red-600" : "bg-violet-600"}`}
                    aria-hidden
                  />
                  <div className="mb-2 flex items-start justify-between gap-3">
                    <h3 className="truncate text-base font-bold text-ds-primary">{card.titleLine}</h3>
                    <span className="shrink-0">
                      <StatusBadge label={card.orderStatusLabel} tone={card.statusTone} size="sm" />
                    </span>
                  </div>
                  <p className="mb-3.5 truncate text-[13px] font-medium text-ds-tertiary">
                    <span className="font-semibold text-ds-secondary">{card.mentorLine}</span> · 등록 {card.createdLabel}{" "}
                    ·{" "}
                    <span className={paymentLabelClassName(card.paymentStatusLabel)}>{card.paymentStatusLabel}</span>
                  </p>
                  <div className="flex items-center justify-between gap-3 border-t border-ds-border-subtle pt-3.5">
                    <span className="text-[15px] font-extrabold text-ds-primary">{card.amountLine}</span>
                    <Link
                      href={card.workroomHref}
                      className="inline-flex items-center gap-1 text-sm font-semibold text-blue-600 transition hover:text-blue-700"
                    >
                      작업방 열기 <span aria-hidden>→</span>
                    </Link>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
