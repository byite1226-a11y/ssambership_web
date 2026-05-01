import type { SupabaseClient } from "@supabase/supabase-js";
import { firstReadableAdminTable } from "@/lib/admin/adminQueries";
import { pickText } from "@/lib/disputes/disputeQueries";
import { pickExistingColumn } from "@/lib/qna/safeSelect";

type Row = Record<string, unknown>;

export type DisputeListItem = {
  id: string;
  typeLabel: string;
  statusLabel: string;
  orderSummary: string;
  row: Row;
};

function idOf(r: Row): string {
  for (const k of ["id", "uuid", "key"]) {
    if (k in r && r[k] !== null && r[k] !== undefined) {
      return String(r[k]);
    }
  }
  return "";
}

function pickType(r: Row): string {
  for (const k of ["type", "kind", "category", "dispute_type", "reason_code"]) {
    if (k in r && r[k] !== null && r[k] !== undefined) {
      return String(r[k]);
    }
  }
  return "—";
}

function pickStatus(r: Row): string {
  for (const k of ["status", "state", "phase", "resolution", "outcome"]) {
    if (k in r && r[k] !== null && r[k] !== undefined) {
      return String(r[k]);
    }
  }
  return "—";
}

function orderLine(r: Row): string {
  const parts: string[] = [];
  for (const k of ["payment_id", "refund_id", "order_id", "subscription_id", "custom_request_order_id", "mentor_order_id"]) {
    if (k in r && r[k] !== null && r[k] !== undefined) {
      parts.push(`${k}: ${String(r[k]).slice(0, 36)}`);
    }
  }
  return parts.length ? parts.join(" · ") : "—";
}

export function mapRowToListItem(r: Row): DisputeListItem {
  return {
    id: idOf(r) || "—",
    typeLabel: pickType(r),
    statusLabel: pickStatus(r),
    orderSummary: orderLine(r),
    row: r,
  };
}

/** 관리자 목록 — 상세 `DisputeAdminPageBody` 사건 요약 키와 맞춤 */
export type AdminDisputeListItem = DisputeListItem & {
  titleLine: string;
  actorSummary: string;
  createdAt: string;
  updatedAt: string;
  /** body / reason / description 요약 */
  summaryReason: string;
  /** 맞춤의뢰 주문 등 식별자 한 줄 */
  orderRef: string;
};

function shortFk(v: unknown): string {
  if (v == null || v === "") return "";
  const s = String(v);
  return s.length > 12 ? `${s.slice(0, 10)}…` : s;
}

/** users 조회 없이 disputes row FK만으로 한 줄(목록 성능) */
export function actorSummaryFromDisputeRow(r: Row): string {
  const parts: string[] = [];
  const rep = r.reporter_id ?? r.created_by ?? r.applicant_id ?? r.opened_by;
  const stu = r.student_id ?? r.user_id ?? r.plaintiff_id ?? r.buyer_id ?? r.client_id;
  const men = r.mentor_id ?? r.mentor_user_id ?? r.defendant_id ?? r.counterparty_id ?? r.expert_id;
  if (rep) parts.push(`신청 ${shortFk(rep)}`);
  if (stu) parts.push(`학생 ${shortFk(stu)}`);
  if (men) parts.push(`멘토 ${shortFk(men)}`);
  return parts.length ? parts.join(" · ") : "—";
}

function timestampish(r: Row, keys: readonly string[]): string {
  for (const k of keys) {
    const v = r[k];
    if (v == null || v === "") continue;
    return String(v);
  }
  return "—";
}

function formatTsKo(v: string): string {
  if (v === "—") return "—";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return v;
  return new Intl.DateTimeFormat("ko-KR", { dateStyle: "medium", timeStyle: "short" }).format(d);
}

function summaryFromRow(r: Row): string {
  const raw = pickText(r, ["body", "reason", "description", "summary", "title"]);
  if (raw === "—") return "—";
  const t = raw.trim();
  return t.length > 120 ? `${t.slice(0, 117)}…` : t;
}

function orderRefFromRow(r: Row): string {
  const id =
    r.custom_request_order_id ??
    r.order_id ??
    r.custom_order_id ??
    r.request_order_id ??
    r.mentor_order_id ??
    r.order_id_linked;
  if (id == null || String(id).trim() === "") return "—";
  const s = String(id).trim();
  return s.length > 12 ? `${s.slice(0, 10)}…` : s;
}

export function mapRowToAdminListItem(r: Row): AdminDisputeListItem {
  const base = mapRowToListItem(r);
  const titleFromFields = pickText(r, ["title", "name", "summary", "subject"]);
  const titleLine = titleFromFields !== "—" ? titleFromFields : pickText(r, ["id", "uuid"]);
  const c0 = timestampish(r, ["created_at", "inserted_at", "opened_at"]);
  const u0 = timestampish(r, ["updated_at", "modified_at", "last_event_at", "resolved_at"]);
  return {
    ...base,
    titleLine,
    actorSummary: actorSummaryFromDisputeRow(r),
    createdAt: formatTsKo(c0),
    updatedAt: formatTsKo(u0),
    summaryReason: summaryFromRow(r),
    orderRef: orderRefFromRow(r),
  };
}

