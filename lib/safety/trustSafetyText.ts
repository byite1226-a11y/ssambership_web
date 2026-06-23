import { maskContactInText } from "@/lib/customRequest/contactMasking";

// [정책 변경] 금지어 차단 폐지. 어떤 문구도 차단하지 않고, 명백한 연락처만 마스킹한다.
export const TRUST_SAFETY_RESTRICTED_TEXT_MESSAGE = "외부 연락처는 자동으로 가려집니다.";
export const TRUST_SAFETY_COMMUNITY_ERROR_CODE = "policy";

export type TrustSafetyTextResult =
  | { ok: true; text: string }
  | { ok: false; error: string; bannedPhrase: string };

/**
 * [폐지됨] 과거 금지어 검사. 차단 정책을 없앴으므로 항상 null(걸리는 문구 없음)을 반환한다.
 * 호출부의 차단 분기는 더 이상 발동하지 않으며, 시그니처는 빌드 호환을 위해 유지한다.
 */
export function findRestrictedPhraseInText(..._values: string[]): string | null {
  return null;
}

export function maskContactInUserText(value: string): string {
  return maskContactInText(value);
}

/**
 * 금지어 차단 없이 항상 통과(ok:true)시키고, 명백한 외부 연락처만 마스킹해서 돌려준다.
 */
export function sanitizeTrustSafetyText(value: string): TrustSafetyTextResult {
  return { ok: true, text: maskContactInUserText(value) };
}
