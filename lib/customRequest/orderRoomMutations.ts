import type { SupabaseClient } from "@supabase/supabase-js";
import {
  type CustomListResult,
  firstReadableCustomTable,
  mergeOrderChildIdMirrorColumns,
  ORDER_TO_DELIVERABLE_FK_CANDIDATES,
  resolveOrderChildFkReadColumn,
} from "@/lib/customRequest/customRequestQueries";
import { pickExistingColumn } from "@/lib/qna/safeSelect";

type Row = Record<string, unknown>;

export type OrderRoomEventKind =
  | "order_started"
  | "deliverable_submitted"
  | "deliverable_accepted"
  | "message_created"
  | "revision_requested"
  | "dispute_opened"
  | "settlement_item_created"
  | "payment_confirmed";

const ORDER_EVENT_TABLES = ["order_events", "custom_order_events", "request_order_status_events"] as const;

const MESSAGE_TABLES = ["custom_order_messages", "order_messages", "custom_request_order_messages"] as const;

const REVISION_TABLES = ["custom_order_revisions"] as const;

const EVENT_TYPE_KEYS = ["event", "kind", "type", "event_type", "action"] as const;
const EVENT_ACTOR_KEYS = ["actor_id", "user_id", "author_id", "created_by"] as const;
const MESSAGE_AUTHOR_KEYS = ["author_id", "user_id", "sender_id"] as const;
const MESSAGE_ROLE_KEYS = ["sender_role", "role", "actor_role", "party"] as const;

/**
 * 핵심 주문 액션 성공 후 호출. insert 실패 시 console.error만 — 사용자 성공 흐름은 유지.
 */
export async function recordOrderEventBestEffort(
  supabase: SupabaseClient,
  orderId: string,
  kind: OrderRoomEventKind,
  actorId: string,
  extra: Record<string, unknown> = {}
): Promise<void> {
  let table: string | null = null;
  for (const t of ORDER_EVENT_TABLES) {
    const { error: pe } = await supabase.from(t).select("id").limit(1);
    if (!pe) {
      table = t;
      break;
    }
  }
  if (!table) {
    console.error("[recordOrderEventBestEffort] no order_events table", { orderId, kind });
    return;
  }
  const { column: fk } = await pickExistingColumn(supabase, table, [...ORDER_TO_DELIVERABLE_FK_CANDIDATES]);
  if (!fk) {
    console.error("[recordOrderEventBestEffort] no order fk on", table, { orderId, kind });
    return;
  }
  const base: Record<string, unknown> = await mergeOrderChildIdMirrorColumns(supabase, table, orderId, { [fk]: orderId });
  for (const key of EVENT_TYPE_KEYS) {
    const { column: c } = await pickExistingColumn(supabase, table, [key]);
    if (c) {
      base[c] = kind;
      break;
    }
  }
  for (const key of EVENT_ACTOR_KEYS) {
    const { column: c } = await pickExistingColumn(supabase, table, [key]);
    if (c) {
      base[c] = actorId;
      break;
    }
  }
  const { column: metaCol } = await pickExistingColumn(supabase, table, ["metadata", "meta", "data", "payload"]);
  if (metaCol) {
    base[metaCol] = { event: kind, actor_id: actorId, ...extra };
  }
  const { error } = await supabase.from(table).insert(base);
  if (error) {
    console.error("[recordOrderEventBestEffort] insert failed", error.message, { orderId, kind, table, base });
  }
}

