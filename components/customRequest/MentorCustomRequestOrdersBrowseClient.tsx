"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  isOrderRowPaymentConfirmedForMentorWork,
  isOrderRowTerminalForActions,
  normalizedPrimaryOrderStatus,
  orderStatusUiToneForNorm,
} from "@/lib/customRequest/orderLifecycleConstants";
import { pickDisplayField } from "@/lib/customRequest/customRequestQueries";
import {
  mentorCustomOrderPaymentLine,
  mentorCustomOrderStatusHeadline,
  mentorCustomOrderWorkroomHref,
} from "@/lib/customRequest/mentorCustomOrderBrowseDisplay";

type Row = Record<string, unknown>;

type TabId = "all" | "dispute" | "billing" | "work" | "delivery" | "revision" | "done";

const TABS: { id: TabId; label: string }[] = [
  { id: "all", label: "전체" },
  { id: "dispute", label: "분쟁·검토" },
  { id: "billing", label: "수락·결제 대기" },
  { id: "work", label: "작업 중" },
  { id: "delivery", label: "납품·검토 대기" },
  { id: "revision", label: "수정 요청" },
  { id: "done", label: "완료·종료" },
];

function classifyTab(row: Row, disputeIds: ReadonlySet<string>): TabId {
  const id = typeof row.id === "string" ? row.id.trim() : "";
  if (id && disputeIds.has(id)) {
    return "dispute";
  }
  if (!isOrderRowPaymentConfirmedForMentorWork(row)) {
    return "billing";
  }
  if (isOrderRowTerminalForActions(row)) {
    return "done";
  }
  const norm = normalizedPrimaryOrderStatus(row);
  if (norm === "revision_requested") {
    return "revision";
  }
  if (
    norm === "delivered" ||
    norm === "delivered_pending_review" ||
    norm === "waiting_review" ||
    norm === "pending_review" ||
    norm === "in_review" ||
    norm === "delivery_submitted" ||
    norm === "redelivered"
  ) {
    return "delivery";
  }
  return "work";
}

const TONE_RING: Record<string, string> = {
  gray: "border-slate-200 bg-slate-50 text-slate-800",
  blue: "border-sky-200 bg-sky-50 text-sky-950",
  amber: "border-amber-200 bg-amber-50 text-amber-950",
  green: "border-emerald-200 bg-emerald-50 text-emerald-950",
  orange: "border-orange-200 bg-orange-50 text-orange-950",
  red: "border-red-200 bg-red-50 text-red-950",
};

function statusChipClass(row: Row, disputeIds: ReadonlySet<string>): string {
  if (typeof row.id === "string" && row.id.trim() && disputeIds.has(row.id.trim())) {
    return TONE_RING.red;
  }
  if (!isOrderRowPaymentConfirmedForMentorWork(row)) {
    return TONE_RING.amber;
  }
  const norm = normalizedPrimaryOrderStatus(row);
  const tone = orderStatusUiToneForNorm(norm);
  return TONE_RING[tone] ?? TONE_RING.gray;
}

function studentLine(row: Row): string {
  const name = pickDisplayField(row, ["student_name", "buyer_name", "client_name", "requester_name"]);
  if (name !== "—") {
    return name;
  }
  const sid = pickDisplayField(row, ["student_id", "buyer_id", "user_id", "client_id", "requester_id"]);
  if (sid !== "—" && sid.length > 10) {
    return `의뢰자 ····${sid.slice(-6)}`;
  }
  return sid !== "—" ? `의뢰자 ${sid}` : "의뢰자 정보 준비 중";
}

function postInfoHref(row: Row): string | null {
  const pid = pickDisplayField(row, [
    "custom_request_post_id",
    "post_id",
    "request_post_id",
    "custom_request_id",
  ]);
  const t = pid !== "—" ? pid.trim() : "";
  if (t.length >= 8) {
    return `/mentor/custom-request/posts/${encodeURIComponent(t)}`;
  }
  return null;
}

export function MentorCustomRequestOrdersBrowseClient(props: {
  rows: Row[];
  activeDisputeOrderIds: string[];
}) {
  const disputeSet = useMemo(() => new Set(props.activeDisputeOrderIds), [props.activeDisputeOrderIds]);
  const [tab, setTab] = useState<TabId>("all");

  const filtered = useMemo(() => {
    if (tab === "all") {
      return props.rows;
    }
    return props.rows.filter((r) => classifyTab(r as Row, disputeSet) === tab);
  }, [props.rows, tab, disputeSet]);

  return (
    <div>
      <div
        className="flex gap-1 overflow-x-auto rounded-xl border border-slate-200 bg-slate-50/90 p-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        role="tablist"
        aria-label="주문 상태 필터"
      >
        {TABS.map((t) => {
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setTab(t.id)}
              className={[
                "shrink-0 rounded-lg px-3 py-2 text-xs font-bold transition sm:px-4 sm:text-sm",
                active ? "bg-white text-blue-900 shadow-sm ring-1 ring-slate-200/80" : "text-slate-600 hover:bg-white/70",
              ].join(" ")}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      <ul className="mt-5 space-y-3">
        {filtered.length === 0 ? (
          <li className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-8 text-center text-sm font-semibold text-slate-600">
            이 조건에 해당하는 주문이 없습니다.
          </li>
        ) : (
          filtered.map((raw) => {
            const r = raw as Row;
            const id = typeof r.id === "string" && r.id.trim() ? r.id.trim() : null;
            if (!id) return null;
            const title = pickDisplayField(r, ["title", "subject", "label", "name"]);
            const titleLine = title !== "—" ? title : "맞춤의뢰 주문";
            const href = mentorCustomOrderWorkroomHref(id);
            const headline = mentorCustomOrderStatusHeadline(r, disputeSet);
            const pay = mentorCustomOrderPaymentLine(r);
            const deadline = pickDisplayField(r, ["deadline", "due_at", "due_date", "close_at"]);
            const postHref = postInfoHref(r);
            const chipClass = statusChipClass(r, disputeSet);

            return (
              <li key={id}>
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-blue-200 hover:shadow-md sm:p-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`inline-flex max-w-full rounded-full border px-2.5 py-0.5 text-xs font-bold ${chipClass}`}>
                          {headline}
                        </span>
                      </div>
                      <h3 className="mt-2 text-base font-extrabold leading-snug text-slate-900 sm:text-lg">{titleLine}</h3>
                      <p className="mt-1 text-sm text-slate-600">
                        <span className="font-extrabold text-slate-700">의뢰자</span> {studentLine(r)}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600 sm:text-sm">
                        <span>
                          <span className="font-extrabold text-slate-500">결제</span> {pay}
                        </span>
                        {deadline !== "—" ? (
                          <span>
                            <span className="font-extrabold text-slate-500">일정</span> {deadline}
                          </span>
                        ) : null}
                      </div>
                    </div>
                    <div className="flex w-full shrink-0 flex-col gap-2 border-t border-slate-100 pt-3 sm:w-auto sm:border-0 sm:pt-0 sm:pl-4 md:min-w-[11rem]">
                      <Link
                        href={href}
                        className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-blue-600 px-4 text-sm font-bold text-white shadow-sm hover:bg-blue-500"
                      >
                        작업방 입장
                      </Link>
                      {postHref ? (
                        <Link
                          href={postHref}
                          className="inline-flex min-h-[40px] items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-800 hover:bg-slate-50"
                        >
                          의뢰 글 보기
                        </Link>
                      ) : (
                        <Link
                          href={href}
                          className="inline-flex min-h-[40px] items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-800 hover:bg-slate-50"
                        >
                          상세 보기
                        </Link>
                      )}
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
