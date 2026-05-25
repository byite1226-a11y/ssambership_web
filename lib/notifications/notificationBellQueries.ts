import type { SupabaseClient } from "@supabase/supabase-js";
import {
  isNotificationReadRow,
  loadNotificationsHub,
} from "@/lib/notifications/notificationsHubQueries";
import {
  notificationTimeIso,
  notificationTitleLine,
  typeRaw,
} from "@/lib/notifications/notificationRowDisplay";
import { resolveNotificationHref } from "@/lib/notifications/notificationDeepLink";
import type { AppRole } from "@/lib/types/user";

type Row = Record<string, unknown>;

export type NotificationBellItem = {
  id: string;
  type: string | null;
  title: string;
  body: string;
  href: string;
  createdAt: string;
  isRead: boolean;
};

export type NotificationBellData = {
  unreadCount: number;
  items: NotificationBellItem[];
};

function bodyLine(row: Row): string {
  for (const k of ["body", "message", "content", "text"] as const) {
    const v = row[k];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return "";
}

/** Realtime INSERT payload 등 클라이언트에서 행 → 드롭다운 항목 변환 */
export function mapNotificationRowToBellItem(row: Row, role: AppRole): NotificationBellItem | null {
  const id = row.id;
  if (id == null || String(id).trim() === "") {
    return null;
  }
  const type = typeRaw(row, null);
  return {
    id: String(id),
    type,
    title: notificationTitleLine(row),
    body: bodyLine(row),
    href: resolveNotificationHref(row, role, type),
    createdAt: notificationTimeIso(row),
    isRead: false,
  };
}

function mapRowToBellItem(row: Row, role: AppRole, readCol: string | null, typeCol: string | null): NotificationBellItem {
  const type = typeRaw(row, typeCol);
  return {
    id: String(row.id ?? ""),
    type,
    title: notificationTitleLine(row),
    body: bodyLine(row),
    href: resolveNotificationHref(row, role, type),
    createdAt: notificationTimeIso(row),
    isRead: readCol ? isNotificationReadRow(row, readCol) : false,
  };
}

export async function loadNotificationBellData(
  supabase: SupabaseClient,
  userId: string,
  role: AppRole
): Promise<NotificationBellData> {
  const hub = await loadNotificationsHub(supabase, userId, { filter: "all" });
  if (hub.error || hub.rows.length === 0) {
    return { unreadCount: 0, items: [] };
  }

  const unreadCount = hub.readColumn
    ? hub.rows.filter((r) => !isNotificationReadRow(r, hub.readColumn)).length
    : 0;

  const items = hub.rows.slice(0, 5).map((r) => mapRowToBellItem(r, role, hub.readColumn, hub.typeColumn));

  return { unreadCount, items };
}
