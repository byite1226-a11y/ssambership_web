import type { SupabaseClient } from "@supabase/supabase-js";
import { getUserProfileById } from "@/lib/auth/getCurrentProfile";
import { firstReadableAdminTable } from "@/lib/admin/adminQueries";
import { pickExistingColumn } from "@/lib/qna/safeSelect";
import { USER_UI_LOAD_FAILED } from "@/lib/constants/userFacingMessages";

type Row = Record<string, unknown>;

export type DisputeBundle = {
  dispute: { table: string | null; row: Row | null; error: string | null };
  refund: { table: string | null; row: Row | null; error: string | null };
  payment: { table: string | null; row: Row | null; error: string | null };
  subscription: { table: string | null; row: Row | null; error: string | null };
  customOrder: { table: string | null; row: Row | null; error: string | null };
  modLogs: { table: string | null; rows: Row[]; error: string | null };
  probe: string;
};

function fkFromRow(row: Row, keys: string[]): string | null {
  for (const k of keys) {
    if (k in row && row[k] !== null && row[k] !== undefined) {
      return String(row[k]);
    }
  }
  return null;
}

/**
 * payment_id가 없을 때 order_id로 order_payments / payments 한 행 probe(캐시·맞춤의뢰 혼동 시 payload로 구분 예정)
 */
async function fetchPaymentRowByOrderId(
  supabase: SupabaseClient,
  orderId: string
): Promise<{ table: string | null; row: Row | null; err: string | null }> {
  for (const table of ["order_payments", "payments", "payment_intents"] as const) {
    const t = await firstReadableAdminTable(supabase, [table]);
    if (!t.table) continue;
    const { column: oc } = await pickExistingColumn(supabase, t.table, [
      "order_id",
      "custom_order_id",
      "request_order_id",
      "custom_request_order_id",
    ]);
    if (!oc) continue;
    const { data, error } = await supabase.from(t.table).select("*").eq(oc, orderId).limit(1);
    if (error) {
      if (!/column|schema cache/i.test(error.message)) {
        return { table: t.table, row: null, err: error.message };
      }
      continue;
    }
    const rows = (data as Row[] | null) ?? [];
    if (rows[0]) {
      return { table: t.table, row: rows[0], err: null };
    }
  }
  return { table: null, row: null, err: null };
}

async function fetchByIdInTable(
  supabase: SupabaseClient,
  tableCandidates: readonly string[],
  idValue: string,
  idCols: readonly string[]
): Promise<{ table: string | null; row: Row | null; err: string | null }> {
  const t = await firstReadableAdminTable(supabase, tableCandidates);
  if (!t.table) {
    return { table: null, row: null, err: t.error || null };
  }
  for (const col of idCols) {
    const { data, error } = await supabase.from(t.table).select("*").eq(col, idValue).limit(1);
    if (error) {
      if (/column|schema cache/i.test(error.message)) {
        continue;
      }
      return { table: t.table, row: null, err: error.message };
    }
    const rows = (data as Row[] | null) ?? [];
    if (rows.length) {
      return { table: t.table, row: rows[0], err: null };
    }
  }
  return { table: t.table, row: null, err: "해당 id로 조회되지 않음" };
}

/** 관리자 상세 전용: 세션으로 disputes 단건이 안 될 때만 전달(requireRole 이후 서버 전용). */
export type LoadDisputeByIdOpts = {
  adminBypassClient?: SupabaseClient;
};

