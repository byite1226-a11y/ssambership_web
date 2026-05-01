import type { PostgrestError, SupabaseClient } from "@supabase/supabase-js";
import { toAdminDisplayError } from "@/lib/admin/adminDisplayError";
import { mentorProfilesAdminReadClient } from "@/lib/admin/mentorProfilesAdminRead";
import { pickExistingColumn } from "@/lib/qna/safeSelect";

type Row = Record<string, unknown>;

function fmt(e: PostgrestError | null): string | null {
  return e ? e.message : null;
}

/** 테이블 후보 중 읽기 가능한 첫 테이블 */
export async function firstReadableAdminTable(
  supabase: SupabaseClient,
  candidates: readonly string[]
): Promise<{ table: string | null; error: string }> {
  let last = "no candidates";
  for (const table of candidates) {
    const { error } = await supabase.from(table).select("*").limit(1);
    if (!error) return { table, error: "" };
    last = error.message;
  }
  return { table: null, error: last };
}

async function selectWithOrder<T extends Row>(
  supabase: SupabaseClient,
  table: string,
  limit: number
): Promise<{ rows: T[]; error: string | null }> {
  const orderCols = ["created_at", "updated_at", "id", "submitted_at"] as const;
  for (const col of orderCols) {
    const { data, error } = await supabase.from(table).select("*").order(col, { ascending: false }).limit(limit);
    if (!error) return { rows: (data as T[] | null) ?? [], error: null };
    if (!/column|does not exist|schema cache/i.test(error.message)) {
      return { rows: [], error: error.message };
    }
  }
  const { data, error } = await supabase.from(table).select("*").limit(limit);
  return { rows: (data as T[] | null) ?? [], error: fmt(error) };
}

async function countAll(supabase: SupabaseClient, table: string): Promise<{ n: number | null; error: string | null }> {
  const { count, error } = await supabase.from(table).select("*", { count: "exact", head: true });
  if (error) return { n: null, error: error.message };
  return { n: count ?? 0, error: null };
}

async function countEq(
  supabase: SupabaseClient,
  table: string,
  col: string,
  val: string
): Promise<{ n: number | null; error: string | null }> {
  const { count, error } = await supabase.from(table).select("*", { count: "exact", head: true }).eq(col, val);
  if (error) return { n: null, error: error.message };
  return { n: count ?? 0, error: null };
}

/** pending류 큐: 컬럼·값 후보로 첫 성공 count */
async function countQueuePending(
  supabase: SupabaseClient,
  table: string,
  colCandidates: readonly string[],
  valueCandidates: readonly string[]
): Promise<{ n: number; detail: string; ok: boolean; usedTotalFallback?: boolean }> {
  for (const col of colCandidates) {
    const { column } = await pickExistingColumn(supabase, table, [col]);
    if (!column) continue;
    for (const val of valueCandidates) {
      const r = await countEq(supabase, table, column, val);
      if (r.n !== null && !r.error) {
        return { n: r.n, detail: `조건에 맞는 건 ${r.n}건`, ok: true };
      }
    }
  }
  const t = await countAll(supabase, table);
  if (t.n === null) return { n: 0, detail: t.error ?? "건수를 확인할 수 없습니다.", ok: false };
  return { n: t.n, detail: `전체 ${t.n}건`, ok: true, usedTotalFallback: true };
}

// —— dashboard —— //

export const ADMIN_DASHBOARD_DATA_MODEL = [
  "멘토 인증·승인",
  "신고 접수",
  "분쟁",
  "환불",
  "리뷰·평가",
  "정산·지급",
  "감사·기록",
  "공지·프로모션",
] as const;

export type AdminQueueMetric = {
  label: string;
  nText: string;
  href: string;
  detail: string;
  state: "connected" | "empty" | "skeleton";
};

export type AdminScaffold = { title: string; body: string; status: "connected" | "skeleton" };

function safeDashboardError(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  return toAdminDisplayError(raw, "default") ?? "목록을 불러올 수 없습니다.";
}

