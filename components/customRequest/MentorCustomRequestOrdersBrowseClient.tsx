"use client";

import Link from "next/link";
import { useMemo, useState, useEffect } from "react";
import { EmptyState, LinkButton, StatusBadge } from "@/components/design-system";
import { mentorCustomOrderBrowseStatus } from "@/lib/design-system/mentorOrderStatusBadge";
import { pickDisplayField } from "@/lib/customRequest/customRequestQueries";
import {
  mentorCustomOrderDisplayTitle,
  mentorCustomOrderPaymentLine,
  mentorCustomOrderWorkroomHref,
} from "@/lib/customRequest/mentorCustomOrderBrowseDisplay";
import { classifyMentorOrderBrowseTab, type MentorOrderBrowseTabId } from "@/lib/customRequest/mentorOrderBrowseTabClassify";
import { paymentLabelClassName } from "@/lib/customRequest/paymentLabelTone";

type Row = Record<string, unknown>;

const TABS: { id: MentorOrderBrowseTabId; label: string }[] = [
  { id: "all", label: "전체" },
  { id: "billing", label: "작업 대기" },
  { id: "work", label: "작업 진행 중" },
  { id: "delivery", label: "납품 대기" },
  { id: "done", label: "종료됨" },
];

function studentLine(row: Row): string {
  const name = pickDisplayField(row, ["student_name", "buyer_name", "client_name", "requester_name"]);
  if (name !== "—") return name;
  const sid = pickDisplayField(row, ["student_id", "buyer_id", "user_id", "client_id", "requester_id"]);
  if (sid !== "—" && sid.length > 10) return `의뢰자 ····${sid.slice(-6)}`;
  return sid !== "—" ? `의뢰자 ${sid}` : "의뢰자 정보 준비 중";
}

function getAcceptDate(row: Row): string {
  const raw = pickDisplayField(row, ["accepted_at", "created_at", "started_at"]);
  if (raw === "—") return "";
  const match = raw.match(/\d{4}-\d{2}-\d{2}/);
  if (match) return match[0].replace(/-/g, ".");
  return "";
}

export function MentorCustomRequestOrdersBrowseClient(props: {
  rows: Row[];
  activeDisputeOrderIds: string[];
  initialTab?: string;
  counts?: Record<string, number>;
}) {
  const disputeSet = useMemo(() => new Set(props.activeDisputeOrderIds), [props.activeDisputeOrderIds]);

  const resolveDefaultTab = (t: string | undefined): MentorOrderBrowseTabId => {
    if (t === "billing") return "billing";
    if (t === "work" || t === "revision") return "work";
    if (t === "delivery") return "delivery";
    if (t === "done") return "done";
    return "all";
  };
  const defaultTab = resolveDefaultTab(props.initialTab);

  const [tab, setTab] = useState<MentorOrderBrowseTabId>(defaultTab);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTab(resolveDefaultTab(props.initialTab));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.initialTab]);

  const tabCounts = useMemo(() => {
    const c: Record<string, number> = { all: props.rows.length };
    for (const r of props.rows) {
      const t = classifyMentorOrderBrowseTab(r, disputeSet);
      const displayTab = t === "revision" ? "work" : t;
      c[displayTab] = (c[displayTab] ?? 0) + 1;
    }
    return c;
  }, [props.rows, disputeSet]);

  const filtered = useMemo(() => {
    if (tab === "all") return props.rows;
    if (tab === "work") {
      return props.rows.filter((r) => {
        const t = classifyMentorOrderBrowseTab(r as Row, disputeSet);
        return t === "work" || t === "revision";
      });
    }
    return props.rows.filter((r) => classifyMentorOrderBrowseTab(r as Row, disputeSet) === tab);
  }, [props.rows, tab, disputeSet]);

  return (
    <div>
      <div
        className="mb-5 flex items-center gap-0 overflow-x-auto border-b border-ds-border-subtle [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        role="tablist"
        aria-label="수락된 의뢰 필터"
      >
        {TABS.map((t) => {
          const isActive = tab === t.id;
          const count = t.id === "all" ? tabCounts.all : tabCounts[t.id] ?? 0;
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setTab(t.id)}
              className={[
                "flex shrink-0 items-center gap-1.5 border-b-2 px-4 pb-3 pt-1 text-sm font-semibold whitespace-nowrap transition-colors",
                isActive ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-800",
              ].join(" ")}
            >
              {t.label}
              <span
                className={[
                  "flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[11px] font-bold tabular-nums",
                  isActive ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-500",
                ].join(" ")}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="이 단계에 해당하는 의뢰가 없어요"
          description="새 의뢰 목록에서 관심 있는 의뢰에 제안해 보세요."
          action={
            <LinkButton href="/mentor/custom-request/posts" accent="student">
              새 의뢰 보기
            </LinkButton>
          }
        />
      ) : (
        <ul className="grid grid-cols-1 items-stretch gap-3 lg:grid-cols-2">
          {filtered.map((raw) => {
            const r = raw as Row;
            const id = typeof r.id === "string" && r.id.trim() ? r.id.trim() : null;
            if (!id) return null;
            const titleLine = mentorCustomOrderDisplayTitle(r);
            const href = mentorCustomOrderWorkroomHref(id);
            const pay = mentorCustomOrderPaymentLine(r);
            const acceptDate = getAcceptDate(r);
            const status = mentorCustomOrderBrowseStatus(r, disputeSet);
            const isDispute = disputeSet.has(id);
            const student = studentLine(r);
            const acceptPart = acceptDate ? `수락 ${acceptDate}` : null;
            const payPart = pay !== "—" ? pay : null;
            const hasMeta = Boolean(student || acceptPart || payPart);

            return (
              <li key={id} className="min-h-0">
                <Link
                  href={href}
                  className={[
                    "flex h-full items-start justify-between gap-3 rounded-2xl border border-ds-border-subtle bg-white px-5 py-4 transition hover:bg-slate-50/80",
                    isDispute ? "border-l-[3px] border-l-red-600" : "border-l-[3px] border-l-violet-600",
                  ].join(" ")}
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-slate-900">{titleLine}</p>
                    {hasMeta ? (
                      <p className="mt-1 truncate text-sm text-slate-600">
                        <span>{student}</span>
                        {acceptPart ? (
                          <>
                            {" · "}
                            <span>{acceptPart}</span>
                          </>
                        ) : null}
                        {payPart ? (
                          <>
                            {" · "}
                            <span className={paymentLabelClassName(payPart)}>{payPart}</span>
                          </>
                        ) : null}
                      </p>
                    ) : null}
                  </div>
                  <StatusBadge label={status.label} kind={status.kind} size="sm" className="shrink-0" />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
