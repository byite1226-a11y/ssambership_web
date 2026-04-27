import { getStringField } from "@/lib/qna/safeSelect";

type Row = Record<string, unknown>;

const TIME_KEYS = ["created_at", "inserted_at", "sent_at", "occurred_at", "updated_at"] as const;

export function notificationTitleLine(row: Row): string {
  return (
    getStringField(row, [
      "title",
      "subject",
      "summary",
      "headline",
    ]) ||
    getStringField(row, ["message", "body", "content", "text", "label"]) ||
    "알림(제목 없음)"
  );
}

export function notificationTimeIso(row: Row): string {
  for (const k of TIME_KEYS) {
    const v = row[k];
    if (typeof v === "string" && v.length > 8) return v;
  }
  return "—";
}

export function formatNotificationTime(iso: string): string {
  if (iso === "—") return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso.slice(0, 19);
  return d.toLocaleString("ko-KR", { dateStyle: "short", timeStyle: "short" });
}

export function typeRaw(row: Row, typeColumn: string | null): string | null {
  if (typeColumn) {
    const v = row[typeColumn];
    if (typeof v === "string" && v.trim()) return v;
  }
  return getStringField(row, ["type", "kind", "category", "event_type", "notification_type"]);
}