/** errors 객체에 넣을 때: 원문이 없어도 항상 비어 있지 않은 한 줄 안내 */
function dashboardErrorMessage(raw: string | undefined): string {
  return safeDashboardError(raw) ?? "목록을 불러올 수 없습니다.";
}

export type AdminDashboardSummaryErrors = Partial<{
  mentorApprovals: string;
  reports: string;
  disputes: string;
  refunds: string;
  reviews: string;
  settlements: string;
  auditLogs: string;
  notices: string;
}>;

export type AdminDashboardSummary = {
  mentorApprovalPendingCount: number | null;
  reportOpenCount: number | null;
  disputeActiveCount: number | null;
  refundPendingCount: number | null;
  reviewVisibleOrTotalCount: number | null;
  settlementPendingAmount: number | null;
  settlementPendingCount: number | null;
  auditLogCount: number | null;
  noticesActiveCount: number | null;
  /** 상태 컬럼 매칭 실패 시 전체 건수로 대체한 경우 */
  disputeApproximate: boolean;
  errors: AdminDashboardSummaryErrors;
};

function wonLabel(n: number): string {
  return `${new Intl.NumberFormat("ko-KR", { maximumFractionDigits: 0 }).format(Math.round(n))}원`;
}

function metricState(n: number | null, okZero: boolean): AdminQueueMetric["state"] {
  if (n === null) return "skeleton";
  if (okZero && n === 0) return "empty";
  return "connected";
}

async function dashboardRefundPendingCount(
  supabase: SupabaseClient,
  table: string
): Promise<{ n: number | null; err?: string }> {
  const { count, error } = await supabase.from(table).select("*", { count: "exact", head: true }).eq("status", "pending");
  if (error) return { n: null, err: error.message };
  return { n: count ?? 0 };
}

async function dashboardSettlementPending(supabase: SupabaseClient): Promise<{
  count: number | null;
  amount: number | null;
  err?: string;
}> {
  const pageSize = 1000;
  let offset = 0;
  let amount = 0;
  let count = 0;
  for (;;) {
    const { data, error } = await supabase
      .from(COSI_TABLE)
      .select("mentor_amount, status")
      .in("status", ["pending", "on_hold", "payable"])
      .order("id", { ascending: true })
      .range(offset, offset + pageSize - 1);
    if (error) return { count: null, amount: null, err: error.message };
    const rows = (data ?? []) as { mentor_amount?: unknown; status?: unknown }[];
    if (!rows.length) break;
    count += rows.length;
    for (const r of rows) {
      amount += toMoneyInt(r.mentor_amount);
    }
    if (rows.length < pageSize) break;
    offset += pageSize;
  }
  return { count, amount, err: undefined };
}

async function dashboardNoticesActiveCount(supabase: SupabaseClient): Promise<{ n: number | null; err?: string }> {
  let total = 0;
  const errs: string[] = [];
  const a = await supabase.from("app_notices").select("*", { count: "exact", head: true }).eq("is_active", true);
  if (a.error) errs.push(a.error.message);
  else total += a.count ?? 0;
  const b = await supabase.from("promotion_campaigns").select("*", { count: "exact", head: true }).eq("is_active", true);
  if (b.error) errs.push(b.error.message);
  else total += b.count ?? 0;
  if (errs.length === 2) return { n: null, err: errs[0] };
  if (errs.length === 1 && total === 0) return { n: null, err: errs[0] };
  return { n: total };
}

/**
 * 관리자 대시보드용 집계(각 메뉴와 동일한 테이블·상태 기준을 최대한 맞춤).
 */