export async function loadOrderMessages(supabase: SupabaseClient, orderId: string): Promise<CustomListResult> {
  for (const table of MESSAGE_TABLES) {
    const { error: pe } = await supabase.from(table).select("id").limit(1);
    if (pe) continue;
    const { column: fk } = await resolveOrderChildFkReadColumn(supabase, table);
    if (!fk) continue;
    const o1 = await supabase.from(table).select("*").eq(fk, orderId).order("created_at", { ascending: true });
    if (o1.error) {
      const o2 = await supabase.from(table).select("*").eq(fk, orderId);
      if (o2.error) {
        return { table, sourceNote: "메시지를 불러오지 못했습니다.", rows: [], error: o2.error.message };
      }
      return { table, sourceNote: "시간 순 메시지", rows: (o2.data as Row[]) ?? [], error: null };
    }
    return { table, sourceNote: "주문 메시지", rows: (o1.data as Row[]) ?? [], error: null };
  }
  return { table: null, sourceNote: "이 화면의 주문 메시지를 사용할 수 없습니다.", rows: [], error: null };
}

export async function loadOrderRevisions(supabase: SupabaseClient, orderId: string): Promise<CustomListResult> {
  for (const table of REVISION_TABLES) {
    const { error: pe } = await supabase.from(table).select("id").limit(1);
    if (pe) continue;
    const { column: fk } = await resolveOrderChildFkReadColumn(supabase, table);
    if (!fk) continue;
    const o1 = await supabase.from(table).select("*").eq(fk, orderId).order("created_at", { ascending: false });
    if (o1.error) {
      const o2 = await supabase.from(table).select("*").eq(fk, orderId);
      if (o2.error) {
        return { table, sourceNote: "수정 요청을 불러오지 못했습니다.", rows: [], error: o2.error.message };
      }
      return { table, sourceNote: "최신 순 수정 요청", rows: (o2.data as Row[]) ?? [], error: null };
    }
    return { table, sourceNote: "수정 요청", rows: (o1.data as Row[]) ?? [], error: null };
  }
  return { table: null, sourceNote: "수정 요청 기록이 없을 수 있습니다.", rows: [], error: null };
}

function isMissingCol(msg: string): boolean {
  return /column|does not exist|schema cache/i.test(msg);
}

/**
 * RLS: author = auth.uid(). 주문 당사자만 상위 액션에서 호출.
 */
export async function insertOrderRoomMessage(
  supabase: SupabaseClient,
  orderId: string,
  authorId: string,
  text: string,
  party: "student" | "mentor"
): Promise<{ error: string | null }> {
  const oT = await firstReadableCustomTable(supabase, ["custom_request_orders", "custom_orders", "request_orders"]);
  if (!oT.table) {
    return { error: oT.error || "orders table missing" };
  }
  const dT = await firstReadableCustomTable(supabase, [...MESSAGE_TABLES]);
  if (!dT.table) {
    return { error: dT.error || "messages table missing" };
  }
  const t = dT.table;
  const { column: fk } = await pickExistingColumn(supabase, t, [...ORDER_TO_DELIVERABLE_FK_CANDIDATES]);
  if (!fk) {
    return { error: "messages: order fk column" };
  }
  const idBase: Record<string, unknown> = await mergeOrderChildIdMirrorColumns(supabase, t, orderId, { [fk]: orderId });

  let authorSet = false;
  for (const ak of MESSAGE_AUTHOR_KEYS) {
    const { column: acol } = await pickExistingColumn(supabase, t, [ak]);
    if (acol) {
      idBase[acol] = authorId;
      authorSet = true;
      break;
    }
  }
  if (!authorSet) {
    idBase.author_id = authorId;
  }

  for (const roleKey of MESSAGE_ROLE_KEYS) {
    const { column: rcol } = await pickExistingColumn(supabase, t, [roleKey]);
    if (rcol) {
      (idBase as Record<string, unknown>)[rcol] = party;
      break;
    }
  }

  const withBodies: Record<string, unknown>[] = [
    { ...idBase, body: text },
    { ...idBase, content: text },
    { ...idBase, message: text },
    { ...idBase, text: text },
  ];
  for (const payload of withBodies) {
    const { error } = await supabase.from(t).insert(payload).select("id").limit(1);
    if (!error) {
      return { error: null };
    }
    if (!isMissingCol(error.message)) {
      return { error: error.message };
    }
  }
  return { error: "메시지 insert: 스키마와 맞는 본문 열을 찾지 못했습니다." };
}

