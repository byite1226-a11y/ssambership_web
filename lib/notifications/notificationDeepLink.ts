import { safeInternalNextPath } from "@/lib/auth/getPostLoginPath";
import { getStringField } from "@/lib/qna/safeSelect";
import type { AppRole } from "@/lib/types/user";

type Row = Record<string, unknown>;

const URL_KEYS = ["target_url", "link", "action_url", "href", "deep_link", "url", "path"] as const;

/**
 * row에 내부 상대 경로만 허용. http(s)·// 등 외부 URL은 무시(휴리스틱으로 이어짐).
 */
function explicitInternalPathFromRow(row: Row): string | null {
  for (const k of URL_KEYS) {
    const v = row[k];
    if (typeof v !== "string") continue;
    const t = v.trim();
    if (!t) continue;
    if (t.startsWith("http://") || t.startsWith("https://") || t.startsWith("//")) {
      continue;
    }
    if (t.startsWith("/")) {
      const safe = safeInternalNextPath(t);
      if (safe) {
        return safe;
      }
    }
  }
  return null;
}

function pickId(row: Row, keys: string[]): string | null {
  for (const k of keys) {
    const v = row[k];
    if (typeof v === "string" && v.length > 4) return v;
  }
  return null;
}

/**
 * 알림 한 줄 + 역할 → 이동할 경로(placeholder 가능)
 */
export function resolveNotificationHref(row: Row, role: AppRole, typeHint: string | null): string {
  const direct = explicitInternalPathFromRow(row);
  if (direct) return direct;

  const t = [
    typeHint ?? "",
    getStringField(row, [
      "type",
      "kind",
      "category",
      "event_type",
      "title",
      "message",
      "body",
    ]) ?? "",
    getStringField(row, ["payload", "data", "meta"]) ?? "",
  ]
    .join(" ")
    .toLowerCase();

  const orderId = pickId(row, ["order_id", "custom_order_id", "request_order_id", "entity_id"]);
  if (orderId && /order|request|custom/.test(t)) {
    return `/custom-request/orders/${orderId}`;
  }

  const roomForQna = pickId(row, [
    "room_id",
    "roomId",
    "question_room_id",
    "questionRoomId",
    "qna_room_id",
    "qnaRoomId",
  ]);
  if (
    roomForQna &&
    /(thread|qna|question|answer|room|채팅|답변|질문)/.test(t) &&
    !/(custom|order|request|의뢰|맞춤)/.test(t)
  ) {
    if (role === "mentor") {
      return `/mentor/question-room/${roomForQna}`;
    }
    if (role === "student") {
      return `/question-room/${roomForQna}`;
    }
    if (role === "admin") {
      return "/admin";
    }
  }

  if (/(thread|qna|question|answer|room|채팅|답변)/.test(t)) {
    if (role === "mentor") {
      return "/mentor/question-room";
    }
    if (role === "admin") {
      return "/admin";
    }
    return "/question-room";
  }
  if (/(subscri|payment|pay|wallet|캐시|결제|구독|영수|환불)/.test(t)) {
    if (role === "mentor") {
      return "/mentor/payouts";
    }
    if (role === "admin") {
      return "/admin/refunds";
    }
    return "/wallet/charge";
  }
  if (/(subscribe|플랜)/.test(t) && role === "student") {
    return "/mentors";
  }
  if (/(custom|request|의뢰|맞춤)/.test(t)) {
    if (orderId) return `/custom-request/orders/${orderId}`;
    return "/custom-request";
  }
  if (/(notice|공지|promo|프로모|announce|이벤트|site)/.test(t)) {
    return "/";
  }
  if (/(dispute|분쟁|report|신고|신고|review)/.test(t)) {
    const did = pickId(row, ["dispute_id", "disputeId", "report_id", "reportId"]);
    if (role === "admin" && did) {
      return `/admin/disputes/${did}`;
    }
    if (role === "mentor" && did) {
      return `/mentor/support/disputes/${did}`;
    }
    if (role === "student" && did) {
      return `/support/disputes/${did}`;
    }
    if (role === "student") {
      return "/support/disputes";
    }
    if (role === "mentor") {
      return "/mentor/support/disputes";
    }
  }
  if (role === "admin") {
    return "/admin";
  }
  return role === "mentor" ? "/mentor/dashboard" : "/home";
}

/** 유형 키 → 배지 문구(예시) */
export function typeBadgeLabel(typeKey: string | null): { label: string; variant: string } {
  if (!typeKey) return { label: "기타", variant: "slate" };
  const s = typeKey.toLowerCase();
  if (/(qna|question|thread|answer|room|답변|질문)/.test(s)) {
    return { label: "질문방", variant: "emerald" };
  }
  if (/(subscri|payment|pay|wallet|결제|구독|캐시)/.test(s)) {
    return { label: "구독/결제", variant: "blue" };
  }
  if (/(custom|request|order|의뢰|맞춤)/.test(s)) {
    return { label: "맞춤의뢰", variant: "violet" };
  }
  if (/(notice|promo|announce|event|공지|프로모)/.test(s)) {
    return { label: "공지/프로모", variant: "amber" };
  }
  if (/(dispute|report|abuse|분쟁|신고)/.test(s)) {
    return { label: "신고/분쟁", variant: "red" };
  }
  if (s.length > 20) {
    return { label: "알림", variant: "slate" };
  }
  return { label: typeKey, variant: "slate" };
}
