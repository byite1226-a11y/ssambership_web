/**
 * 맞춤의뢰 주문 상태 — 레포 내 출처만 명시 (Supabase migration / generated types 없음).
 *
 * DB에서 실제 enum/문자열을 확인할 때 (Supabase SQL Editor 예시):
 *   select distinct status, state, order_status from public.custom_request_orders;
 *
 * | 구간 | 값 | 출처 |
 * |------|-----|------|
 * | 주문 생성 직후 primary (`status`→`state`→…) | `pending` | `insertCustomRequestOrder` p1 `status`/`state` |
 * | 동일 insert의 `order_status` | `open` | `insertCustomRequestOrder` p1 |
 * | 동일 insert의 `payment_status` | `unpaid` | `insertCustomRequestOrder` p1 (primary 상태 키 후보 아님) |
 * | 멘토 작업 시작 후 primary 목표 | `open` | 주문 insert에 이미 쓰인 리터럴(`order_status`)과 동일 문자열 |
 * | 학생 납품 수락 후 primary | `completed` | `orderStudentActions` |
 * | 스레드 휴리스틱 종료류 | `done`, `resolved` 등 | `lib/home/threadStats.ts` (주문 row에 동일 문자열이 올 수 있으면 terminal 취급) |
 *
 * 납품·검토 대기 등은 insert에 없어 **legacy 집합**으로만 허용한다.
 */

const STATUS_KEYS = ["status", "state", "order_status", "stage"] as const;
export type OrderStatusColumnKey = (typeof STATUS_KEYS)[number];

/** `insertCustomRequestOrder` p1 — `customRequestMutations.ts` */
export const ORDER_INSERT_STATUS_PENDING = "pending" as const;
/** `insertCustomRequestOrder` p1 — `order_status` 컬럼 */
export const ORDER_INSERT_ORDER_STATUS_OPEN = "open" as const;
/** `insertCustomRequestOrder` p1 — `payment_status` (primary 상태 컬럼 후보 아님) */
export const ORDER_INSERT_PAYMENT_STATUS_UNPAID = "unpaid" as const;

/**
 * 멘토 작업 시작 시 primary 컬럼에 넣는 값(현재 `open`).
 * `insertCustomRequestOrder` 는 `status`/`state`=`pending` 과 동시에 `order_status`=`open` 를 넣으므로,
 * `open` 이 “멘토 착수”인지 “접수/오픈 주문”인지는 DB CHECK/enum·DDL 이 레포에 있을 때만 확정할 수 있음
 * (→ `orderSchemaGate` + `002_custom_request_orders_status.sql` 선행).
 */
export const ORDER_MENTOR_WORK_STARTED_PRIMARY_STATUS = ORDER_INSERT_ORDER_STATUS_OPEN;

/** `status`→`state`→`order_status`→`stage` 순으로 비어 있지 않은 첫 컬럼(표시·검증·갱신에 동일 사용). */
export function primaryOrderStatusColumnKey(row: Record<string, unknown>): OrderStatusColumnKey | null {
  for (const k of STATUS_KEYS) {
    const v = row[k];
    if (typeof v === "string" && v.trim()) {
      return k;
    }
  }
  return null;
}

export function normalizedPrimaryOrderStatus(row: Record<string, unknown>): string {
  const k = primaryOrderStatusColumnKey(row);
  if (!k) {
    return "";
  }
  return String(row[k]).trim().toLowerCase();
}

/** 멘토 「작업 시작」직전 — insert 직후 primary만 허용 */
export const ORDER_STATUSES_MENTOR_START_WORK_ALLOWED = new Set<string>([ORDER_INSERT_STATUS_PENDING]);

/**
 * 학생 납품 수락 직전 — `insertCustomRequestOrder`에는 납품 후 상태가 없음.
 * 운영 DB·이전 스텁에서만 쓰이던 값은 legacy로 유지한다.
 */
export const ORDER_STATUSES_ALLOWING_STUDENT_ACCEPT_LEGACY = new Set<string>([
  "delivered",
  "delivered_pending_review",
  "waiting_review",
  "pending_review",
  "redelivered",
  "delivery_submitted",
  "in_review",
]);

export function isOrderStatusAllowingStudentAccept(norm: string): boolean {
  return ORDER_STATUSES_ALLOWING_STUDENT_ACCEPT_LEGACY.has(norm);
}

/** 종료·취소 등 — `orderStudentActions` + 흔한 취소류 + `threadStats` 종료 패턴 일부 */
export const ORDER_TERMINAL_STATUSES = new Set<string>([
  "completed",
  "accepted",
  "closed",
  "finished",
  "cancelled",
  "canceled",
  "refunded",
  "rejected",
  "done",
  "resolved",
]);

export function isOrderStatusTerminal(norm: string): boolean {
  return ORDER_TERMINAL_STATUSES.has(norm);
}

const ORDER_STATE_COLUMN_KEYS = ["status", "state", "order_status", "stage"] as const;