const REVISION_AUTHOR_KEYS = ["author_id", "user_id", "requester_id"] as const;

/**
 * 맞춤의뢰 `custom_order_revisions` — 학생 수정 요청 본문은 `request_note` 등.
 */
export async function insertOrderRevisionRequest(
  supabase: SupabaseClient,
  orderId: string,
  authorId: string,
  note: string
): Promise<{ error: string | null }> {
  const oT = await firstReadableCustomTable(supabase, ["custom_request_orders", "custom_orders", "request_orders"]);
  if (!oT.table) {
    return { error: oT.error || "orders table missing" };
  }
  const dT = await firstReadableCustomTable(supabase, [...REVISION_TABLES]);
  if (!dT.table) {
    return { error: dT.error || "revisions table missing" };
  }
  const t = dT.table;
  const { column: fk } = await pickExistingColumn(supabase, t, [...ORDER_TO_DELIVERABLE_FK_CANDIDATES]);
  if (!fk) {
    return { error: "revisions: order fk column" };
  }
  const idBase: Record<string, unknown> = await mergeOrderChildIdMirrorColumns(supabase, t, orderId, { [fk]: orderId });
  for (const ak of REVISION_AUTHOR_KEYS) {
    const { column: acol } = await pickExistingColumn(supabase, t, [ak]);
    if (acol) {
      idBase[acol] = authorId;
      break;
    }
  }
  if (idBase.author_id === undefined && idBase.user_id === undefined) {
    idBase.author_id = authorId;
  }
  const { column: stCol } = await pickExistingColumn(supabase, t, ["status", "state"]);
  if (stCol) {
    idBase[stCol] = "open";
  }

  const noteTrials: Record<string, unknown>[] = [
    { ...idBase, request_note: note },
    { ...idBase, note, body: note },
    { ...idBase, body: note },
  ];
  for (const payload of noteTrials) {
    const { error } = await supabase.from(t).insert(payload).select("id").limit(1);
    if (!error) {
      return { error: null };
    }
    if (!isMissingCol(error.message)) {
      return { error: error.message };
    }
  }
  return { error: "수정 요청 insert: 스키마와 맞는 본문 열을 찾지 못했습니다." };
}

export function pickOrderStudentId(order: Row | null): string {
  if (!order) {
    return "";
  }
  for (const k of ["student_id", "buyer_id", "user_id", "client_id", "author_id", "requester_id"] as const) {
    const v = order[k];
    if (typeof v === "string" && v) {
      return v;
    }
  }
  return "";
}

export function pickOrderMentorIdFromRow(order: Row | null): string {
  if (!order) {
    return "";
  }
  for (const k of ["mentor_id", "mentor_user_id", "assignee_id", "assigned_mentor_id", "selected_mentor_id", "expert_id"] as const) {
    const v = order[k];
    if (typeof v === "string" && v) {
      return v;
    }
  }
  return "";
}

export function orderPartyLabelForMessage(
  message: Row,
  order: Row | null,
  studentId: string,
  mentorId: string
): "학생" | "멘토" | "참여자" {
  for (const k of ["author_id", "user_id", "sender_id"]) {
    const v = message[k];
    if (typeof v === "string" && v) {
      if (v === studentId) {
        return "학생";
      }
      if (v === mentorId) {
        return "멘토";
      }
    }
  }
  for (const rk of MESSAGE_ROLE_KEYS) {
    const v = message[rk];
    if (typeof v === "string" && v) {
      const s = v.toLowerCase();
      if (s.includes("student") || s === "학생") {
        return "학생";
      }
      if (s.includes("mentor") || s === "멘토") {
        return "멘토";
      }
    }
  }
  return "참여자";
}