export async function loadAdminDashboardSummary(supabase: SupabaseClient): Promise<AdminDashboardSummary> {
  const errors: AdminDashboardSummaryErrors = {};

  const mentorRead = mentorProfilesAdminReadClient(supabase);
  const mTable = await firstReadableAdminTable(mentorRead, ["mentor_profiles"]);
  let mentorApprovalPendingCount: number | null = null;
  if (!mTable.table) {
    errors.mentorApprovals = dashboardErrorMessage(mTable.error);
  } else {
    const p = await countQueuePending(
      mentorRead,
      mTable.table,
      ["verification_status", "status", "approval_status", "review_state"],
      ["pending", "submitted", "under_review", "awaiting", "PENDING"]
    );
    if (!p.ok) {
      mentorApprovalPendingCount = null;
      errors.mentorApprovals = dashboardErrorMessage(p.detail);
    } else {
      mentorApprovalPendingCount = p.n;
    }
  }

  const rTable = await firstReadableAdminTable(supabase, ["reports", "abuse_reports", "content_reports"]);
  let reportOpenCount: number | null = null;
  if (!rTable.table) {
    errors.reports = dashboardErrorMessage(rTable.error);
  } else {
    const p = await countQueuePending(
      supabase,
      rTable.table,
      ["status", "state", "report_status"],
      ["open", "pending", "new", "submitted", "PENDING", "OPEN"]
    );
    if (!p.ok) {
      reportOpenCount = null;
      errors.reports = dashboardErrorMessage(p.detail);
    } else {
      reportOpenCount = p.n;
    }
  }

  const dTable = await firstReadableAdminTable(supabase, [
    "disputes",
    "order_disputes",
    "refund_disputes",
    "user_disputes",
    "support_tickets",
  ] as const);
  let disputeActiveCount: number | null = null;
  let disputeApproximate = false;
  if (!dTable.table) {
    errors.disputes = dashboardErrorMessage(dTable.error);
  } else {
    const p = await countQueuePending(
      supabase,
      dTable.table,
      ["status", "state", "phase", "resolution", "outcome"],
      ["open", "pending", "new", "submitted", "PENDING", "OPEN", "review", "awaiting"]
    );
    if (!p.ok) {
      disputeActiveCount = null;
      errors.disputes = dashboardErrorMessage(p.detail);
    } else {
      disputeActiveCount = p.n;
      disputeApproximate = Boolean(p.usedTotalFallback);
    }
  }

  const fTable = await firstReadableAdminTable(supabase, ["refunds"]);
  let refundPendingCount: number | null = null;
  if (!fTable.table) {
    errors.refunds = dashboardErrorMessage(fTable.error);
  } else {
    const rp = await dashboardRefundPendingCount(supabase, fTable.table);
    if (rp.err) {
      refundPendingCount = null;
      errors.refunds = dashboardErrorMessage(rp.err);
    } else {
      refundPendingCount = rp.n;
    }
  }

  const wTable = await firstReadableAdminTable(supabase, ["reviews", "mentor_reviews", "mentor_review"] as const);
  let reviewVisibleOrTotalCount: number | null = null;
  if (!wTable.table) {
    errors.reviews = dashboardErrorMessage(wTable.error);
  } else {
    const t = await countAll(supabase, wTable.table);
    if (t.n === null) {
      reviewVisibleOrTotalCount = null;
      errors.reviews = dashboardErrorMessage(t.error ?? undefined);
    } else {
      reviewVisibleOrTotalCount = t.n;
    }
  }

  let settlementPendingAmount: number | null = null;
  let settlementPendingCount: number | null = null;
  const sp = await dashboardSettlementPending(supabase);
  if (sp.err) {
    errors.settlements = dashboardErrorMessage(sp.err);
  } else {
    settlementPendingAmount = sp.amount;
    settlementPendingCount = sp.count;
  }

  const aTable = await firstReadableAdminTable(supabase, ["audit_logs", "audit_events", "verification_logs", "admin_audit_logs"] as const);
  let auditLogCount: number | null = null;
  if (!aTable.table) {
    errors.auditLogs = dashboardErrorMessage(aTable.error);
  } else {
    const t = await countAll(supabase, aTable.table);
    if (t.n === null) {
      auditLogCount = null;
      errors.auditLogs = dashboardErrorMessage(t.error ?? undefined);
    } else {
      auditLogCount = t.n;
    }
  }

  let noticesActiveCount: number | null = null;
  const nc = await dashboardNoticesActiveCount(supabase);
  noticesActiveCount = nc.n;
  if (nc.n === null && nc.err) {
    errors.notices = dashboardErrorMessage(nc.err);
  }

  return {
    mentorApprovalPendingCount,
    reportOpenCount,
    disputeActiveCount,
    refundPendingCount,
    reviewVisibleOrTotalCount,
    settlementPendingAmount,
    settlementPendingCount,
    auditLogCount,
    noticesActiveCount,
    disputeApproximate,
    errors,
  };
}

