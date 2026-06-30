import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  Bell,
  ClipboardList,
  CreditCard,
  Megaphone,
  MessageCircle,
  RotateCcw,
  Star,
  UserMinus,
} from "lucide-react";

export type NotificationTone = "blue" | "slate" | "amber" | "red" | "emerald";

export type NotificationTypeMeta = {
  label: string;
  tone: NotificationTone;
  Icon: LucideIcon;
};

/**
 * 알림 종류 → 라벨·색·아이콘 (House Style 톤).
 * 구독/결제=중립, 질문·맞춤의뢰=파랑, 환불·공지·멘토활동=앰버, 분쟁·신고=레드.
 * 매칭 순서 중요: 환불·분쟁이 구독/질문보다 먼저(본문에 겹치는 단어 대비).
 */
export function notificationTypeMeta(type: string | null): NotificationTypeMeta {
  const t = (type ?? "").toLowerCase();
  if (/(refund|환불)/.test(t)) return { label: "환불", tone: "amber", Icon: RotateCcw };
  if (/(dispute|report|abuse|분쟁|신고)/.test(t)) return { label: "신고·분쟁", tone: "red", Icon: AlertTriangle };
  if (/(termination|abandon|paused|mentor_activity|mentor_leave|멘토.*종료|멘토.*중단)/.test(t)) {
    return { label: "멘토 활동", tone: "amber", Icon: UserMinus };
  }
  if (/(question|answer|thread|qna|room|답변|질문)/.test(t)) {
    return { label: "질문방", tone: "blue", Icon: MessageCircle };
  }
  if (/(review|리뷰)/.test(t)) return { label: "리뷰", tone: "blue", Icon: Star };
  if (/(custom|request|order|application|deliver|delivery|주문|의뢰|지원|납품|맞춤)/.test(t)) {
    return { label: "맞춤의뢰", tone: "blue", Icon: ClipboardList };
  }
  if (/(notice|promo|announce|event|공지|프로모)/.test(t)) {
    return { label: "공지", tone: "amber", Icon: Megaphone };
  }
  if (/(subscri|payment|pay|wallet|cash|billing|renewal|구독|결제|캐시|갱신)/.test(t)) {
    return { label: "구독·결제", tone: "slate", Icon: CreditCard };
  }
  return { label: "알림", tone: "slate", Icon: Bell };
}

/** 아이콘 칩 색 (연한 배경 + 진한 글자) */
export function notificationToneChipClass(tone: NotificationTone): string {
  switch (tone) {
    case "blue":
      return "bg-[#EFF4FF] text-[#1E429F]";
    case "amber":
      return "bg-amber-50 text-amber-700";
    case "red":
      return "bg-red-50 text-red-700";
    case "emerald":
      return "bg-emerald-50 text-emerald-700";
    case "slate":
    default:
      return "bg-slate-100 text-slate-600";
  }
}

/** 배지(라벨) 테두리 톤 */
export function notificationToneBadgeClass(tone: NotificationTone): string {
  switch (tone) {
    case "blue":
      return "border-blue-200 text-[#1E429F]";
    case "amber":
      return "border-amber-200 text-amber-800";
    case "red":
      return "border-red-200 text-red-700";
    case "emerald":
      return "border-emerald-200 text-emerald-800";
    case "slate":
    default:
      return "border-slate-200 text-slate-600";
  }
}

/** 레거시 호환 — 기본 아이콘만 반환 */
export function notificationTypeIcon(type: string | null): LucideIcon {
  return notificationTypeMeta(type).Icon;
}