/** 관리자 전용: 세션 RLS로 disputes 읽기 실패 시에만 전달(서버에서 requireRole 이후). 일반 경로는 전달하지 않는다. */
export type LoadDisputesListForAdminOpts = {
  adminBypassClient?: SupabaseClient;
};

/**
 * 관리자 전체 분쟁 목록 — party FK 필터 없음(RLS는 admin 정책에 따름).
 * `adminBypassClient`는 관리자 라우트에서만 세션 조회가 막힐 때 동일 SELECT를 재시도하는 용도.
 */
export async function loadDisputesListForAdmin(
  supabase: SupabaseClient,
  limit = 50,
  opts?: LoadDisputesListForAdminOpts
): Promise<{ table: string | null; items: AdminDisputeListItem[]; error: string | null; probe: string }> {
  let client: SupabaseClient = supabase;
  let disputesProbe = await supabase.from("disputes").select("id").limit(1);
  const sessionProbeEmpty =
    !disputesProbe.error &&
    (!disputesProbe.data || (Array.isArray(disputesProbe.data) && disputesProbe.data.length === 0));
  if ((disputesProbe.error || sessionProbeEmpty) && opts?.adminBypassClient) {
    const b = await opts.adminBypassClient.from("disputes").select("id").limit(1);
    if (!b.error) {
      const bypassHasRow = Array.isArray(b.data) && b.data.length > 0;
      if (bypassHasRow || disputesProbe.error) {
        client = opts.adminBypassClient;
        disputesProbe = b;
      }
    }
  }
  let table: string | null = null;
  let probe = "";
  if (!disputesProbe.error) {
    table = "disputes";
    probe = "disputes · 우선 사용";
  } else {
    const tProbe = await firstReadableAdminTable(client, [
      "disputes",
      "order_disputes",
      "refund_disputes",
      "user_disputes",
      "support_tickets",
    ] as const);
    if (!tProbe.table) {
      return { table: null, items: [], error: tProbe.error ?? null, probe: tProbe.error || "" };
    }
    table = tProbe.table;
    probe = `${table} · 폴백`;
  }
  const run = async (withOrder: boolean) => {
    let q = client.from(table).select("*").limit(limit);
    if (withOrder) {
      q = q.order("created_at", { ascending: false });
    }
    return q;
  };
  let { data, error } = await run(true);
  if (error) {
    if (!/order|column|schema cache|does not exist/i.test(error.message)) {
      return { table, items: [], error: error.message, probe: table };
    }
    const r2 = await run(false);
    data = r2.data;
    error = r2.error;
  }
  if (error) {
    return { table, items: [], error: error.message, probe: table };
  }
  const rows = (data as Row[] | null) ?? [];
  return {
    table,
    items: rows.map((r) => mapRowToAdminListItem(r as Row)),
    error: null,
    probe: `${probe} · 최신순(가능 시 created_at)`,
  };
}

/**
 * 본인 분쟁 목록(학생: 원고, 멘토: 피응·멘토 FK) — 첫로 매칭되는 user FK 컬럼 사용
 */
export async function loadDisputesListForUser(
  supabase: SupabaseClient,
  userId: string,
  kind: "student" | "mentor",
  limit = 40
): Promise<{ table: string | null; items: DisputeListItem[]; error: string | null; usedColumn: string | null; probe: string }> {
  const tProbe = await firstReadableAdminTable(supabase, [
    "disputes",
    "order_disputes",
    "refund_disputes",
    "user_disputes",
    "support_tickets",
  ] as const);
  if (!tProbe.table) {
    return { table: null, items: [], error: tProbe.error, usedColumn: null, probe: tProbe.error || "" };
  }
  const table = tProbe.table;
  const colPool =
    kind === "student"
      ? (["reporter_id", "user_id", "student_id", "created_by", "applicant_id", "plaintiff_id"] as const)
      : (["mentor_id", "mentor_user_id", "expert_id", "responder_id", "counterparty_id", "defendant_id"] as const);

  for (const col of colPool) {
    const { column } = await pickExistingColumn(supabase, table, [col]);
    if (!column) continue;
    const run = async (withOrder: boolean) => {
      let q = supabase.from(table).select("*").eq(column, userId);
      if (withOrder) {
        q = q.order("created_at", { ascending: false });
      }
      return q.limit(limit);
    };
    let { data, error } = await run(true);
    if (error) {
      if (!/order|column|schema cache|does not exist/i.test(error.message)) {
        return { table, items: [], error: error.message, usedColumn: null, probe: table };
      }
      const r2 = await run(false);
      data = r2.data;
      error = r2.error;
    }
    if (error) {
      if (!/column|schema/i.test(error.message)) {
        return { table, items: [], error: error.message, usedColumn: null, probe: table };
      }
      continue;
    }
    const rows = (data as Row[] | null) ?? [];
    if (rows.length) {
      return {
        table,
        items: rows.map((r) => mapRowToListItem(r as Row)),
        error: null,
        usedColumn: column,
        probe: `${table}.${column}`,
      };
    }
  }
  return { table, items: [], error: null, usedColumn: null, probe: `${table}: user FK 후보마다 0건(또는 RLS)` };
}