function summaryToQueueCards(summary: AdminDashboardSummary): AdminQueueMetric[] {
  const fmt = (n: number | null) => (n === null ? "—" : String(n));

  const qMentor: AdminQueueMetric = {
    label: "멘토 승인 대기",
    nText: fmt(summary.mentorApprovalPendingCount),
    href: "/admin/mentor-approvals",
    detail:
      summary.mentorApprovalPendingCount === null
        ? "목록을 불러올 수 없습니다."
        : summary.mentorApprovalPendingCount === 0
          ? "연결된 운영 데이터가 없습니다."
          : "승인 대기·검토 중 멘토 신청 건수입니다.",
    state: metricState(summary.mentorApprovalPendingCount, true),
  };

  const qRep: AdminQueueMetric = {
    label: "신고 접수",
    nText: fmt(summary.reportOpenCount),
    href: "/admin/reports",
    detail:
      summary.reportOpenCount === null
        ? "목록을 불러올 수 없습니다."
        : summary.reportOpenCount === 0
          ? "연결된 운영 데이터가 없습니다."
          : "접수·진행 중 신고 건수입니다.",
    state: metricState(summary.reportOpenCount, true),
  };

  const qDis: AdminQueueMetric = {
    label: "분쟁 진행",
    nText: fmt(summary.disputeActiveCount),
    href: "/admin/disputes",
    detail:
      summary.disputeActiveCount === null
        ? "목록을 불러올 수 없습니다."
        : summary.disputeApproximate
          ? "진행 상태 필터가 맞지 않아 전체 건수로 표시합니다. 확인이 필요합니다."
          : "진행 중인 분쟁 추정 건수입니다.",
    state: metricState(summary.disputeActiveCount, true),
  };

  const qRef: AdminQueueMetric = {
    label: "환불 요청",
    nText: fmt(summary.refundPendingCount),
    href: "/admin/refunds",
    detail:
      summary.refundPendingCount === null
        ? "목록을 불러올 수 없습니다."
        : summary.refundPendingCount === 0
          ? "연결된 운영 데이터가 없습니다."
          : "상태가 대기인 환불 요청 건수입니다.",
    state: metricState(summary.refundPendingCount, true),
  };

  const qRev: AdminQueueMetric = {
    label: "리뷰 관리",
    nText: fmt(summary.reviewVisibleOrTotalCount),
    href: "/admin/reviews",
    detail:
      summary.reviewVisibleOrTotalCount === null
        ? "목록을 불러올 수 없습니다."
        : summary.reviewVisibleOrTotalCount === 0
          ? "연결된 운영 데이터가 없습니다."
          : "등록된 리뷰 전체 건수입니다.",
    state: metricState(summary.reviewVisibleOrTotalCount, true),
  };

  const amt = summary.settlementPendingAmount ?? 0;
  const qSet: AdminQueueMetric = {
    label: "정산 현황",
    nText:
      summary.settlementPendingCount === null
        ? "—"
        : `${summary.settlementPendingCount}건`,
    href: "/admin/settlements",
    detail:
      summary.settlementPendingAmount === null || summary.settlementPendingCount === null
        ? "목록을 불러올 수 없습니다."
        : `${wonLabel(amt)} 지급 대기(멘토 정산금)`,
    state:
      summary.settlementPendingCount === null && summary.settlementPendingAmount === null
        ? "skeleton"
        : summary.settlementPendingCount === 0
          ? "empty"
          : "connected",
  };

  const qAud: AdminQueueMetric = {
    label: "감사 로그",
    nText: fmt(summary.auditLogCount),
    href: "/admin/audit-logs",
    detail:
      summary.auditLogCount === null
        ? "목록을 불러올 수 없습니다."
        : summary.auditLogCount === 0
          ? "연결된 운영 데이터가 없습니다."
          : "누적 로그 건수입니다.",
    state: metricState(summary.auditLogCount, true),
  };

  const qNotices: AdminQueueMetric = {
    label: "공지·프로모션",
    nText: fmt(summary.noticesActiveCount),
    href: "/admin/notices",
    detail:
      summary.noticesActiveCount === null
        ? "목록을 불러올 수 없습니다."
        : summary.noticesActiveCount === 0
          ? "연결된 운영 데이터가 없습니다."
          : "활성 공지·프로모션 합계입니다.",
    state: metricState(summary.noticesActiveCount, true),
  };

  return [qMentor, qRep, qDis, qRef, qRev, qSet, qAud, qNotices];
}

