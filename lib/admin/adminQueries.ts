import type { PostgrestError, SupabaseClient } from "@supabase/supabase-js";
import { pickExistingColumn } from "@/lib/qna/safeSelect";

type Row = Record<string, unknown>;

function fmt(e: PostgrestError | null): string | null {
  return e ? e.message : null;
}

/** 테이블 후보 중 RLS/존재 기준 읽기 가능한 첫 테이블 */
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
): Promise<{ n: number; detail: string; ok: boolean }> {
  for (const col of colCandidates) {
    const { column } = await pickExistingColumn(supabase, table, [col]);
    if (!column) continue;
    for (const val of valueCandidates) {
      const r = await countEq(supabase, table, column, val);
      if (r.n !== null && !r.error) {
        return { n: r.n, detail: `${table}.${column} = "${val}"`, ok: true };
      }
    }
  }
  const t = await countAll(supabase, table);
  if (t.n === null) return { n: 0, detail: t.error ?? "count 실패", ok: false };
  return { n: t.n, detail: `${table} 전체 ${t.n}행 (pending 필터 식별 전)`, ok: true };
}

// —— dashboard —— //

export const ADMIN_DASHBOARD_DATA_MODEL = [
  "mentor_profiles (멘토 인증/승인)",
  "reports, abuse_reports (신고)",
  "refunds (환불)",
  "reviews, mentor_reviews, comments (리뷰/모더레이션)",
  "settlements, payouts, mentor_payouts (정산·지급)",
  "audit_logs, audit_events, verification_logs (감사·검증 로그)",
  "notices, disputes (공지/분쟁 — 스키마 확정 시)",
] as const;

export type AdminQueueMetric = {
  label: string;
  nText: string;
  href: string;
  detail: string;
  state: "connected" | "empty" | "skeleton";
};

export type AdminScaffold = { title: string; body: string; status: "connected" | "skeleton" };