export async function loadDisputeById(
  supabase: SupabaseClient,
  id: string,
  opts?: LoadDisputeByIdOpts
): Promise<DisputeBundle> {
  let dRow: Row | null = null;
  let dErr: string | null = null;
  let resolvedTable: string | null = null;
  /** disputes 본문·연계 조회에 사용(관리자 읽기 우회 시 첫 성공 클라이언트를 끝까지 유지) */
  let readClient: SupabaseClient = supabase;

  const direct = await supabase.from("disputes").select("*").eq("id", id).maybeSingle();
  const sessionMiss = Boolean(direct.error || !direct.data);
  if (!direct.error && direct.data) {
    dRow = direct.data as Row;
    resolvedTable = "disputes";
  } else if (sessionMiss && opts?.adminBypassClient) {
    const bypass = await opts.adminBypassClient.from("disputes").select("*").eq("id", id).maybeSingle();
    if (!bypass.error && bypass.data) {
      readClient = opts.adminBypassClient;
      dRow = bypass.data as Row;
      resolvedTable = "disputes";
    }
  }

  if (!dRow) {
    const tProbe = await firstReadableAdminTable(supabase, [
      "disputes",
      "order_disputes",
      "refund_disputes",
      "user_disputes",
      "support_tickets",
    ] as const);
    dErr = tProbe.error || null;
    resolvedTable = tProbe.table;
    if (tProbe.table) {
      const { data, error } = await supabase.from(tProbe.table).select("*").eq("id", id).maybeSingle();
      if (data) dRow = data as Row;
      else dErr = error?.message ?? dErr;
    }
  }

  if (!dRow) {
    return {
      dispute: { table: resolvedTable, row: null, error: dErr },
      refund: { table: null, row: null, error: null },
      payment: { table: null, row: null, error: null },
      subscription: { table: null, row: null, error: null },
      customOrder: { table: null, row: null, error: null },
      modLogs: { table: null, rows: [], error: null },
      probe: dErr || resolvedTable || "disputes(미로드)",
    };
  }

  const refundId = fkFromRow(dRow, ["refund_id", "refund_request_id", "r_id"]);
  const payId = fkFromRow(dRow, ["payment_id", "order_payment_id", "pg_payment_id", "tx_id"]);
  const subId = fkFromRow(dRow, ["subscription_id", "sub_id"]);
  const cOrderId = fkFromRow(dRow, [
    "custom_request_order_id",
    "mentor_order_id",
    "order_id_linked",
    "order_id",
    "custom_order_id",
    "request_order_id",
  ]);

  const rRef = refundId
    ? await fetchByIdInTable(readClient, ["refunds", "refund_requests", "mentor_refunds"] as const, refundId, ["id"])
    : { table: null, row: null, err: null };
  let pRef = payId
    ? await fetchByIdInTable(readClient, ["payments", "payment_intents", "order_payments"] as const, payId, [
        "id",
        "ext_id",
        "mcht_trd_no",
        "pg_tid",
      ])
    : { table: null, row: null, err: null };
  const sRef = subId
    ? await fetchByIdInTable(readClient, ["subscriptions", "user_subscriptions"] as const, subId, ["id"])
    : { table: null, row: null, err: null };
  const cRef = cOrderId
    ? await fetchByIdInTable(readClient, ["custom_request_orders", "custom_orders", "request_orders"] as const, cOrderId, ["id"])
    : { table: null, row: null, err: null };

  if (!pRef.row && cOrderId) {
    const pByOrder = await fetchPaymentRowByOrderId(readClient, cOrderId);
    if (pByOrder.row) {
      pRef = { table: pByOrder.table, row: pByOrder.row, err: pByOrder.err };
    }
  }

  let mTab: { table: string | null; rows: Row[]; err: string | null } = { table: null, rows: [], err: null };
  const modProbe = await firstReadableAdminTable(readClient, [
    "moderation_logs",
    "dispute_events",
    "support_events",
    "admin_audit_logs",
  ] as const);
  if (modProbe.table) {
    const { column: dCol } = await pickExistingColumn(readClient, modProbe.table, ["dispute_id", "ticket_id", "subject_id", "resource_id", "ref_id"] as const);
    if (dCol) {
      const { data, error } = await readClient.from(modProbe.table).select("*").eq(dCol, id).limit(20);
      mTab = { table: modProbe.table, rows: (data as Row[]) ?? [], err: error?.message ?? null };
    } else {
      const { data, error } = await readClient.from(modProbe.table).select("*").limit(10);
      mTab = { table: modProbe.table, rows: (data as Row[]) ?? [], err: error?.message ?? "dispute FK 없음" };
    }
  } else {
    mTab = { table: null, rows: [], err: modProbe.error || null };
  }

  const probe = [resolvedTable, rRef.table, pRef.table, sRef.table, cRef.table, mTab.table]
    .filter((x) => x != null && x !== "")
    .join(" · ");

  return {
    dispute: { table: resolvedTable, row: dRow, error: null },
    refund: { table: rRef.table, row: rRef.row, error: rRef.err },
    payment: { table: pRef.table, row: pRef.row, error: pRef.err },
    subscription: { table: sRef.table, row: sRef.row, error: sRef.err },
    customOrder: { table: cRef.table, row: cRef.row, error: cRef.err },
    modLogs: { table: mTab.table, rows: mTab.rows, error: mTab.err },
    probe: probe || "—",
  };
}

export function pickText(row: Row | null, keys: string[]): string {
  if (!row) return "—";
  for (const k of keys) {
    const v = row[k];
    if (typeof v === "string" && v.trim()) return v;
  }
  return "—";
}

