import { mapPostRowToPublicDetail } from "@/lib/customRequest/customRequestPostMappers";
import { MentorPostStatusBadge } from "@/components/customRequest/MentorPostStatusBadge";

type Row = Record<string, unknown>;

export type MentorPostSummaryDisplay = ReturnType<typeof mapPostRowToPublicDetail>;

export function mentorPostSummaryFromRow(row: Row): MentorPostSummaryDisplay {
  return mapPostRowToPublicDetail(row);
}

/** 지원서 작성 등 — 읽기 전용 의뢰 요약 */
export function MentorPostReadonlySummary(props: {
  row: Row;
  compact?: boolean;
  embedded?: boolean;
  /** apply 페이지: 랜딩 톤 UI */
  landing?: boolean;
}) {
  const d = mapPostRowToPublicDetail(props.row);
  const showBudget = d.budgetLine !== "—";
  const showDeadline = d.deadline !== "—";

  if (props.landing) {
    return (
      <div className="apply-post-summary">
        <div className="summary-top">
          <div className="min-w-0 flex-1">
            <p className="summary-label">지원 대상 의뢰</p>
            <h2 className="summary-title">{d.title}</h2>
          </div>
          <div className="summary-badges">
            <MentorPostStatusBadge row={props.row} />
            {d.category !== "—" ? <span className="apply-pill blue">{d.category}</span> : null}
          </div>
        </div>

        {showBudget || showDeadline ? (
          <div className="apply-post-meta">
            {showBudget ? (
              <span>
                희망 예산 <strong>{d.budgetLine}</strong>
              </span>
            ) : null}
            {showDeadline ? (
              <span>
                희망 납기 <strong>{d.deadline}</strong>
              </span>
            ) : null}
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div
      className={
        props.embedded
          ? "border-b border-ds-border-subtle bg-slate-50/40 px-4 py-3 sm:px-5 sm:py-3.5"
          : "rounded-2xl border border-ds-border-subtle p-4 sm:p-5"
      }
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="ds-text-caption font-bold text-ds-tertiary uppercase tracking-wide">지원 대상 의뢰</p>
          <h2 className="mt-0.5 break-words text-lg font-black leading-snug text-slate-900 sm:text-xl">{d.title}</h2>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <MentorPostStatusBadge row={props.row} />
          {d.category !== "—" ? (
            <span className="rounded-full border border-ds-border-subtle px-2.5 py-0.5 text-[11px] font-bold text-slate-700">
              {d.category}
            </span>
          ) : null}
        </div>
      </div>

      {showBudget || showDeadline ? (
        <div className="mt-2 flex flex-wrap items-baseline gap-x-6 gap-y-1 text-sm">
          {showBudget ? (
            <span>
              <span className="text-xs text-slate-500">희망 예산 </span>
              <span className="font-semibold text-slate-900">{d.budgetLine}</span>
            </span>
          ) : null}
          {showDeadline ? (
            <span>
              <span className="text-xs text-slate-500">희망 납기 </span>
              <span className="font-semibold text-slate-900">{d.deadline}</span>
            </span>
          ) : null}
        </div>
      ) : null}

      {!props.compact && d.subject !== "—" ? (
        <p className="mt-2 text-xs text-slate-500">
          희망 전공·분야 <span className="text-slate-600">{d.subject}</span>
        </p>
      ) : null}
    </div>
  );
}
