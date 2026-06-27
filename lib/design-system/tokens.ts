/**
 * Design System v1 — TypeScript token reference (런타임 로직 없음, 문서·타입용).
 * CSS 원본: styles/design-system-tokens.css
 */

/** 간격 스케일 — Tailwind spacing과 1:1 (카드 p-5, 섹션 gap-6 권장) */
export const DS_SPACE = {
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
} as const;

/** 카드·섹션 표준 (Tailwind class) */
export const DS_LAYOUT = {
  cardPadding: "p-5" as const,
  sectionGap: "gap-6" as const,
  cardRadius: "rounded-2xl" as const,
  buttonRadius: "rounded-xl" as const,
} as const;

/** 강조색 — 화면당 primary CTA 1곳 원칙 */
export const DS_ACCENT = {
  student: "#2563EB",
  mentor: "#059669",
} as const;