export async function loadAdminDashboardMetrics(
  supabase: SupabaseClient
): Promise<{ queueCards: AdminQueueMetric[]; scaffolds: AdminScaffold[]; globalError: string | null }> {
  const mTable = await firstReadableAdminTable(supabase, ["mentor_profiles"]);
  const rTable = await firstReadableAdminTable(supabase, ["reports", "abuse_reports", "content_reports"]);
  const dTable = await firstReadableAdminTable(supabase, [
    "disputes",
    "order_disputes",
    "refund_disputes",
    "user_disputes",
    "support_tickets",
  ] as const);
  const fTable = await firstReadableAdminTable(supabase, ["refunds"]);
  const wTable = await firstReadableAdminTable(supabase, ["reviews", "mentor_reviews"] as const);
  const sTable = await firstReadableAdminTable(supabase, ["settlements", "payouts", "mentor_payouts", "payout_batches"]);
  const aTable = await firstReadableAdminTable(supabase, ["audit_logs", "audit_events", "verification_logs", "admin_audit_logs"] as const);

  const globalError =
    [mTable, rTable, dTable, fTable, wTable, sTable, aTable]
      .map((t) => t.error)
      .find((e) => e && /row-level|permission|RLS|denied/i.test(e!)) || null;

  function baseMetric(
    tProbe: { table: string | null; error: string },
    path: string,
    label: string
  ): AdminQueueMetric {
    if (!tProbe.table) {
      return { label, nText: "—", href: path, detail: tProbe.error || "테이블 읽기 실패", state: "skeleton" };
    }
    return { label, nText: "…", href: path, detail: tProbe.table, state: "skeleton" };
  }

  const qMentor = baseMetric(mTable, "/admin/mentor-approvals", "멘토 승인 큐");
  const qRep = baseMetric(rTable, "/admin/reports", "신고 큐");
  const qDis = baseMetric(dTable, "/admin/disputes", "분쟁(W22)");
  const qRef = baseMetric(fTable, "/admin/refunds", "환불 처리");
  const qRev = baseMetric(wTable, "/admin/reviews", "리뷰");
  const qSet = baseMetric(sTable, "/admin/settlements", "정산");
  const qAud = baseMetric(aTable, "/admin/audit-logs", "감사 로그(최근)");

  if (mTable.table) {
    const p = await countQueuePending(
      supabase,
      mTable.table,
      ["verification_status", "status", "approval_status", "review_state"],
      ["pending", "submitted", "under_review", "awaiting", "PENDING"]
    );
    qMentor.nText = String(p.n);
    qMentor.detail = p.detail;
    qMentor.state = p.ok && p.n === 0 ? "empty" : p.ok ? "connected" : "skeleton";
  }
  if (rTable.table) {
    const p = await countQueuePending(
      supabase,
      rTable.table,
      ["status", "state", "report_status"],
      ["open", "pending", "new", "submitted", "PENDING", "OPEN"]
    );
    qRep.nText = String(p.n);
    qRep.detail = p.detail;
    qRep.state = p.ok && p.n === 0 ? "empty" : p.ok ? "connected" : "skeleton";
  }
  if (dTable.table) {
    const p = await countQueuePending(
      supabase,
      dTable.table,
      ["status", "state", "phase", "resolution", "outcome"],
      ["open", "pending", "new", "submitted", "PENDING", "OPEN", "review", "awaiting"]
    );
    qDis.nText = String(p.n);
    qDis.detail = p.detail;
    qDis.state = p.ok && p.n === 0 ? "empty" : p.ok ? "connected" : "skeleton";
  }
  if (fTable.table) {
    const p = await countQueuePending(
      supabase,
      fTable.table,
      ["status", "refund_status", "state"],
      ["pending", "requested", "open", "PENDING", "REVIEW"]
    );
    qRef.nText = String(p.n);
    qRef.detail = p.detail;
    qRef.state = p.ok && p.n === 0 ? "empty" : p.ok ? "connected" : "skeleton";
  }
  if (wTable.table) {
    const t = await countAll(supabase, wTable.table);
    qRev.nText = t.n !== null ? String(t.n) : "—";
    qRev.detail = t.error ? `${wTable.table}: ${t.error}` : `${wTable.table} 총 행`;
    qRev.state = t.n === null ? "skeleton" : t.n === 0 ? "empty" : "connected";
  }
  if (sTable.table) {
    const t = await countAll(supabase, sTable.table);
    qSet.nText = t.n !== null ? String(t.n) : "—";
    qSet.detail = t.error ? `${sTable.table}: ${t.error}` : `${sTable.table} 총 행(지급상태는 상세)`;
    qSet.state = t.n === null ? "skeleton" : t.n === 0 ? "empty" : "connected";
  }
  if (aTable.table) {
    const t = await countAll(supabase, aTable.table);
    qAud.nText = t.n !== null ? String(t.n) : "—";
    qAud.detail = t.error ? `${aTable.table}: ${t.error}` : `${aTable.table} 총 누적(필터·기간은 후속)`;
    qAud.state = t.n === null ? "skeleton" : t.n === 0 ? "empty" : "connected";
  }

  const scaffolds: AdminScaffold[] = [
    {
      title: "Supabase",
      body: [mTable, rTable, dTable, fTable, wTable, sTable, aTable]
        .map((p) => (p.table ? `${p.table} ✓` : p.error))
        .join(" · "),
      status: globalError ? "skeleton" : "connected",
    },
    {
      title: "권한",
      body: "app/(admin) layout: requireRole(admin) + RLS(운영). 질문방/캐시/마이페이지 쿼리는 변경 없음.",
      status: "connected",
    },
    { title: "다음", body: "승인/신고/환불/정산/로그: server action + RLS(역할) 확정", status: "skeleton" },
  ];

  return { queueCards: [qMentor, qRep, qDis, qRef, qRev, qSet, qAud], scaffolds, globalError };
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
  const { table, error: te } = await firstReadableAdminTable(supabase, ["mentor_profiles"]);
  if (!table) {
    return { table: null, sourceNote: te, rows: [], error: te, keyHints: {} };
  }
  const statusCol = await pickExistingColumn(supabase, table, ["verification_status", "status", "approval_status", "review_state"]);
  const preferPending = ["pending", "submitted", "under_review", "awaiting", "PENDING"] as const;
  if (statusCol.column) {
    for (const v of preferPending) {
      const { data, error } = await supabase.from(table).select("*").eq(statusCol.column, v).limit(limit);
      if (!error && data?.length) {
        return {
          table,
          sourceNote: `${table}.${statusCol.column} = ${v} (최대 ${limit})`,
          rows: (data as Row[]) ?? [],
          error: null,
          keyHints: { status: statusCol.column, targetType: null, paymentRef: null },
        };
      }
    }
  }
  const { rows, error: oe } = await selectWithOrder<Row>(supabase, table, limit);
  return {
    table,
    sourceNote: "pending 정렬/필터 미스 → 최근순(날짜/ id 컬럼 후보)",
    rows: oe ? [] : rows,
    error: oe,
    keyHints: { status: statusCol.column, targetType: null, paymentRef: null },
  };
}