export async function loadAdminDashboardMetrics(
  supabase: SupabaseClient
): Promise<{ queueCards: AdminQueueMetric[]; scaffolds: AdminScaffold[]; globalError: string | null }> {
  const summary = await loadAdminDashboardSummary(supabase);
  const queueCards = summaryToQueueCards(summary);

  const hasErr = Object.keys(summary.errors).length > 0;
  const globalError = hasErr ? "일부 집계를 불러오지 못했습니다. 각 메뉴에서 상세를 확인해 주세요." : null;

  const scaffolds: AdminScaffold[] = [
    {
      title: "운영 상태",
      body: "주요 운영 메뉴와 최근 집계 상태를 확인할 수 있습니다.",
      status: hasErr ? "skeleton" : "connected",
    },
    {
      title: "권한 보호",
      body: "관리자 권한이 확인된 세션에서만 접근할 수 있습니다.",
      status: "connected",
    },
    {
      title: "다음 작업",
      body: "세부 처리는 각 관리 메뉴에서 진행합니다.",
      status: "skeleton",
    },
    {
      title: "운영 지표",
      body: "최근 운영 데이터를 기준으로 집계합니다.",
      status: "connected",
    },
    {
      title: "긴급 알림",
      body: "별도 알림 채널은 아직 연결되어 있지 않습니다.",
      status: "skeleton",
    },
  ];

  return { queueCards, scaffolds, globalError };
}

// —— sub-pages: list fetches (실데이터, 없으면 empty + error) —— //

export type AdminListResult = {
  table: string | null;
  sourceNote: string;
  rows: Row[];
  error: string | null;
  /** UI에서 '대상 유형' 등으로 쓰일 후보 컬럼명 */
  keyHints: { status?: string | null; targetType?: string | null; paymentRef?: string | null; disputeRef?: string | null };
};

export async function loadMentorApprovalsList(supabase: SupabaseClient, limit = 30): Promise<AdminListResult> {
  const db = mentorProfilesAdminReadClient(supabase);
  const { table, error: te } = await firstReadableAdminTable(db, ["mentor_profiles"]);
  if (!table) {
    return { table: null, sourceNote: "목록을 연결할 수 없습니다.", rows: [], error: te, keyHints: {} };
  }
  const statusCol = await pickExistingColumn(db, table, ["verification_status", "status", "approval_status", "review_state"]);
  const preferPending = ["pending", "submitted", "under_review", "awaiting", "PENDING"] as const;
  if (statusCol.column) {
    for (const v of preferPending) {
      const { data, error } = await db.from(table).select("*").eq(statusCol.column, v).limit(limit);
      if (!error && data?.length) {
        return {
          table,
          sourceNote: "승인 대기 상태를 우선 표시합니다.",
          rows: (data as Row[]) ?? [],
          error: null,
          keyHints: { status: statusCol.column, targetType: null, paymentRef: null },
        };
      }
    }
  }
  const { rows, error: oe } = await selectWithOrder<Row>(db, table, limit);
  return {
    table,
    sourceNote: "최근 생성된 항목부터 표시합니다.",
    rows: oe ? [] : rows,
    error: oe,
    keyHints: { status: statusCol.column, targetType: null, paymentRef: null },
  };
}

