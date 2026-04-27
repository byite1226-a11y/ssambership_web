import type { SupabaseClient } from "@supabase/supabase-js";
import { pickExistingColumn } from "@/lib/qna/safeSelect";

type Row = Record<string, unknown>;

const TABLE = "notifications";

const USER_FK = ["user_id", "recipient_id", "student_id", "mentor_id", "target_user_id", "owner_id"] as const;
const READ_FK = ["read_at", "read_at_utc", "is_read", "seen_at", "opened_at", "viewed_at", "acknowledged_at"] as const;
const TYPE_FK = [
  "type",
  "kind",
  "category",
  "event_type",
  "notification_type",
  "channel",
  "template",
] as const;
const ORDER_CANDIDATES = ["created_at", "inserted_at", "sent_at", "updated_at", "id"] as const;

export const NOTIFICATIONS_HUB_DATA_MODEL = [
  "notifications (수신자 FK, type, read 상태, created_at — 스키마별 상이)",
  "users (발신/수신 표기 후속)",
  "question_threads / mentor_student_rooms (딥링크 payload 후속)",
  "payments, custom_request_orders (엔티티 id → 링크)",
  "notices, site_notices (공지 연동)",
] as const;

export type NotificationHubLoad = {
  error: string | null;
  probe: string;
  userColumn: string | null;
  readColumn: string | null;
  typeColumn: string | null;
  orderColumn: string | null;
  rows: Row[];
  /** 읽지 않음 탭: 메모리에서 필터했는지(스키마/쿼리에 따라) */
  unreadUsedMemoryFilter: boolean;
  /** read 컬럼이 없어 읽지 않음 탭을 지원하지 않음 */
  unreadFilterBlocked: boolean;
};

export function isNotificationReadRow(row: Row, readCol: string | null): boolean {
  if (!readCol) return false;
  const v = row[readCol];
  if (readCol === "is_read" || readCol === "read" || readCol === "acknowledged") {
    return v === true || v === 1 || v === "true" || v === 1.0;
  }
  return v != null && String(v) !== "" && !String(v).startsWith("1970-01-01");
}

/**
 * userId = 수신자인 알림 row (최신 순). 읽지 않음 탭은 read 컬럼이 있으면 메모리 필터.
 */
export async function loadNotificationsHub(
  supabase: SupabaseClient,
  userId: string,
  options: { filter: "all" | "unread" }
): Promise<NotificationHubLoad> {
  const { error: pe } = await supabase.from(TABLE).select("id").limit(1);
  if (pe) {
    return {
      error: pe.message,
      probe: `${TABLE} 테이블 probe 실패`,
      userColumn: null,
      readColumn: null,
      typeColumn: null,
      orderColumn: null,
      rows: [],
      unreadUsedMemoryFilter: false,
      unreadFilterBlocked: false,
    };
  }

  const { column: readCol } = await pickExistingColumn(supabase, TABLE, READ_FK);
  const { column: typeCol } = await pickExistingColumn(supabase, TABLE, TYPE_FK);

  let userColumn: string | null = null;
  let lastUserErr: string | null = null;
  for (const col of USER_FK) {
    const p = await supabase.from(TABLE).select("id").eq(col, userId).limit(1);
    if (!p.error) {
      userColumn = col;
      break;
    }
    lastUserErr = p.error.message;
  }

  if (!userColumn) {
    return {
      error: lastUserErr,
      probe: "user_id/recipient_id 등 FK를 찾지 못함",
      userColumn: null,
      readColumn: readCol,
      typeColumn: typeCol,
      orderColumn: null,
      rows: [],
      unreadUsedMemoryFilter: false,
      unreadFilterBlocked: false,
    };
  }

  let orderColUsed: string | null = null;
  let allRows: Row[] = [];
  let loadErr: string | null = null;

  for (const ocol of ORDER_CANDIDATES) {
    const { data, error } = await supabase
      .from(TABLE)
      .select("*")
      .eq(userColumn, userId)
      .order(ocol, { ascending: false })
      .limit(200);
    if (!error) {
      allRows = (data as Row[]) ?? [];
      orderColUsed = ocol;
      loadErr = null;
      break;
    }
    if (!/order|column|schema cache|does not exist/i.test(String(error.message))) {
      loadErr = error.message;
      break;
    }
  }

  if (loadErr && allRows.length === 0) {
    const { data, error } = await supabase.from(TABLE).select("*").eq(userColumn, userId).limit(200);
    if (error) {
      return {
        error: error.message,
        probe: `notifications · ${userColumn}`,
        userColumn,
        readColumn: readCol,
        typeColumn: typeCol,
        orderColumn: null,
        rows: [],
        unreadUsedMemoryFilter: false,
        unreadFilterBlocked: false,
      };
    }
    allRows = (data as Row[]) ?? [];
  } else if (loadErr) {
    return {
      error: loadErr,
      probe: `notifications · ${userColumn}`,
      userColumn,
      readColumn: readCol,
      typeColumn: typeCol,
      orderColumn: orderColUsed,
      rows: [],
      unreadUsedMemoryFilter: false,
      unreadFilterBlocked: false,
    };
  }

  if (options.filter === "unread" && !readCol) {
    return {
      error: null,
      probe: `notifications · ${userColumn} · 읽지 않음 필터: read/is_read 컬럼 없음`,
      userColumn,
      readColumn: null,
      typeColumn: typeCol,
      orderColumn: orderColUsed,
      rows: [],
      unreadUsedMemoryFilter: false,
      unreadFilterBlocked: true,
    };
  }

  let unreadMem = false;
  let out = allRows;
  if (options.filter === "unread" && readCol) {
    out = allRows.filter((r) => !isNotificationReadRow(r, readCol));
    unreadMem = true;
  }

  return {
    error: null,
    probe: `notifications · ${userColumn} · order ${orderColUsed ?? "—"}`,
    userColumn,
    readColumn: readCol,
    typeColumn: typeCol,
    orderColumn: orderColUsed,
    rows: out,
    unreadUsedMemoryFilter: unreadMem,
    unreadFilterBlocked: false,
  };
}