export function statusBadgeText(row: Row | null, keys: string[]): string {
  if (!row) return "—";
  for (const k of keys) {
    if (k in row && row[k] !== null && row[k] !== undefined) {
      return String(row[k]);
    }
  }
  return "—";
}

const MOD_LOG_TEXT_KEYS = [
  "message",
  "body",
  "detail",
  "note",
  "summary",
  "description",
  "event_type",
  "type",
  "action",
] as const;

/** 처리 로그 row를 사용자 화면용 한 줄로(원문 JSON 노출 방지) */
export function formatModLogLine(row: Record<string, unknown>): string {
  for (const k of MOD_LOG_TEXT_KEYS) {
    const v = row[k];
    if (typeof v === "string" && v.trim()) return v.trim().slice(0, 240);
  }
  const at = row.created_at ?? row.timestamp ?? row.inserted_at;
  if (at != null) {
    const s = String(at);
    return s.length > 22 ? `처리 시각 ${s.slice(0, 19)}…` : `처리 시각 ${s}`;
  }
  return "처리 기록(상세 비공개)";
}

/**
 * W22 목록·상세: refunds / payments / 구독 / 맞춤주문 연계 1줄(스키마·RLS에 따라 empty 가능)
 */
export function w22EntityLine(
  label: string,
  table: string | null,
  row: Row | null,
  err: string | null
): string {
  void table;
  if (err) {
    console.error("[w22EntityLine]", label, err);
    return `${label}: ${USER_UI_LOAD_FAILED}`;
  }
  if (!row) {
    return `${label}: 연계 정보 없음`;
  }
  const id = pickText(row, ["id", "uuid"]);
  const money = pickText(row, ["amount", "total", "amount_krw", "gross", "refund_amount", "price", "net"]);
  const st = pickText(row, ["status", "state", "refund_status", "payment_status"]);
  const bits: string[] = [];
  if (id !== "—") bits.push(`id ${id}`);
  if (money !== "—") bits.push(money);
  if (st !== "—") bits.push(`상태 ${st}`);
  return `${label}: ${bits.join(" · ")}`.trim();
}

/** 학생(기본)은 신고/원고 컬럼, 멘토는 counterparty(선택) */
export function canPartyViewDispute(
  userId: string,
  role: "student" | "mentor",
  row: Row | null
): { ok: boolean; detail: string } {
  if (!row) return { ok: false, detail: "row 없음" };
  for (const k of ["reporter_id", "user_id", "student_id", "created_by", "applicant_id", "plaintiff_id"]) {
    if (k in row && String(row[k]) === userId) {
      return { ok: true, detail: k };
    }
  }
  if (role === "mentor") {
    for (const k of ["mentor_id", "mentor_user_id", "defendant_id", "counterparty_id", "expert_id", "responder_id"]) {
      if (k in row && String(row[k]) === userId) {
        return { ok: true, detail: k };
      }
    }
  }
  return { ok: false, detail: "user 매칭 실패" };
}

export type DisputeActorSummary = {
  id: string | null;
  display: string;
  roleHint: string;
  probe: string;
};

/**
 * 관리자 상세: disputes row에 있는 user FK → public.users 한 줄(가능할 때)
 */
export async function loadDisputeActorSummaries(
  supabase: SupabaseClient,
  dRow: Row
): Promise<{ reporter: DisputeActorSummary; student: DisputeActorSummary; mentor: DisputeActorSummary }> {
  const pickUid = (keys: string[]): string | null => {
    for (const k of keys) {
      const v = dRow[k];
      if (typeof v === "string" && v.length >= 8) {
        return v;
      }
    }
    return null;
  };
  async function one(id: string | null, roleHint: string): Promise<DisputeActorSummary> {
    if (!id) {
      return { id: null, display: "—", roleHint, probe: "FK 없음" };
    }
    const { data, error } = await getUserProfileById(supabase, id);
    if (error || !data) {
      return { id, display: `${id.slice(0, 8)}…`, roleHint, probe: error?.message ?? "users 조회 없음" };
    }
    const display = (data.nickname?.trim() || data.full_name?.trim() || id) as string;
    return { id, display, roleHint, probe: "users" };
  }
  const reporter = await one(
    pickUid(["submitted_by", "reporter_id", "created_by", "applicant_id", "opened_by"]),
    "신청/신고"
  );
  const student = await one(pickUid(["student_id", "user_id", "buyer_id", "client_id", "plaintiff_id"]), "학생/의뢰자");
  const mentor = await one(
    pickUid(["mentor_id", "mentor_user_id", "expert_id", "defendant_id", "counterparty_id", "assigned_mentor_id"]),
    "멘토/상대"
  );
  return { reporter, student, mentor };
}
