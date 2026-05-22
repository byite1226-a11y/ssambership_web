"use client";

import Link from "next/link";
import { useMemo, useState, useEffect } from "react";
import { pickDisplayField } from "@/lib/customRequest/customRequestQueries";
import {
  mentorCustomOrderPaymentLine,
  mentorCustomOrderWorkroomCtaLabel,
  mentorCustomOrderWorkroomHref,
} from "@/lib/customRequest/mentorCustomOrderBrowseDisplay";
import { classifyMentorOrderBrowseTab, type MentorOrderBrowseTabId } from "@/lib/customRequest/mentorOrderBrowseTabClassify";

type Row = Record<string, unknown>;

const TABS: { id: MentorOrderBrowseTabId; label: string; countKey: string }[] = [
  { id: "all", label: "전체", countKey: "all" },
  { id: "billing", label: "작업 대기", countKey: "billing" },
  { id: "work", label: "작업 진행 중", countKey: "work" },
  { id: "delivery", label: "납품 대기", countKey: "delivery" },
  { id: "done", label: "종료됨", countKey: "done" },
];

// Step labels matching reference image (req_15 card stepper)
const STEP_LABELS = ["작업 대기", "작업 중", "납품 대기", "수정 요청", "완료"];

function getStepIndex(row: Row, disputeSet: ReadonlySet<string>): number {
  const tab = classifyMentorOrderBrowseTab(row, disputeSet);
  if (tab === "billing") return 0;
  if (tab === "work") return 1;
  if (tab === "delivery") return 2;
  if (tab === "revision") return 3;
  if (tab === "done") return 4;
  return 0;
}

