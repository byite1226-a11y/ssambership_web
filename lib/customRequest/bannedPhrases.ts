/** \uB300\uD544/\uB300\uC2E0 \uC791\uC131 \uB4F1 \uAE08\uC9C0 \uD45C\uD604 */
export const CUSTOM_REQUEST_BANNED_PHRASES = [
  "\uB300\uD544",
  "\uB300\uC2E0 \uC4F0\uC918",
  "\uB300\uC2E0 \uC791\uC131",
  "\uBCF5\uBD99",
  "\uBCF5\uC0AC \uBD99\uC5EC\uB123\uAE30",
  "\uADF8\uB300\uB85C \uC4F0\uC918",
  "\uC81C\uCD9C\uC6A9",
] as const;

export function findBannedPhrase(text: string): string | null {
  const low = text.toLowerCase();
  for (const phrase of CUSTOM_REQUEST_BANNED_PHRASES) {
    if (low.includes(phrase.toLowerCase())) return phrase;
  }
  return null;
}
