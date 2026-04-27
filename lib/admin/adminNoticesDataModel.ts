export const ADMIN_NOTICES_DATA_MODEL = [
  "notices (또는 site_notices) — title, type/kind, target/screen, starts_at/ends_at, is_active",
  "promotions (배너/프로모) — summary/body, slot/placement, 기간, 활성",
  "필드 후보: type | notice_type | kind / target_screen | placement | audience / is_active | status",
  "발행·검수·감사는 audit 연계(이번 턴 비필수)",
] as const;
