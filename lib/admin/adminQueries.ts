import type { PostgrestError, SupabaseClient } from "@supabase/supabase-js";
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
): Promise<{ n: number; detail: string; ok: boolean }> {
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
  return { n: t.n, detail: `전체 ${t.n}건`, ok: true };
}

// —— dashboard —— //

export const ADMIN_DASHBOARD_DATA_MODEL = [
  "멘토 인증·승인",
  "신고 접수",
  "환불",
  "리뷰·평가",
  "정산·지급",
  "감사·기록",
  "공지·분쟁",
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
      return { label, nText: "—", href: path, detail: "목록을 불러올 수 없습니다.", state: "skeleton" };
    }
    return { label, nText: "…", href: path, detail: "목록 연결됨", state: "skeleton" };
  }

  const qMentor = baseMetric(mTable, "/admin/mentor-approvals", "멘토 승인 대기");
  const qRep = baseMetric(rTable, "/admin/reports", "신고 접수");
  const qDis = baseMetric(dTable, "/admin/disputes", "분쟁 진행");
  const qRef = baseMetric(fTable, "/admin/refunds", "환불 요청");
  const qRev = baseMetric(wTable, "/admin/reviews", "리뷰 관리");
  const qSet = baseMetric(sTable, "/admin/settlements", "정산 현황");
  const qAud = baseMetric(aTable, "/admin/audit-logs", "감사 로그");

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
    qRev.detail = t.error ? "목록을 불러오지 못했습니다." : `전체 ${t.n}건`;
    qRev.state = t.n === null ? "skeleton" : t.n === 0 ? "empty" : "connected";
  }
  if (sTable.table) {
    const t = await countAll(supabase, sTable.table);
    qSet.nText = t.n !== null ? String(t.n) : "—";
    qSet.detail = t.error ? "목록을 불러오지 못했습니다." : `전체 ${t.n}건`;
    qSet.state = t.n === null ? "skeleton" : t.n === 0 ? "empty" : "connected";
  }
  if (aTable.table) {
    const t = await countAll(supabase, aTable.table);
    qAud.nText = t.n !== null ? String(t.n) : "—";
    qAud.detail = t.error ? "목록을 불러오지 못했습니다." : `전체 ${t.n}건`;
    qAud.state = t.n === null ? "skeleton" : t.n === 0 ? "empty" : "connected";
  }

  const scaffolds: AdminScaffold[] = [
    {
      title: "운영 상태",
      body: "주요 업무 메뉴의 연결과 목록 조회를 확인했습니다.",
      status: globalError ? "skeleton" : "connected",
    },
    {
      title: "권한 보호",
      body: "관리자만 접근할 수 있는 화면입니다.",
      status: "connected",
    },
    { title: "다음 작업", body: "승인·신고·환불·정산·기록 등 세부 기능을 단계적으로 연결합니다.", status: "skeleton" },
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
    return { table: null, sourceNote: "목록을 연결할 수 없습니다.", rows: [], error: te, keyHints: {} };
  }
  const statusCol = await pickExistingColumn(supabase, table, ["verification_status", "status", "approval_status", "review_state"]);
  const preferPending = ["pending", "submitted", "under_review", "awaiting", "PENDING"] as const;
  if (statusCol.column) {
    for (const v of preferPending) {
      const { data, error } = await supabase.from(table).select("*").eq(statusCol.column, v).limit(limit);
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
  const { rows, error: oe } = await selectWithOrder<Row>(supabase, table, limit);
  return {
    table,
    sourceNote: "최근 생성된 항목부터 표시합니다.",
    rows: oe ? [] : rows,
    error: oe,
    keyHints: { status: statusCol.column, targetType: null, paymentRef: null },
  };
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
