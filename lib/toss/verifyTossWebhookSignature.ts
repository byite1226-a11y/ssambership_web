import "server-only";

import crypto from "crypto";

function normalizeSignatureCandidates(signatureHeader: string): string[] {
  return signatureHeader
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => (part.startsWith("v1:") ? part.slice(3) : part));
}

function timingSafeEqualBuffer(a: Buffer, b: Buffer): boolean {
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

function matchesCandidate(expected: Buffer, candidate: string): boolean {
  try {
    if (timingSafeEqualBuffer(expected, Buffer.from(candidate, "base64"))) return true;
  } catch {
    /* ignore */
  }
  try {
    if (timingSafeEqualBuffer(expected, Buffer.from(candidate, "hex"))) return true;
  } catch {
    /* ignore */
  }
  return false;
}

/**
 * Toss webhook 서명 검증.
 * - `TOSS_WEBHOOK_SECRET` 으로 HMAC-SHA256(rawBody) 계산
 * - 헤더: Toss-Signature / X-Toss-Signature (쉼표·v1: 접두 허용)
 */
export function verifyTossWebhookSignature(
  rawBody: string | Buffer,
  signatureHeader: string | null | undefined
): boolean {
  const secret = process.env.TOSS_WEBHOOK_SECRET?.trim();
  if (!secret || !signatureHeader?.trim()) {
    return false;
  }

  const expected = crypto.createHmac("sha256", secret).update(rawBody).digest();
  const candidates = normalizeSignatureCandidates(signatureHeader);
  if (candidates.length === 0) {
    return matchesCandidate(expected, signatureHeader.trim());
  }

  return candidates.some((candidate) => matchesCandidate(expected, candidate));
}

export function readTossWebhookSignatureHeader(headers: Headers): string | null {
  return (
    headers.get("Toss-Signature") ??
    headers.get("X-Toss-Signature") ??
    headers.get("toss-signature") ??
    headers.get("tosspayments-webhook-signature")
  );
}