/** 멘토 승인 목록의 user_id에 대응하는 users 표시용(서비스 롤 등 읽기 클라이언트 권장). */
export async function fetchAdminUsersDisplayByIds(
  supabase: SupabaseClient,
  ids: string[]
): Promise<Map<string, { nickname: string | null; full_name: string | null }>> {
  const map = new Map<string, { nickname: string | null; full_name: string | null }>();
  const unique = [...new Set(ids.filter((x) => typeof x === "string" && x.length > 0))] as string[];
  const slice = unique.slice(0, 80);
  if (!slice.length) return map;
  const { data } = await supabase.from("users").select("id, nickname, full_name").in("id", slice);
  const rows = (data ?? []) as { id?: string; nickname?: string | null; full_name?: string | null }[];
  for (const r of rows) {
    const id = r.id != null ? String(r.id) : "";
    if (id) map.set(id, { nickname: r.nickname ?? null, full_name: r.full_name ?? null });
  }
  return map;
}

export async function loadAdminReportsList(supabase: SupabaseClient, limit = 30): Promise<AdminListResult> {
  const { table, error: te } = await firstReadableAdminTable(supabase, ["reports", "abuse_reports", "content_reports"]);
  if (!table) {
    return { table: null, sourceNote: "목록을 연결할 수 없습니다.", rows: [], error: te, keyHints: {} };
  }
  const { rows, error } = await selectWithOrder<Row>(supabase, table, limit);
  const tt = await pickExistingColumn(supabase, table, ["target_type", "subject_type", "resource_type", "content_type", "category"]);
  const st = await pickExistingColumn(supabase, table, ["status", "state", "report_status"]);
  return { table, sourceNote: "최근 생성된 항목부터 표시합니다.", rows: error ? [] : rows, error, keyHints: { status: st.column, targetType: tt.column } };
}

export async function loadAdminRefundsList(supabase: SupabaseClient, limit = 30): Promise<AdminListResult> {
  const { table, error: te } = await firstReadableAdminTable(supabase, ["refunds"]);
  if (!table) {
    return { table: null, sourceNote: "목록을 연결할 수 없습니다.", rows: [], error: te, keyHints: {} };
  }
  const { rows, error } = await selectWithOrder<Row>(supabase, table, limit);
  const pay = await pickExistingColumn(supabase, table, ["payment_id", "order_id", "pg_payment_id", "stripe_payment_intent", "imp_uid", "mcht_trd_no"] as const);
  const st = await pickExistingColumn(supabase, table, ["status", "refund_status", "state"]);
  const dCol = await pickExistingColumn(supabase, table, ["dispute_id", "case_id"]);
  return {
    table,
    sourceNote: "최근 요청 기준으로 표시합니다.",
    rows: error ? [] : rows,
    error,
    keyHints: { status: st.column, paymentRef: pay.column, disputeRef: dCol.column },
  };
}

export async function loadAdminReviewsList(supabase: SupabaseClient, limit = 30): Promise<AdminListResult> {
  const { table, error: te } = await firstReadableAdminTable(supabase, ["reviews", "mentor_reviews", "mentor_review"]);
  if (!table) {
    return { table: null, sourceNote: "목록을 연결할 수 없습니다.", rows: [], error: te, keyHints: {} };
  }
  const { rows, error } = await selectWithOrder<Row>(supabase, table, limit);
  const hidden = await pickExistingColumn(supabase, table, ["hidden", "is_hidden", "is_blind", "visible", "moderation_state"]);
  return { table, sourceNote: "최근 생성된 항목부터 표시합니다.", rows: error ? [] : rows, error, keyHints: { status: hidden.column } };
}

