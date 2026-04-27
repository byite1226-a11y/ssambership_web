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

export function mapRowToAdminListItem(r: Row): AdminDisputeListItem {
  const base = mapRowToListItem(r);
  const titleFromFields = pickText(r, ["title", "name", "summary", "subject"]);
  const titleLine = titleFromFields !== "—" ? titleFromFields : pickText(r, ["id", "uuid"]);
  return {
    ...base,
    titleLine,
    actorSummary: actorSummaryFromDisputeRow(r),
    createdAt: timestampish(r, ["created_at", "inserted_at", "opened_at"]),
    updatedAt: timestampish(r, ["updated_at", "modified_at", "last_event_at", "resolved_at"]),
  };
}

/**
 * 관리자 전체 분쟁 목록 — party FK 필터 없음(RLS는 admin 정책에 따름)
 */
export async function loadDisputesListForAdmin(
  supabase: SupabaseClient,
  limit = 50
): Promise<{ table: string | null; items: AdminDisputeListItem[]; error: string | null; probe: string }> {
  const tProbe = await firstReadableAdminTable(supabase, [
    "disputes",
    "order_disputes",
    "refund_disputes",
    "user_disputes",
    "support_tickets",
  ] as const);
  if (!tProbe.table) {
    return { table: null, items: [], error: tProbe.error ?? null, probe: tProbe.error || "" };
  }
  const table = tProbe.table;
  const run = async (withOrder: boolean) => {
    let q = supabase.from(table).select("*").limit(limit);
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
    probe: `${table} · 최신순(가능 시 created_at)`,
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
