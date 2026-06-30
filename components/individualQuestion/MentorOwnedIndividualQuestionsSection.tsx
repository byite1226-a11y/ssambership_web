"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Clock, Inbox } from "lucide-react";
import { EmptyState } from "@/components/common/EmptyState";
import { listCardClassName, type ListCardTone } from "@/components/design-system/ListCard";
import { getSubjectLabel } from "@/lib/subjects/subjectCatalog";
import {
  formatIndividualQuestionDate,
  formatIndividualQuestionExpiryRemaining,
  formatIndividualQuestionPrice,
  individualQuestionStatusBadgeClass,
  individualQuestionStatusLabel,
  individualQuestionTypeLabel,
  isIndividualQuestionAwaitingAnswer,
  isIndividualQuestionExpiringSoon,
} from "@/lib/individualQuestion/individualQuestionFormat";
import type { IndividualQuestionListItem } from "@/lib/individualQuestion/individualQuestionQueries";

// 개별질문 상태 → 목록 카드 좌측 액센트 톤(IndividualQuestionViews와 동일 규약).
function iqCardTone(status: string | null | undefined): ListCardTone {
  switch ((status ?? "").toLowerCase()) {
    case "released":
      return "blue";
    case "answered":
      return "green";
    case "open":
    case "assigned":
    case "claimed":
    case "escrowed":
      return "amber";
    default:
      return "neutral";
  }
}

function ExpiringSoonBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-rose-100 bg-rose-50 px-2.5 py-1 text-xs font-extrabold text-rose-600">
      <Clock className="h-3 w-3" aria-hidden />
      마감 임박
    </span>
  );
}

