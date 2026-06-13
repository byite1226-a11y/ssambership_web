/**
 * 질문방 UI용 날짜·시간 — SSR/CSR 동일 문자열만 출력 (Intl 12시간대의 AM/오전 불일치 회피).
 * Asia/Seoul 벽시계를 formatToParts(24h)로 받은 뒤, 오전/오후·표기 숫자는 코드로만 조합한다.
 */

const SEOUL_PARTS = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Seoul",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

/** 예: `2026. 4. 27. 오전 1:45` — Node·브라우저 동일 */
export function formatQuestionRoomDateTime(iso: unknown): string | null {
  if (typeof iso !== "string") return null;
  const ms = Date.parse(iso);
  if (Number.isNaN(ms)) return null;
  try {
    const parts = SEOUL_PARTS.formatToParts(new Date(ms));
    const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === type)?.value;
    const y = get("year");
    const mo = get("month");
    const d = get("day");
    const hStr = get("hour");
    const minStr = get("minute");
    if (!y || !mo || !d || hStr == null || minStr == null) return null;
    const h = Number.parseInt(hStr, 10);
    if (!Number.isFinite(h)) return null;
    const min = Number.parseInt(minStr, 10);
    const minute = Number.isFinite(min) ? pad2(min) : String(minStr).padStart(2, "0");
    const isAm = h < 12;
    const ap = isAm ? "오전" : "오후";
    let h12 = h % 12;
    if (h12 === 0) h12 = 12;
    return `${y}. ${Number(mo)}. ${Number(d)}. ${ap} ${h12}:${minute}`;
  } catch {
    return null;
  }
}

/** 상대 시간 — N분 전, N시간 전, N일 전 */
export function formatMinutesAgo(iso: unknown): string {
  if (typeof iso !== "string") return "—";
  const ms = Date.parse(iso);
  if (Number.isNaN(ms)) return "—";
  const diff = Date.now() - ms;
  if (diff < 0) return "방금";
  const min = Math.floor(diff / 60_000);
  if (min < 1) return "방금";
  if (min < 60) return `${min}분 전`;
  const hours = Math.floor(min / 60);
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}일 전`;
  return formatQuestionRoomDateTime(iso) ?? "—";
}

export function normalizeRoomHrefBase(base: string): string {
  return base.trim().replace(/\/$/, "");
}

export function roomDetailPath(roomHrefBase: string, roomId: string): string {
  return `${normalizeRoomHrefBase(roomHrefBase)}/${encodeURIComponent(roomId)}`;
}

export function threadInRoomPath(roomHrefBase: string, roomId: string, threadId: string): string {
  return threadDetailPath(roomHrefBase, roomId, threadId);
}

export function threadDetailPath(roomHrefBase: string, roomId: string, threadId: string): string {
  return `${roomDetailPath(roomHrefBase, roomId)}/thread/${encodeURIComponent(threadId)}`;
}