const COSI_TABLE = "custom_order_settlement_items" as const;

/** 맞춤의뢰 정산 항목 상태 → 운영자 표기 */
export function adminSettlementStatusLabel(status: string): string {
  const s = status.trim().toLowerCase();
  const map: Record<string, string> = {
    pending: "지급 대기",
    on_hold: "보류",
    payable: "지급 가능",
    paid: "지급 완료",
    cancelled: "취소",
  };
  return map[s] ?? `${status} (확인 필요)`;
}

function toMoneyInt(v: unknown): number {
  if (typeof v === "number" && Number.isFinite(v)) return Math.round(v);
  if (typeof v === "string" && v.trim() !== "") {
    const n = Number(v);
    return Number.isFinite(n) ? Math.round(n) : 0;
  }
  return 0;
}

export type AdminSettlementSummary = {
  totalRows: number;
  pendingMentorAmountSum: number;
  paidMentorAmountSum: number;
  pendingCount: number;
  onHoldCount: number;
  payableCount: number;
  paidCount: number;
  cancelledCount: number;
};

export type AdminSettlementListItem = {
  id: string;
  customRequestOrderId: string;
  mentorId: string;
  studentId: string | null;
  grossAmount: number;
  platformFeeAmount: number;
  mentorAmount: number;
  feeRate: number;
  status: string;
  reason: string | null;
  paidAt: string | null;
  createdAt: string;
  updatedAt: string;
  /** 주문 보조 조회 성공 시 툴팁용(한 줄) */
  orderMetaLine: string | null;
};

function emptySettlementSummary(): AdminSettlementSummary {
  return {
    totalRows: 0,
    pendingMentorAmountSum: 0,
    paidMentorAmountSum: 0,
    pendingCount: 0,
    onHoldCount: 0,
    payableCount: 0,
    paidCount: 0,
    cancelledCount: 0,
  };
}

function summarizeSettlementRows(rows: AdminSettlementListItem[]): AdminSettlementSummary {
  const s = emptySettlementSummary();
  s.totalRows = rows.length;
  for (const r of rows) {
    const st = r.status.trim().toLowerCase();
    const m = r.mentorAmount;
    if (st === "pending" || st === "on_hold" || st === "payable") {
      s.pendingMentorAmountSum += m;
    }
    if (st === "paid") {
      s.paidMentorAmountSum += m;
    }
    if (st === "pending") s.pendingCount += 1;
    else if (st === "on_hold") s.onHoldCount += 1;
    else if (st === "payable") s.payableCount += 1;
    else if (st === "paid") s.paidCount += 1;
    else if (st === "cancelled") s.cancelledCount += 1;
  }
  return s;
}

function parseCosItem(r: Row): AdminSettlementListItem | null {
  const id = r.id != null ? String(r.id) : "";
  if (!id) return null;
  const feeRaw = r.fee_rate;
  const feeNum = typeof feeRaw === "number" ? feeRaw : Number(feeRaw);
  return {
    id,
    customRequestOrderId: String(r.custom_request_order_id ?? ""),
    mentorId: String(r.mentor_id ?? ""),
    studentId: r.student_id != null && String(r.student_id).length ? String(r.student_id) : null,
    grossAmount: toMoneyInt(r.gross_amount),
    platformFeeAmount: toMoneyInt(r.platform_fee_amount),
    mentorAmount: toMoneyInt(r.mentor_amount),
    feeRate: Number.isFinite(feeNum) ? feeNum : 0,
    status: String(r.status ?? "pending"),
    reason: r.reason != null && String(r.reason).length ? String(r.reason) : null,
    paidAt: r.paid_at != null ? String(r.paid_at) : null,
    createdAt: String(r.created_at ?? ""),
    updatedAt: String(r.updated_at ?? ""),
    orderMetaLine: null,
  };
}

function chunkIds(ids: string[], size: number): string[][] {
  const out: string[][] = [];
  for (let i = 0; i < ids.length; i += size) out.push(ids.slice(i, i + size));
  return out;
}