/**
 * `status` / `state` / `order_status` / `stage` 중 하나라도 종료값이면 true.
 * primary 컬럼만 보면 놓칠 수 있는 불일치(예: 한 컬럼만 completed)에 대비한다.
 */
export function isOrderRowTerminalForActions(row: Record<string, unknown> | null | undefined): boolean {
  if (!row) {
    return false;
  }
  for (const k of ORDER_STATE_COLUMN_KEYS) {
    const v = row[k];
    if (typeof v === "string" && v.trim()) {
      if (isOrderStatusTerminal(v.trim().toLowerCase())) {
        return true;
      }
    }
  }
  return false;
}

/** 주문방: 종료 주문에서 진행 버튼 대신 표시하는 단일 안내 */
export const ORDER_ROOM_TERMINAL_ACTIONS_NOTICE =
  "완료된 주문입니다. 추가 변경이 필요하면 고객센터로 문의해 주세요.";

// —— 주문방 UI: DB 토큰·ISO를 사용자 문구로만 변환(로직 판정에는 사용하지 않음)

/** `custom_request_orders`·납품 등에서 읽은 상태 문자열 */
export function orderStatusLabelForUi(raw: string): string {
  const s = String(raw).trim().toLowerCase();
  if (!s || s === "—") {
    return "—";
  }
  const map: Record<string, string> = {
    pending: "진행 대기",
    open: "진행 중",
    in_progress: "작업 중",
    completed: "주문 완료",
    delivered: "납품 완료",
    submitted: "제출됨",
    closed: "종료",
    cancelled: "취소됨",
    canceled: "취소됨",
    unpaid: "미결제",
    paid: "결제 완료",
    in_review: "검토 중",
    waiting_review: "검토 대기",
    delivered_pending_review: "납품 검토 중",
    pending_review: "검토 대기",
    redelivered: "재납품",
    delivery_submitted: "납품 제출됨",
    accepted: "수락 완료",
    revision_requested: "수정 요청됨",
    disputed: "분쟁 접수됨",
    refunded: "환불됨",
  };
  return map[s] ?? String(raw).trim();
}

/** `payment_status` 등 — 주문 요약 표시용 */
export function paymentStatusLabelForUi(raw: string): string {
  const s = String(raw).trim().toLowerCase();
  if (!s || s === "—") {
    return "—";
  }
  const map: Record<string, string> = {
    unpaid: "결제 확인 대기",
    pending: "결제 확인 대기",
    paid: "결제 완료",
    completed: "결제 완료",
    failed: "결제 실패",
    refunded: "환불됨",
    partial_refund: "부분 환불",
    cancelled: "결제 취소",
    canceled: "결제 취소",
  };
  return map[s] ?? String(raw).trim();
}

export function orderEventKindLabelForUi(raw: string): string {
  const s = String(raw).trim().toLowerCase();
  if (!s) {
    return "기록";
  }
  if (/^[0-9a-f-]{36}$/i.test(s)) {
    return "기록";
  }
  const map: Record<string, string> = {
    order_started: "작업 시작",
    deliverable_submitted: "납품 등록",
    deliverable_accepted: "납품 수락",
    settlement_item_created: "정산 항목 생성",
    message_created: "메시지 작성",
    revision_requested: "수정 요청",
    dispute_opened: "분쟁 접수",
  };
  return map[s] ?? orderStatusLabelForUi(s);
}

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

/** 날짜만: 2026.05.02 */
export function formatOrderRoomDate(v: unknown): string {
  if (v == null) {
    return "—";
  }
  if (v instanceof Date) {
    if (Number.isNaN(v.getTime())) {
      return "—";
    }
    return `${v.getFullYear()}.${pad2(v.getMonth() + 1)}.${pad2(v.getDate())}`;
  }
  if (typeof v === "string" && v.trim()) {
    const d = new Date(v.trim());
    if (!Number.isNaN(d.getTime())) {
      return `${d.getFullYear()}.${pad2(d.getMonth() + 1)}.${pad2(d.getDate())}`;
    }
  }
  return "—";
}

/** 2026.04.29 16:06 */
export function formatOrderRoomDateTime(v: unknown): string {
  if (v == null) {
    return "—";
  }
  const d =
    v instanceof Date
      ? v
      : typeof v === "string" && v.trim()
        ? new Date(v.trim())
        : null;
  if (!d || Number.isNaN(d.getTime())) {
    return "—";
  }
  return `${d.getFullYear()}.${pad2(d.getMonth() + 1)}.${pad2(d.getDate())} ${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

export function deliverableVersionLabelKorean(version: unknown, zeroBasedIndex: number): string {
  const n = typeof version === "number" && Number.isFinite(version) ? version : Number.parseInt(String(version ?? ""), 10);
  const step = Number.isFinite(n) && n > 0 ? n : zeroBasedIndex + 1;
  return `${step}차 납품`;
}
