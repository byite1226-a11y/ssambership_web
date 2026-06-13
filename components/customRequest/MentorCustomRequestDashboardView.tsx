import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  CheckCircle,
  CircleDollarSign,
  ClipboardList,
  FileText,
  Package,
  Send,
  TrendingUp,
  Zap,
} from "lucide-react";
import {
  SurfaceCard,
  StatusBadge,
  EmptyState,
  LinkButton,
  StatRow,
  type DsCardTone,
} from "@/components/design-system";
import { DS_CARD_TONE_CLASSES } from "@/lib/design-system/cardTone";
import { mentorCustomOrderBrowseStatus } from "@/lib/design-system/mentorOrderStatusBadge";
import {
  mentorCustomOrderDisplayTitle,
  mentorCustomOrderStudentLabel,
  mentorOrderDeadlineDisplay,
} from "@/lib/customRequest/mentorCustomOrderBrowseDisplay";
import { mentorCustomOrderWorkroomHref } from "@/lib/home/mentorDashboardQueries";
import type { fetchMentorWorkspaceCounts } from "@/lib/customRequest/mentorCounts";
import { cn } from "@/lib/utils/cn";
import type { ReactNode } from "react";

type Row = Record<string, unknown>;

const REGION_PANEL = "rounded-xl border border-slate-200 bg-white p-3";

const LINK_MUTED =
  "ds-text-caption font-bold text-ds-tertiary transition hover:text-ds-primary hover:underline";

type DashboardViewProps = {
  ordersError: string | null;
  openPoolCount: number;
  appliedCount: number;
  orderCount: number;
  doneCount: number;
  deliveryPendingCount: number;
  monthRevenueCash: number;
  dashboardCounts: Awaited<ReturnType<typeof fetchMentorWorkspaceCounts>>;
  activeOrders: Row[];
  activeDisputeOrderIds: Set<string>;
  avgRating: number | null;
  reviewCount: number;
  expectedSettlementCash: number;
  paidSettlementCash: number;
};

function TodoActionLink(props: {
  href: string;
  label: string;
  count: number;
  tone: "danger" | "amber" | "orange";
}) {
  const surfaceClass =
    props.tone === "danger"
      ? "border-red-200 bg-red-50 hover:bg-red-100/80"
      : props.tone === "amber"
        ? "border-amber-200 bg-amber-50 hover:bg-amber-100/80"
        : "border-orange-200 bg-orange-50 hover:bg-orange-100/80";
  const textClass =
    props.tone === "danger" ? "text-red-800" : props.tone === "amber" ? "text-amber-900" : "text-orange-900";

  return (
    <Link
      href={props.href}
      className={cn(
        "flex items-center justify-between gap-2 rounded-xl border px-3 py-2.5 transition",
        surfaceClass,
      )}
    >
      <span className={cn("text-sm font-semibold", textClass)}>{props.label}</span>
      <span className={cn("shrink-0 text-sm font-bold tabular-nums", textClass)}>{props.count}건 →</span>
    </Link>
  );
}

function DashboardRegion(props: {
  title: string;
  icon: LucideIcon;
  tone: DsCardTone;
  children: ReactNode;
  footer?: ReactNode;
}) {
  const t = DS_CARD_TONE_CLASSES[props.tone];
  const Icon = props.icon;

  return (
    <section
      className={cn(
        "flex flex-col rounded-2xl border border-ds-border-subtle border-l-[3px] bg-ds-surface p-4",
        t.accentBar,
      )}
    >
      <h2 className="ds-text-h2 flex min-h-[40px] items-center gap-3 border-b border-ds-border-subtle pb-2.5">
        <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", t.iconWrap)}>
          <Icon className={cn("h-5 w-5", t.icon)} strokeWidth={2} aria-hidden />
        </span>
        <span className={cn("font-bold", t.value)}>{props.title}</span>
      </h2>
      <div className="mt-3 flex flex-col gap-3">{props.children}</div>
      {props.footer ? <div className="mt-3 border-t border-ds-border-subtle pt-2.5">{props.footer}</div> : null}
    </section>
  );
}

