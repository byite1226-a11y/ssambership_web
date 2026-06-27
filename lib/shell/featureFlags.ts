/**
 * 출시 준비 중 기능의 환경별 노출 토글.
 * 기본 OFF(운영 보호). 로컬·스테이징에서만 .env로 켠다.
 */
export function isCustomRequestFeatureEnabled(): boolean {
  const v = process.env.NEXT_PUBLIC_FEATURE_CUSTOM_REQUEST;
  if (typeof v !== "string") return false;
  const norm = v.trim().toLowerCase();
  return norm === "on" || norm === "1" || norm === "true" || norm === "yes";
}
