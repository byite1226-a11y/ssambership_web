import type { SubscribePlanTier } from "@/lib/subscribe/subscribePageQueries";

/** Production `public.subscriptions` — no `started_at` / `expires_at`. */
export const SUBSCRIPTIONS_TABLE = "subscriptions" as const;

export const SUBSCRIPTIONS_COLUMNS = [
  "id",
  "student_id",
  "mentor_id",
  "payment_id",
  "plan_tier",
  "plan_id",
  "status",
  "created_at",
  "updated_at",
] as const;

export const SUBSCRIPTIONS_SELECT = SUBSCRIPTIONS_COLUMNS.join(", ");

/** Sort / display: use `created_at` only (not legacy `started_at`). */
export const SUBSCRIPTIONS_ORDER_COLUMN = "created_at" as const;

export function buildSubscriptionsInsertPayload(args: {
  studentId: string;
  mentorId: string;
  planId: string;
  planTier: SubscribePlanTier;
  paymentId: string;
  status?: string;
}): Record<string, unknown> {
  return {
    student_id: args.studentId,
    mentor_id: args.mentorId,
    plan_id: args.planId,
    plan_tier: args.planTier,
    payment_id: args.paymentId,
    status: args.status ?? "active",
  };
}
