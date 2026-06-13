import { CheckCircle2, Clock, MessageSquare } from "lucide-react";
import type { LucideIcon } from "lucide-react";

/**
 * 질문방 스레드 상태 배지 — v4 스펙
 * - 답변 대기: ti-clock 풍 / bg #fbf0e6 / text #b06a14
 * - 진행 중: ti-messages 풍 / bg #e9f0fc / text #2660c4
 * - 답변 완료: ti-circle-check 풍 / bg #e8f5ec / text #27733f
 *
 * 배지가 쓰이는 모든 위치(스레드 카드, 채팅 헤더, 리스트 row 등)에서 동일한
 * 디자인을 보장하기 위해 공통 컴포넌트로 분리.
 */
export type StatusBadgeTone = "pending" | "in_progress" | "complete";

const STYLES: Record<
  StatusBadgeTone,
  { bg: string; fg: string; Icon: LucideIcon; label: string }
> = {
  pending: { bg: "#fbf0e6", fg: "#b06a14", Icon: Clock, label: "답변 대기" },
  in_progress: { bg: "#e9f0fc", fg: "#2660c4", Icon: MessageSquare, label: "진행 중" },
  complete: { bg: "#e8f5ec", fg: "#27733f", Icon: CheckCircle2, label: "답변 완료" },
};

export function StatusBadge({
  tone,
  className = "",
}: {
  tone: StatusBadgeTone;
  className?: string;
}) {
  const cfg = STYLES[tone];
  const Icon = cfg.Icon;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${className}`}
      style={{ backgroundColor: cfg.bg, color: cfg.fg }}
    >
      <Icon className="h-3 w-3" aria-hidden />
      {cfg.label}
    </span>
  );
}

/** 기존 amber/blue/emerald tone → StatusBadge tone 매핑 */
export function legacyToneToStatusBadgeTone(tone: "amber" | "blue" | "emerald"): StatusBadgeTone {
  if (tone === "amber") return "pending";
  if (tone === "blue") return "in_progress";
  return "complete";
}
