import "server-only";

const DEFAULT_OPEN_EXPIRY_HOURS = 48;
const DEFAULT_CLAIMED_ANSWER_HOURS = 48;
const DEFAULT_DIRECT_EXPIRY_HOURS = 72;
const DEFAULT_BATCH_LIMIT = 100;
const MAX_BATCH_LIMIT = 500;

export type IndividualQuestionExpirableStatus = "open" | "assigned" | "claimed";

function positiveNumberFromEnv(key: string, fallback: number): number {
  const raw = Number.parseFloat(process.env[key] ?? "");
  if (!Number.isFinite(raw) || raw <= 0) return fallback;
  return raw;
}

function positiveIntegerFromEnv(key: string, fallback: number, max: number): number {
  const raw = Number.parseInt(process.env[key] ?? "", 10);
  if (!Number.isFinite(raw) || raw <= 0) return fallback;
  return Math.min(raw, max);
}

export function individualQuestionExpiryHours(status: IndividualQuestionExpirableStatus): number {
  if (status === "open") return positiveNumberFromEnv("IQ_OPEN_EXPIRY_HOURS", DEFAULT_OPEN_EXPIRY_HOURS);
  if (status === "claimed") return positiveNumberFromEnv("IQ_CLAIMED_ANSWER_HOURS", DEFAULT_CLAIMED_ANSWER_HOURS);
  return positiveNumberFromEnv("IQ_DIRECT_EXPIRY_HOURS", DEFAULT_DIRECT_EXPIRY_HOURS);
}

export function individualQuestionExpiryBatchLimit(): number {
  return positiveIntegerFromEnv("IQ_EXPIRY_BATCH_LIMIT", DEFAULT_BATCH_LIMIT, MAX_BATCH_LIMIT);
}

export function individualQuestionExpiryEnabled(): boolean {
  const raw = process.env.INDIVIDUAL_QUESTION_EXPIRY_ENABLED ?? "";
  return raw === "true" || raw === "1";
}

export function addHours(value: Date, hours: number): Date {
  return new Date(value.getTime() + hours * 60 * 60 * 1000);
}

export function expiryDateForStatus(status: IndividualQuestionExpirableStatus, from = new Date()): Date {
  return addHours(from, individualQuestionExpiryHours(status));
}