export function MentorCustomRequestDashboardView(props: DashboardViewProps) {
  const {
    ordersError,
    openPoolCount,
    appliedCount,
    orderCount,
    doneCount,
    deliveryPendingCount,
    monthRevenueCash,
    dashboardCounts,
    activeOrders,
    activeDisputeOrderIds,
    avgRating,
    reviewCount,
    expectedSettlementCash,
    paidSettlementCash,
  } = props;

  const billingCount = dashboardCounts.billing ?? 0;
  const disputeCount = dashboardCounts.dispute ?? 0;
  const revisionCount = dashboardCounts.revision ?? 0;
  const deadlineOverdue = dashboardCounts.todo?.deadlineOverdue ?? 0;
  const deadlineImminent = dashboardCounts.todo?.deadlineImminent ?? 0;
  const workCount = (dashboardCounts.work ?? 0) + revisionCount;
  const acceptedOrdersTotal = dashboardCounts.ordersTotal ?? 0;
  const nonDoneOrderCount = acceptedOrdersTotal - doneCount;
  const hasTodoItems =
    disputeCount > 0 || revisionCount > 0 || deadlineOverdue > 0 || deadlineImminent > 0;
  const hasRatingData = avgRating != null || reviewCount > 0;
  const hasRevenueBreakdown =
    monthRevenueCash > 0 || expectedSettlementCash > 0 || paidSettlementCash > 0;

  const kpiCards: {
    icon: LucideIcon;
    iconChip: string;
    iconColor: string;
    label: string;
    value: string | number;
    unit?: string;
    hint?: string;
    className?: string;
  }[] = [
    {
      icon: FileText,
      iconChip: "bg-blue-50",
      iconColor: "text-blue-600",
      label: "새 의뢰",
      value: openPoolCount,
      unit: "건",
    },
    {
      icon: Send,
      iconChip: "bg-violet-50",
      iconColor: "text-violet-600",
      label: "제안한 의뢰",
      value: appliedCount,
      unit: "건",
    },
    {
      icon: CheckCircle,
      iconChip: "bg-emerald-50",
      iconColor: "text-emerald-600",
      label: "수락된 의뢰",
      value: orderCount,
      unit: "건",
    },
    {
      icon: Package,
      iconChip: "bg-indigo-50",
      iconColor: "text-indigo-600",
      label: "납품 완료",
      value: doneCount,
      unit: "건",
      hint: deliveryPendingCount > 0 ? `납품 대기 ${deliveryPendingCount}건` : undefined,
    },
    {
      icon: CircleDollarSign,
      iconChip: "bg-amber-50",
      iconColor: "text-amber-600",
      label: "이번 달 수익",
      value: monthRevenueCash.toLocaleString("ko-KR"),
      unit: "캐시",
      hint: "이번 달 예상 수익",
      className: "col-span-2 lg:col-span-1",
    },
  ];

  return (
    <>
      <header className="mb-8">
        <h1 className="ds-text-h1">맞춤의뢰 대시보드</h1>
        <p className="mt-2 ds-text-body">할 일 · 수익 · 진행 현황을 한눈에 확인하세요.</p>
      </header>

      {/* KPI strip */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5 lg:gap-5">
        {kpiCards.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <section
              key={kpi.label}
              className={cn("rounded-2xl border border-ds-border-subtle bg-white p-5", kpi.className)}
            >
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2.5">
                  <span
                    className={cn(
                      "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
                      kpi.iconChip,
                    )}
                  >
                    <Icon className={cn("h-[18px] w-[18px]", kpi.iconColor)} strokeWidth={2} aria-hidden />
                  </span>
                  <p className="text-[13px] font-semibold text-slate-600">{kpi.label}</p>
                </div>
                <p className="text-[28px] font-extrabold tabular-nums tracking-tight text-slate-900">
                  {kpi.value}
                  {kpi.unit ? (
                    <span className="ml-1 text-lg font-bold text-slate-600">{kpi.unit}</span>
                  ) : null}
                </p>
                {kpi.hint ? <p className="text-xs text-slate-500">{kpi.hint}</p> : null}
              </div>
            </section>
          );
        })}
      </div>

      {/* 2컬럼 — 좌: 할 일+수익 스택 / 우: 진행 현황 */}
      <div className="mt-8 grid gap-5 lg:grid-cols-[minmax(0,38fr)_minmax(0,62fr)] lg:items-start">
        {/* 좌측: 할 일 → 수익 */}
        <div className="flex flex-col gap-5">
          <DashboardRegion
            title="할 일"
            icon={Zap}
            tone="blue"
            footer={
              hasTodoItems ? (
                <details className="group">
                  <summary className="cursor-pointer list-none ds-text-caption font-semibold text-ds-tertiary [&::-webkit-details-marker]:hidden">
                    안내 사항 <span className="text-ds-accent-student group-open:hidden">· 펼치기</span>
                  </summary>
                  <ul className="mt-2 space-y-1.5">
                    {[
                      "작업 시작 전 학생과 충분히 소통해주세요.",
                      "납품은 마감일 전까지 완료해주세요.",
                      "학생 확인 후 3일 내에 정산이 진행됩니다.",
                    ].map((text) => (
                      <li key={text} className="ds-text-caption leading-relaxed text-ds-tertiary">
                        · {text}
                      </li>
                    ))}
                  </ul>
                </details>
              ) : undefined
            }
          >
            {hasTodoItems ? (
              <div className="flex flex-col gap-2">
                {disputeCount > 0 ? (
                  <TodoActionLink
                    href="/mentor/custom-request/orders"
                    label="분쟁"
                    count={disputeCount}
                    tone="danger"
                  />
                ) : null}
                {revisionCount > 0 ? (
                  <TodoActionLink
                    href="/mentor/custom-request/orders?tab=work"
                    label="수정 요청"
                    count={revisionCount}
                    tone="amber"
                  />
                ) : null}
                {deadlineOverdue > 0 ? (
                  <TodoActionLink
                    href="/mentor/custom-request/orders?tab=work"
                    label="마감 초과"
                    count={deadlineOverdue}
                    tone="danger"
                  />
                ) : null}
                {deadlineImminent > 0 ? (
                  <TodoActionLink
                    href="/mentor/custom-request/orders?tab=work"
                    label="마감 임박"
                    count={deadlineImminent}
                    tone="orange"
                  />
                ) : null}
              </div>
            ) : (
              <EmptyState
                title="지금 처리할 일이 없어요"
                description="새 의뢰를 둘러보거나 진행 중인 의뢰를 확인해 보세요."
                action={
                  <LinkButton href="/mentor/custom-request/posts" accent="student">
                    새 의뢰 둘러보기
                  </LinkButton>
                }
                className="border-solid bg-white py-6"
              />
            )}
          </DashboardRegion>

          <DashboardRegion title="수익" icon={TrendingUp} tone="mentor">
            {hasRevenueBreakdown ? (
              <div className={REGION_PANEL}>
                <StatRow
                  label="진행 중 정산"
                  value={`${expectedSettlementCash.toLocaleString("ko-KR")} 캐시`}
                />
                <div className="border-t border-ds-border-subtle/60" />
                <StatRow
                  label="완료(정산 예정)"
                  value={`${paidSettlementCash.toLocaleString("ko-KR")} 캐시`}
                />
              </div>
            ) : (
              <p className="rounded-xl border border-dashed border-slate-200 bg-white px-3 py-2 text-sm text-slate-600">
                정산 내역이 아직 없어요. 의뢰가 완료되면 표시됩니다.
              </p>
            )}

            <Link href="/mentor/payouts" className={LINK_MUTED}>
              정산/수익 관리 →
            </Link>

            {hasRatingData ? (
              <div className="rounded-xl border border-slate-200 bg-white px-3 py-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm text-slate-700">나의 평점</span>
                  <span className="text-sm font-bold text-ds-accent-mentor">
                    {avgRating != null ? avgRating.toFixed(1) : "—"}
                    <span className="font-semibold text-slate-500"> / 5</span>
                  </span>
                </div>
                <Link href="/mentor/reviews" className={`mt-1 inline-flex ${LINK_MUTED}`}>
                  리뷰 {reviewCount}개 →
                </Link>
              </div>
            ) : null}
          </DashboardRegion>
        </div>

        {/* 우측: 진행 현황 */}
        <DashboardRegion
          title="진행 현황"
          icon={ClipboardList}
          tone="violet"
          footer={
            <Link href="/mentor/custom-request/orders" className={LINK_MUTED}>
              수락된 의뢰 전체 보기 →
            </Link>
          }
        >
          <div className={REGION_PANEL}>
            <StatRow label="작업 대기" value={`${billingCount}건`} />
            <div className="border-t border-ds-border-subtle/60" />
            <StatRow label="작업 진행 중" value={`${workCount}건`} />
            <div className="border-t border-ds-border-subtle/60" />
            <StatRow label="납품 대기" value={`${deliveryPendingCount}건`} />
            <div className="border-t border-ds-border-subtle/60" />
            <StatRow
              label="분쟁"
              value={`${disputeCount}건`}
              className="[&_p:first-child]:font-semibold [&_p:first-child]:text-red-800 [&_span]:font-bold [&_span]:text-red-800"
            />
            <div className="border-t border-ds-border-subtle/60" />
            <StatRow label="종료됨" value={`${doneCount}건`} />
          </div>

          <div className="max-w-3xl">
            <SurfaceCard title={`진행 중 의뢰 ${nonDoneOrderCount}`} bodyClassName="p-0">
              {!ordersError && activeOrders.length > 0 ? (
                <ul className="divide-y divide-ds-border-subtle">
                  {activeOrders.slice(0, 4).map((raw) => {
                    const r = raw as Row;
                    const id = typeof r.id === "string" && r.id.trim() ? r.id.trim() : null;
                    if (!id) return null;
                    const status = mentorCustomOrderBrowseStatus(r, activeDisputeOrderIds);
                    const { dday } = mentorOrderDeadlineDisplay(r);
                    return (
                      <li key={id}>
                        <Link
                          href={mentorCustomOrderWorkroomHref(id)}
                          className="flex items-center justify-between gap-2 px-4 py-3 transition hover:bg-slate-50/80"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-bold text-slate-900">
                              {mentorCustomOrderDisplayTitle(r)}
                            </p>
                            <p className="mt-0.5 text-sm text-slate-600">
                              {mentorCustomOrderStudentLabel(r)} · {dday}
                            </p>
                          </div>
                          <StatusBadge label={status.label} kind={status.kind} size="sm" />
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              ) : ordersError ? (
                <p className="px-4 py-6 ds-text-body text-center">데이터를 불러올 수 없습니다.</p>
              ) : (
                <div className="p-3">
                  <EmptyState
                    title="진행 중인 의뢰가 없어요"
                    className="border-solid bg-ds-muted/20 py-4"
                  />
                </div>
              )}
            </SurfaceCard>
          </div>
        </DashboardRegion>
      </div>
    </>
  );
}
