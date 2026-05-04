/**
 * 질문방 UI용 날짜·시간 표기 — locale/timeZone 고정으로 SSR/CSR 결과를 맞춘다.
 * (기본 로케일/환경에 따른 AM vs 오전 불일치 방지)
 */

const QUESTION_ROOM_DATETIME = new Intl.DateTimeFormat("ko-KR", {
  timeZone: "Asia/Seoul",
  year: "numeric",
  month: "numeric",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
});

export function formatQuestionRoomDateTime(iso: unknown): string | null {
  if (typeof iso !== "string") return null;
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return null;
  try {
    return QUESTION_ROOM_DATETIME.format(new Date(t));
  } catch {
    return null;
  }
}

export function normalizeRoomHrefBase(base: string): string {
  return base.trim().replace(/\/$/, "");
}

export function roomDetailPath(roomHrefBase: string, roomId: string): string {
  return `${normalizeRoomHrefBase(roomHrefBase)}/${encodeURIComponent(roomId)}`;
}

export function threadInRoomPath(roomHrefBase: string, roomId: string, threadId: string): string {
  const roomPath = roomDetailPath(roomHrefBase, roomId);
  return `${roomPath}?thread=${encodeURIComponent(threadId)}`;
}