// 카드 마크업은 IndividualQuestionViews의 IndividualQuestionListCards와 동일(구조 미터치, 클라이언트 분류용 복제).
function OwnedQuestionCard(props: { row: IndividualQuestionListItem; detailBaseHref: string }) {
  const { row } = props;
  const expiringSoon = isIndividualQuestionExpiringSoon(row.expires_at, row.status);
  const remainingLabel = formatIndividualQuestionExpiryRemaining(row.expires_at, row.status);
  return (
    <Link
      href={`${props.detailBaseHref}/${row.id}`}
      className={listCardClassName(iqCardTone(row.status), true, "group block")}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-full border px-2.5 py-1 text-xs font-extrabold ${individualQuestionStatusBadgeClass(row.status)}`}>
              {individualQuestionStatusLabel(row.status)}
            </span>
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">
              {individualQuestionTypeLabel(row.question_type)}
            </span>
            {row.subject ? (
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">
                {getSubjectLabel(row.subject)}
                {row.topic ? ` · ${row.topic}` : ""}
              </span>
            ) : null}
            <span className="text-xs font-bold text-slate-900">{formatIndividualQuestionPrice(row.price_cents)} 안전 결제</span>
            {expiringSoon ? <ExpiringSoonBadge /> : null}
          </div>
          <h2 className="mt-2 truncate text-lg font-black text-slate-900 group-hover:text-emerald-700">{row.title}</h2>
          <p className="mt-1 line-clamp-2 text-sm leading-6 text-slate-600">{row.body}</p>
          {remainingLabel ? (
            <p className={`mt-2 text-xs font-bold ${expiringSoon ? "text-rose-600" : "text-slate-500"}`}>{remainingLabel}</p>
          ) : null}
        </div>
        <dl className="grid min-w-[180px] gap-2 rounded-xl bg-slate-50 px-4 py-3 text-sm">
          <div>
            <dt className="text-xs font-bold text-slate-500">학생</dt>
            <dd className="mt-0.5 font-extrabold text-slate-900">{row.studentName}</dd>
          </div>
          <div>
            <dt className="text-xs font-bold text-slate-500">등록일</dt>
            <dd className="mt-0.5 font-extrabold text-slate-900">{formatIndividualQuestionDate(row.created_at)}</dd>
          </div>
        </dl>
      </div>
    </Link>
  );
}

const PAGE_SIZE = 5;
const PAGE_SIZE_MOBILE = 4;

// 한 목록(답변 대기/완료)에 대한 페이지네이션 + 카드 렌더. 페이지 크기는 부모가 pageSize로 주입(모바일 4/데스크탑 5).
function PagedQuestionList(props: {
  rows: IndividualQuestionListItem[];
  detailBaseHref: string;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  emptyTitle: string;
  emptyDescription: string;
}) {
  const { rows } = props;
  if (rows.length === 0) {
    return <EmptyState compact icon={<Inbox className="h-5 w-5" aria-hidden />} title={props.emptyTitle} description={props.emptyDescription} />;
  }
  const totalPages = Math.max(1, Math.ceil(rows.length / props.pageSize));
  const safePage = Math.min(props.page, totalPages);
  const paged = rows.slice((safePage - 1) * props.pageSize, safePage * props.pageSize);
  return (
    <>
      <div className="grid gap-4">
        {paged.map((row) => (
          <OwnedQuestionCard key={row.id} row={row} detailBaseHref={props.detailBaseHref} />
        ))}
      </div>
      {totalPages > 1 ? (
        <nav className="mt-4 flex items-center justify-center gap-3" aria-label="페이지 이동">
          <button
            type="button"
            disabled={safePage <= 1}
            onClick={() => props.onPageChange(Math.max(1, safePage - 1))}
            className="inline-flex h-9 items-center rounded-lg border border-slate-200 bg-white px-3.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            이전
          </button>
          <span className="text-sm font-bold tabular-nums text-slate-500">
            <span className="text-[#059669]">{safePage}</span> · {totalPages}
          </span>
          <button
            type="button"
            disabled={safePage >= totalPages}
            onClick={() => props.onPageChange(Math.min(totalPages, safePage + 1))}
            className="inline-flex h-9 items-center rounded-lg border border-slate-200 bg-white px-3.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            다음
          </button>
        </nav>
      ) : null}
    </>
  );
}

type TypeTab = "all" | "direct" | "open";

/**
 * 멘토 "내가 맡은 질문" — question_type(지정형/공개형) 탭으로 클라이언트 분류.
 * 데이터/쿼리는 그대로(이미 로드된 배열 필터만). 각 탭은 답변 대기/완료 목록을 5개/페이지로 보여준다.
 */
export function MentorOwnedIndividualQuestionsSection(props: {
  rows: IndividualQuestionListItem[];
  detailBaseHref: string;
}) {
  const [tab, setTab] = useState<TypeTab>("all");
  const [awaitingPage, setAwaitingPage] = useState(1);
  const [settledPage, setSettledPage] = useState(1);
  // 모바일은 페이지당 4개, 데스크탑은 기존 5개. 초기값=데스크탑값(SSR/hydration 일치) → 마운트 후 보정.
  const [pageSize, setPageSize] = useState(PAGE_SIZE);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const apply = () => setPageSize(mq.matches ? PAGE_SIZE_MOBILE : PAGE_SIZE);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  // 공개형(open) / 지정형(그 외) — 배지 라벨(individualQuestionTypeLabel)과 동일 기준으로 분류.
  const isOpen = (row: IndividualQuestionListItem) => (row.question_type ?? "").toLowerCase() === "open";
  const openCount = useMemo(() => props.rows.filter(isOpen).length, [props.rows]);
  const directCount = props.rows.length - openCount;

  const typeFiltered = useMemo(() => {
    if (tab === "all") return props.rows;
    if (tab === "open") return props.rows.filter(isOpen);
    return props.rows.filter((row) => !isOpen(row));
  }, [props.rows, tab]);

  const awaitingRows = useMemo(
    () => typeFiltered.filter((row) => isIndividualQuestionAwaitingAnswer(row.status)),
    [typeFiltered]
  );
  const settledRows = useMemo(
    () => typeFiltered.filter((row) => !isIndividualQuestionAwaitingAnswer(row.status)),
    [typeFiltered]
  );

  const tabs: { id: TypeTab; label: string; count: number }[] = [
    { id: "all", label: "전체", count: props.rows.length },
    { id: "direct", label: "지정형", count: directCount },
    { id: "open", label: "공개형", count: openCount },
  ];

  function selectTab(next: TypeTab) {
    setTab(next);
    setAwaitingPage(1);
    setSettledPage(1);
  }

  return (
    <section>
      <h2 className="cr-section-title-v5 mb-4">
        <span className="bar" aria-hidden />
        내가 맡은 질문
      </h2>

      <div className="mb-5 flex flex-wrap gap-2" role="tablist" aria-label="질문 유형 필터">
        {tabs.map((t) => {
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => selectTab(t.id)}
              className={[
                "inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-bold transition",
                active
                  ? "border-[#059669] bg-[#059669] text-white"
                  : "border-slate-200 bg-white text-slate-600 hover:border-emerald-300 hover:text-[#047857]",
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

      <div className="space-y-6">
        <div>
          <h3 className="mb-3 text-sm font-extrabold text-slate-700">답변 대기 ({awaitingRows.length})</h3>
          <PagedQuestionList
            rows={awaitingRows}
            detailBaseHref={props.detailBaseHref}
            page={awaitingPage}
            pageSize={pageSize}
            onPageChange={setAwaitingPage}
            emptyTitle="답변할 질문이 없어요"
            emptyDescription="새 지정 질문이 도착하거나 공개 질문에 답변을 맡으면 이곳에 표시됩니다."
          />
        </div>

        {settledRows.length > 0 ? (
          <div>
            <h3 className="mb-3 text-sm font-extrabold text-slate-700">답변 완료·종료 ({settledRows.length})</h3>
            <PagedQuestionList
              rows={settledRows}
              detailBaseHref={props.detailBaseHref}
              page={settledPage}
              pageSize={pageSize}
              onPageChange={setSettledPage}
              emptyTitle="완료된 질문이 없어요"
              emptyDescription="답변을 완료하면 이곳에 정리됩니다."
            />
          </div>
        ) : null}
      </div>
    </section>
  );
}