/** 주문 보조 정보(실패해도 정산 목록은 유지) */
async function fetchCustomRequestOrdersMap(supabase: SupabaseClient, orderIds: string[]): Promise<Map<string, Row>> {
  const map = new Map<string, Row>();
  const unique = [...new Set(orderIds.filter(Boolean))];
  if (!unique.length) return map;
  for (const part of chunkIds(unique, 80)) {
    const { data, error } = await supabase
      .from("custom_request_orders")
      .select("id, payment_status, status, state, order_status, agreed_price, proposed_price, price, amount, completed_at")
      .in("id", part);
    if (error || !data) continue;
    for (const row of data as Row[]) {
      const oid = String(row.id ?? "");
      if (oid) map.set(oid, row);
    }
  }
  return map;
}

function buildOrderMetaLine(o: Row): string | null {
  const parts: string[] = [];
  const ps = o.payment_status;
  if (ps != null && String(ps).trim()) parts.push(`결제: ${String(ps)}`);
  const st = [o.status, o.state, o.order_status]
    .map((x) => (x != null ? String(x).trim() : ""))
    .filter(Boolean);
  if (st.length) parts.push(`주문: ${st.join("/")}`);
  const price =
    o.agreed_price ?? o.proposed_price ?? o.price ?? o.amount;
  if (price != null && String(price).trim() !== "") {
    try {
      parts.push(`금액: ${new Intl.NumberFormat("ko-KR").format(toMoneyInt(price))}원`);
    } catch {
      parts.push("금액: —");
    }
  }
  if (o.completed_at != null && String(o.completed_at).trim()) {
    parts.push(`완료: ${String(o.completed_at).slice(0, 19)}`);
  }
  return parts.length ? parts.join(" · ") : null;
}

export async function loadAdminSettlementsList(
  supabase: SupabaseClient,
  limit = 50
): Promise<{
  rows: AdminSettlementListItem[];
  summary: AdminSettlementSummary;
  queryOk: boolean;
  byMentorHint: string;
}> {
  const byMentorHint = "멘토별 정산 요약은 추후 확장 예정입니다.";

  const { data, error } = await supabase
    .from(COSI_TABLE)
    .select(
      "id, custom_request_order_id, mentor_id, student_id, gross_amount, platform_fee_amount, mentor_amount, fee_rate, status, reason, paid_at, created_at, updated_at"
    )
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    return { rows: [], summary: emptySettlementSummary(), queryOk: false, byMentorHint };
  }

  const rawRows = (data ?? []) as Row[];
  const items: AdminSettlementListItem[] = [];
  for (const r of rawRows) {
    const it = parseCosItem(r);
    if (it) items.push(it);
  }

  const orderMap = await fetchCustomRequestOrdersMap(
    supabase,
    items.map((i) => i.customRequestOrderId)
  );
  for (const it of items) {
    const o = orderMap.get(it.customRequestOrderId);
    if (o) it.orderMetaLine = buildOrderMetaLine(o);
  }

  return {
    rows: items,
    summary: summarizeSettlementRows(items),
    queryOk: true,
    byMentorHint,
  };
}

export async function loadAdminAuditLogList(supabase: SupabaseClient, limit = 40): Promise<AdminListResult> {
  const { table, error: te } = await firstReadableAdminTable(supabase, ["audit_logs", "audit_events", "admin_audit_logs", "verification_logs", "moderation_logs", "notices", "disputes"]);
  if (!table) {
    return { table: null, sourceNote: "목록을 연결할 수 없습니다.", rows: [], error: te, keyHints: {} };
  }
  const { rows, error } = await selectWithOrder<Row>(supabase, table, limit);
  const act = await pickExistingColumn(supabase, table, ["action", "event_type", "type", "kind", "verb"]);
  return {
    table,
    sourceNote: "최근 운영 이벤트 기준으로 표시합니다.",
    rows: error ? [] : rows,
    error,
    keyHints: { status: act.column, targetType: act.column },
  };
}