export async function loadAdminReportsList(supabase: SupabaseClient, limit = 30): Promise<AdminListResult> {
  const { table, error: te } = await firstReadableAdminTable(supabase, ["reports", "abuse_reports", "content_reports"]);
  if (!table) {
    return { table: null, sourceNote: te, rows: [], error: te, keyHints: {} };
  }
  const { rows, error } = await selectWithOrder<Row>(supabase, table, limit);
  const tt = await pickExistingColumn(supabase, table, ["target_type", "subject_type", "resource_type", "content_type", "category"]);
  const st = await pickExistingColumn(supabase, table, ["status", "state", "report_status"]);
  return { table, sourceNote: "신고/분쟁(후보명) 테이블 — 상세 /admin/reports/[id] 예정", rows: error ? [] : rows, error, keyHints: { status: st.column, targetType: tt.column } };
}

export async function loadAdminRefundsList(supabase: SupabaseClient, limit = 30): Promise<AdminListResult> {
  const { table, error: te } = await firstReadableAdminTable(supabase, ["refunds", "refund_requests"]);
  if (!table) {
    return { table: null, sourceNote: te, rows: [], error: te, keyHints: {} };
  }
  const { rows, error } = await selectWithOrder<Row>(supabase, table, limit);
  const pay = await pickExistingColumn(supabase, table, ["payment_id", "order_id", "pg_payment_id", "stripe_payment_intent", "imp_uid", "mcht_trd_no"] as const);
  const st = await pickExistingColumn(supabase, table, ["status", "refund_status", "state"]);
  const dCol = await pickExistingColumn(supabase, table, ["dispute_id", "case_id"]);
  return {
    table,
    sourceNote: `dispute_id 등 있으면 «분쟁» 링크(스키마: ${dCol.column ? `쓰는 컬럼·${dCol.column}` : "—"}) / orders·payments FK는 스키마 확정 후`,
    rows: error ? [] : rows,
    error,
    keyHints: { status: st.column, paymentRef: pay.column, disputeRef: dCol.column },
  };
}

export async function loadAdminReviewsList(supabase: SupabaseClient, limit = 30): Promise<AdminListResult> {
  const { table, error: te } = await firstReadableAdminTable(supabase, ["reviews", "mentor_reviews", "mentor_review"]);
  if (!table) {
    return { table: null, sourceNote: te, rows: [], error: te, keyHints: {} };
  }
  const { rows, error } = await selectWithOrder<Row>(supabase, table, limit);
  const hidden = await pickExistingColumn(supabase, table, ["hidden", "is_hidden", "is_blind", "visible", "moderation_state"]);
  return { table, sourceNote: "숨김/블라인드: moderation 컬럼 후보만 힌트", rows: error ? [] : rows, error, keyHints: { status: hidden.column } };
}

export async function loadAdminSettlementsList(supabase: SupabaseClient, limit = 30): Promise<{
  list: AdminListResult;
  byMentorHint: string;
}> {
  const { table, error: te } = await firstReadableAdminTable(supabase, ["settlements", "payouts", "mentor_payouts", "payout_batches", "payout_items"]);
  if (!table) {
    return { list: { table: null, sourceNote: te, rows: [], error: te, keyHints: {} }, byMentorHint: "mentor_id / user_id / recipient_id 후보" };
  }
  const { rows, error } = await selectWithOrder<Row>(supabase, table, limit);
  const mentor = await pickExistingColumn(supabase, table, ["mentor_id", "mentor_user_id", "recipient_id", "user_id", "payee_id"]);
  const st = await pickExistingColumn(supabase, table, ["status", "payout_status", "state", "settlement_state"]);
  return {
    list: { table, sourceNote: "멘토별 roll-up: group by(후속)", rows: error ? [] : rows, error, keyHints: { status: st.column, targetType: mentor.column } },
    byMentorHint: mentor.column
      ? `다음: ${table}.${mentor.column}로 그룹(멘토별 정산)`
      : "mentor를 가리키는 컬럼을 스키마에 맞게 확정",
  };
}

export async function loadAdminAuditLogList(supabase: SupabaseClient, limit = 40): Promise<AdminListResult> {
  const { table, error: te } = await firstReadableAdminTable(supabase, ["audit_logs", "audit_events", "admin_audit_logs", "verification_logs", "moderation_logs", "notices", "disputes"]);
  if (!table) {
    return { table: null, sourceNote: te, rows: [], error: te, keyHints: {} };
  }
  const { rows, error } = await selectWithOrder<Row>(supabase, table, limit);
  const act = await pickExistingColumn(supabase, table, ["action", "event_type", "type", "kind", "verb"]);
  return {
    table,
    sourceNote: "필터(도메인/기간): 쿼리 쿼리스트링·Server action(후속)",
    rows: error ? [] : rows,
    error,
    keyHints: { status: act.column, targetType: act.column },
  };
}
