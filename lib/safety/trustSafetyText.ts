import { findBannedPhrase } from "@/lib/customRequest/bannedPhrases";
import { maskContactInText } from "@/lib/customRequest/contactMasking";

export const TRUST_SAFETY_RESTRICTED_TEXT_MESSAGE = "외부 연락처·대필 요청은 정책상 제한됩니다.";
export const TRUST_SAFETY_COMMUNITY_ERROR_CODE = "policy";

export type TrustSafetyTextResult =
  | { ok: true; text: string }
  | { ok: false; error: string; bannedPhrase: string };

export function findRestrictedPhraseInText(...values: string[]): string | null {
  return findBannedPhrase(values.join("\n"));
}

export function maskContactInUserText(value: string): string {
  return maskContactInText(value);
}

export function sanitizeTrustSafetyText(value: string): TrustSafetyTextResult {
  const banned = findRestrictedPhraseInText(value);
  if (banned) {
    return { ok: false, error: TRUST_SAFETY_RESTRICTED_TEXT_MESSAGE, bannedPhrase: banned };
  }
  return { ok: true, text: maskContactInUserText(value) };
}