function getStatusBadge(row: Row, disputeSet: ReadonlySet<string>): { label: string; cls: string } {
  const id = typeof row.id === "string" ? row.id.trim() : "";
  if (id && disputeSet.has(id)) {
    return { label: "문제 해결", cls: "bg-red-50 text-red-600 border-red-200" };
  }
  const tab = classifyMentorOrderBrowseTab(row, disputeSet);
  if (tab === "billing") return { label: "작업 대기", cls: "bg-amber-50 text-amber-800 border-amber-200" };
  if (tab === "work") return { label: "작업 진행 중", cls: "bg-blue-50 text-blue-700 border-blue-200" };
  if (tab === "delivery") return { label: "납품 대기", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" };
  if (tab === "revision") return { label: "수정 요청", cls: "bg-orange-50 text-orange-700 border-orange-200" };
  if (tab === "done") return { label: "종료됨", cls: "bg-slate-50 text-slate-600 border-slate-200" };
  return { label: "작업 진행 중", cls: "bg-blue-50 text-blue-700 border-blue-200" };
}

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

function getStartDate(row: Row): string {
  const raw = pickDisplayField(row, ["expected_start_at", "start_at", "accepted_at"]);
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
  const { counts = {} } = props;

  // Map 'revision' URL param to 'work' tab (they show together in req_15)
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

  // Compute per-tab counts from actual rows
  // 'work' tab includes both work and revision rows (matching req_15 UI)
  const tabCounts = useMemo(() => {
    const c: Record<string, number> = { all: props.rows.length };
    for (const r of props.rows) {
      const t = classifyMentorOrderBrowseTab(r, disputeSet);
      // Merge revision into work for display
      const displayTab = t === "revision" ? "work" : t;
      c[displayTab] = (c[displayTab] ?? 0) + 1;
    }
    return c;
  }, [props.rows, disputeSet]);

  const filtered = useMemo(() => {
    if (tab === "all") return props.rows;
    // work tab includes revision rows
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
      {/* Tab Bar - matching reference req_15 style */}
      <div
        className="flex items-center gap-1 border-b border-slate-200 mb-6 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
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
                "shrink-0 flex items-center gap-1.5 border-b-2 px-4 pb-3 pt-1 text-[14px] font-semibold transition-colors whitespace-nowrap",
                isActive
                  ? "border-[#142d61] text-[#142d61]"
                  : "border-transparent text-slate-500 hover:text-slate-800",
              ].join(" ")}
            >
              {t.label}
              <span
                className={[
                  "flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[11px] font-black",
                  isActive ? "bg-slate-100 text-[#142d61]" : "bg-slate-100 text-slate-500",
                ].join(" ")}
              >
                {count}
              </span>
            </button>
          );
        })}

        {/* Sort dropdown right-aligned */}
        <div className="ml-auto shrink-0 pb-3">
          <select className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[13px] font-medium text-slate-600 shadow-sm hover:border-slate-300 transition focus:outline-none focus:ring-2 focus:ring-blue-500/20">
            <option>최신 순</option>
            <option>마감일 순</option>
          </select>
        </div>
      </div>

      {/* Order Cards */}
      <ul className="space-y-4">
        {filtered.length === 0 ? (
          <li className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-12 text-center text-sm font-semibold text-slate-500">
            이 조건에 해당하는 의뢰가 없습니다.
          </li>
        ) : (
          filtered.map((raw) => {
            const r = raw as Row;
            const id = typeof r.id === "string" && r.id.trim() ? r.id.trim() : null;
            if (!id) return null;
            const title = pickDisplayField(r, ["title", "subject", "label", "name"]);
            const titleLine = title !== "—" ? title : "맞춤의뢰 주문";
            const href = mentorCustomOrderWorkroomHref(id);
            const pay = mentorCustomOrderPaymentLine(r);
            const deadline = pickDisplayField(r, ["deadline", "due_at", "due_date", "close_at"]);
            const acceptDate = getAcceptDate(r);
            const startDate = getStartDate(r);
            const badge = getStatusBadge(r, disputeSet);
            const stepIndex = getStepIndex(r, disputeSet);
            const lifecycleTab = classifyMentorOrderBrowseTab(r, disputeSet);
            const isTerminalCard = lifecycleTab === "done";

            // Get category-like tags from row
            const category = pickDisplayField(r, ["category_label", "category", "category_name", "subject_area"]);
            const gradeRaw = pickDisplayField(r, ["grade", "school_level", "target_grade"]);
            const showCategory = category !== "—";
            const showGrade = gradeRaw !== "—" && gradeRaw.trim().length > 0;

            // Get post fields
            const budgetRaw = pickDisplayField(r, ["expected_budget", "budget", "price", "amount_krw"]);
            const durationRaw = pickDisplayField(r, ["expected_duration", "duration_weeks", "timeline"]);

            const orderNo = typeof r.id === "string" ? `OD${r.id.substring(0, 8).toUpperCase()}` : "";
            const postDate = pickDisplayField(r, ["post_created_at", "created_at"]);
            const postDateShort = postDate !== "—" ? postDate.substring(0, 10).replace(/-/g, ".") : "";
            const acceptDateDisplay = acceptDate || postDateShort;

            return (
              <li key={id} className="group">
                <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm hover:border-blue-200 hover:shadow-md transition-all duration-200">
                  {/* Card header */}
                  <div className="p-5 sm:p-6">
                    <div className="flex items-start justify-between gap-4">
                      {/* Left: icon placeholder + content */}
                      <div className="flex items-start gap-4 min-w-0 flex-1">
                        {/* Category icon block */}
                        <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center">
                          <svg className="w-7 h-7 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>

                        {/* Content */}
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            {showCategory && (
                              <span className="rounded bg-blue-50 px-2 py-0.5 text-[11px] font-bold text-blue-600">{category}</span>
                            )}
                            {showGrade && (
                              <span className="rounded bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-600">{gradeRaw}</span>
                            )}
                            <span className={`ml-auto rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${badge.cls}`}>
                              {badge.label}
                            </span>
                          </div>
                          <Link href={href} className="block text-[16px] font-black leading-snug text-slate-900 hover:text-blue-600 transition-colors">
                            {titleLine}
                          </Link>
                          <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-slate-500">
                            {orderNo && <span>의뢰번호 <span className="font-medium text-slate-700">{orderNo}</span></span>}
                            {postDateShort && <span>의뢰일 <span className="font-medium text-slate-700">{postDateShort}</span></span>}
                            {acceptDate && <span>수락일 <span className="font-medium text-slate-700">{acceptDate}</span></span>}
                          </div>
                          {/* Budget/duration/major row - matching req_15 */}
                          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[12px]">
                            {(() => {
                              const majorF = pickDisplayField(r, ["desired_major", "major", "희망전공", "target_major", "post_major"]);
                              const interestF = pickDisplayField(r, ["interests", "interest_area", "subject", "관심분야"]);
                              const showM = majorF !== "—" && majorF.trim().length > 0;
                              const showI = interestF !== "—" && interestF.trim().length > 0;
                              return (
                                <>
                                  {showM && (
                                    <span className="text-slate-500">
                                      희망 전공 <span className="font-semibold text-slate-700">{majorF}</span>
                                    </span>
                                  )}
                                  {showI && (
                                    <span className="text-slate-500">
                                      관심 분야 <span className="font-semibold text-slate-700">{interestF}</span>
                                    </span>
                                  )}
                                  {pay !== "—" && (
                                    <span className="text-slate-500">
                                      수락 금액 <span className="font-semibold text-slate-700">{pay}</span>
                                    </span>
                                  )}
                                  {durationRaw !== "—" && (
                                    <span className="text-slate-500">
                                      예상 기간 <span className="font-semibold text-slate-700">{durationRaw}</span>
                                    </span>
                                  )}
                                </>
                              );
                            })()}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Progress Stepper */}
                    <div className="mt-5 pt-4 border-t border-slate-100">
                      <div className="flex items-center gap-0">
                        {STEP_LABELS.map((stepLabel, i) => {
                          const isDone = i < stepIndex;
                          const isCurrent = i === stepIndex;
                          return (
                            <div key={stepLabel} className="flex flex-1 items-center min-w-0">
                              {/* Step node */}
                              <div className="flex flex-col items-center shrink-0">
                                <div
                                  className={[
                                    "flex h-7 w-7 items-center justify-center rounded-full border-2 text-[11px] font-black transition-all",
                                    isDone
                                      ? "border-[#142d61] bg-[#142d61] text-white"
                                      : isCurrent
                                      ? "border-[#142d61] bg-white text-[#142d61] ring-4 ring-slate-100"
                                      : "border-slate-200 bg-white text-slate-400",
                                  ].join(" ")}
                                >
                                  {isDone ? (
                                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                    </svg>
                                  ) : (
                                    i + 1
                                  )}
                                </div>
                                <span
                                  className={[
                                    "mt-1.5 max-w-[60px] text-center text-[10px] font-semibold leading-tight",
                                    isDone ? "text-[#142d61]" : isCurrent ? "text-[#142d61] font-bold" : "text-slate-400",
                                  ].join(" ")}
                                >
                                  {stepLabel}
                                </span>
                              </div>
                              {/* Connector */}
                              {i < STEP_LABELS.length - 1 && (
                                <div
                                  className={[
                                    "flex-1 mx-1 h-0.5 self-start mt-3.5 rounded-full transition-colors",
                                    i < stepIndex ? "bg-[#142d61]/70" : "bg-slate-200",
                                  ].join(" ")}
                                />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Action button */}
                    <div className="mt-4 flex justify-end">
                      <Link
                        href={href}
                        className={[
                          "inline-flex h-9 items-center justify-center rounded-lg px-5 text-[13px] font-bold transition shadow-sm hover:shadow",
                          isTerminalCard
                            ? "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                            : "bg-[#142d61] text-white hover:bg-[#0f2349]",
                        ].join(" ")}
                      >
                        {mentorCustomOrderWorkroomCtaLabel(lifecycleTab, r)}
                        {!isTerminalCard && lifecycleTab !== "delivery" ? " →" : ""}
                      </Link>
                    </div>
                  </div>
                </div>
              </li>
            );
          })
        )}
      </ul>
    </div>
  );
}
