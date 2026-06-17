import type { SubscribePlanTier } from "@/lib/subscribe/subscribePageQueries";

export const SUBSCRIPTIONS_TABLE = "subscriptions" as const;

export const SUBSCRIPTIONS_BASE_COLUMNS = [
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

export const SUBSCRIPTIONS_BILLING_COLUMNS = [
  "started_at",
  "current_period_start",
  "current_period_end",
  "next_billing_at",
  "billing_cycle",
  "cancel_at_period_end",
  "cancel_requested_at",
  "canceled_at",
  "expired_at",
  "last_renewed_at",
  "last_billing_event_id",
  "last_payment_id",
  "grace_until",
] as const;

export const SUBSCRIPTIONS_COLUMNS = [
  ...SUBSCRIPTIONS_BASE_COLUMNS,
  ...SUBSCRIPTIONS_BILLING_COLUMNS,
] as const;

export const SUBSCRIPTIONS_SELECT = SUBSCRIPTIONS_COLUMNS.join(", ");

/** Sort / display remains created_at-first until period UI is introduced. */
export const SUBSCRIPTIONS_ORDER_COLUMN = "created_at" as const;

export type InitialSubscriptionPeriodFields = {
  started_at: string;
  current_period_start: string;
  current_period_end: string;
  next_billing_at: string;
  billing_cycle: "monthly";
};

function daysInUtcMonth(year: number, monthIndex: number): number {
  return new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
}

export function addMonthsClampedUtc(value: Date, months: number): Date {
  const monthIndex = value.getUTCMonth() + months;
  const targetYear = value.getUTCFullYear() + Math.floor(monthIndex / 12);
  const targetMonth = ((monthIndex % 12) + 12) % 12;
  const targetDay = Math.min(value.getUTCDate(), daysInUtcMonth(targetYear, targetMonth));

  return new Date(
    Date.UTC(
      targetYear,
      targetMonth,
      targetDay,
      value.getUTCHours(),
      value.getUTCMinutes(),
      value.getUTCSeconds(),
      value.getUTCMilliseconds()
    )
  );
}

export function buildInitialSubscriptionPeriodFields(
  value: Date = new Date()
): InitialSubscriptionPeriodFields {
  const startedAt = Number.isNaN(value.getTime()) ? new Date() : value;
  const periodEnd = addMonthsClampedUtc(startedAt, 1);

  return {
    started_at: startedAt.toISOString(),
    current_period_start: startedAt.toISOString(),
    current_period_end: periodEnd.toISOString(),
    next_billing_at: periodEnd.toISOString(),
    billing_cycle: "monthly",
  };
}

export function buildSubscriptionsInsertPayload(args: {
  studentId: string;
  mentorId: string;
  planId: string;
  planTier: SubscribePlanTier;
  paymentId: string;
  status?: string;
  includeBillingPeriod?: boolean;
}): Record<string, unknown> {
  const base: Record<string, unknown> = {
    student_id: args.studentId,
    mentor_id: args.mentorId,
    plan_id: args.planId,
    plan_tier: args.planTier,
    payment_id: args.paymentId,
    status: args.status ?? "active",
  };

  if (args.includeBillingPeriod === false) {
    return base;
  }

  return {
    ...base,
    ...buildInitialSubscriptionPeriodFields(),
    last_payment_id: args.paymentId,
  };
}
