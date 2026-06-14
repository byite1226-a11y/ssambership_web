import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { insertNotificationBestEffort } from "@/lib/notifications/notificationInsert";
import { fetchPlansForMentor } from "@/lib/mentor/publicMentorBundle";
import { mentorPlanDebitAmountCents } from "@/lib/subscribe/mentorPlanPricing";
import { assignPlansByTier, isSubscribePlanTier, type SubscribePlanTier } from "@/lib/subscribe/subscribePageQueries";
import { SUBSCRIPTIONS_SELECT, SUBSCRIPTIONS_TABLE } from "@/lib/subscribe/subscriptionsTable";

type Row = Record<string, unknown>;

const RENEWABLE_STATUSES = ["active", "past_due"] as const;
const DEFAULT_BATCH_LIMIT = 50;
const MAX_BATCH_LIMIT = 100;

type RpcRenewalResult = {
  ok: boolean;
  code: string;
  message: string | null;
  billing_event_id: string | null;
  ledger_id: string | null;
  next_period_start: string | null;
  next_period_end: string | null;
  wallet_balance_cents: number | null;
  attempt_count: number | null;
};

export type SubscriptionRenewalBatchSummary = {
  at: string;
  scanned: number;
  renewed: number;
  alreadyProcessed: number;
  insufficientCash: number;
  canceled: number;
  expired: number;
  skipped: number;
  errors: Array<{ subscriptionId: string | null; code: string; message: string }>;
};

function isoFromUnknown(value: unknown): string | null {
  if (typeof value !== "string" || !value.trim()) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

function boolFromUnknown(value: unknown): boolean {
  return value === true || value === "true" || value === 1 || value === "1";
}

function normalizeStatus(value: unknown): string {
  return String(value ?? "").trim().toLowerCase();
}

function periodKeyFromRow(row: Row): string {
  return (
    isoFromUnknown(row.current_period_end) ??
    isoFromUnknown(row.next_billing_at) ??
    isoFromUnknown(row.updated_at) ??
    new Date().toISOString()
  ).slice(0, 10);
}

function batchLimitFromEnv(): number {
  const raw = Number.parseInt(process.env.SUBSCRIPTION_RENEWAL_BATCH_LIMIT ?? "", 10);
  if (!Number.isFinite(raw) || raw <= 0) return DEFAULT_BATCH_LIMIT;
  return Math.min(raw, MAX_BATCH_LIMIT);
}

function getSubscriptionId(row: Row): string | null {
  return typeof row.id === "string" && row.id.trim() ? row.id : null;
}

function getUserId(row: Row, key: "student_id" | "mentor_id"): string | null {
  const value = row[key];
  return typeof value === "string" && value.trim() ? value : null;
}

function getTier(row: Row): SubscribePlanTier | null {
  return isSubscribePlanTier(row.plan_tier) ? row.plan_tier : null;
}

async function upsertTerminalBillingEvent(
  supabase: SupabaseClient,
  args: {
    row: Row;
    eventType: "canceled" | "expired";
    idempotencyKey: string;
    atIso: string;
  }
): Promise<string | null> {
  const subscriptionId = getSubscriptionId(args.row);
  const studentId = getUserId(args.row, "student_id");
  const mentorId = getUserId(args.row, "mentor_id");
  if (!subscriptionId || !studentId || !mentorId) return null;

  const payload: Row = {
    subscription_id: subscriptionId,
    student_id: studentId,
    mentor_id: mentorId,
    event_type: args.eventType,
    status: "succeeded",
    period_start: isoFromUnknown(args.row.current_period_start),
    period_end: isoFromUnknown(args.row.current_period_end),
    billing_at: args.atIso,
    amount_cents: null,
    plan_tier: typeof args.row.plan_tier === "string" ? args.row.plan_tier : null,
    plan_id: typeof args.row.plan_id === "string" ? args.row.plan_id : null,
    idempotency_key: args.idempotencyKey,
    created_at: args.atIso,
    processed_at: args.atIso,
  };

  const { data, error } = await supabase
    .from("subscription_billing_events")
    .upsert(payload, { onConflict: "idempotency_key" })
    .select("id")
    .maybeSingle();

  if (error) {
    console.error("[subscriptionRenewal] terminal event upsert failed", {
      subscriptionId,
      eventType: args.eventType,
      error: error.message,
    });
    return null;
  }

  const id = (data as Row | null)?.id;
  return typeof id === "string" ? id : null;
}

async function markCanceledAtPeriodEnd(
  supabase: SupabaseClient,
  row: Row,
  atIso: string
): Promise<boolean> {
  const subscriptionId = getSubscriptionId(row);
  if (!subscriptionId) return false;
  const eventId = await upsertTerminalBillingEvent(supabase, {
    row,
    eventType: "canceled",
    idempotencyKey: `sub_cancel:${subscriptionId}:${periodKeyFromRow(row)}`,
    atIso,
  });

  const patch: Row = {
    status: "canceled",
    canceled_at: atIso,
    expired_at: atIso,
    next_billing_at: null,
    updated_at: atIso,
  };
  if (eventId) patch.last_billing_event_id = eventId;

  const { error } = await supabase.from(SUBSCRIPTIONS_TABLE).update(patch).eq("id", subscriptionId);
  if (error) {
    console.error("[subscriptionRenewal] cancel transition failed", { subscriptionId, error: error.message });
    return false;
  }

  const studentId = getUserId(row, "student_id");
  if (studentId) {
    await insertNotificationBestEffort({
      recipientUserId: studentId,
      type: "subscription_cancelled_at_period_end",
      title: "구독이 기간 종료로 해지됐어요",
      body: "요청한 구독 해지가 현재 이용 기간 종료와 함께 반영됐어요.",
      link: "/subscriptions",
      metadata: { subscriptionId },
    });
  }
  return true;
}

async function markExpired(
  supabase: SupabaseClient,
  row: Row,
  atIso: string
): Promise<boolean> {
  const subscriptionId = getSubscriptionId(row);
  if (!subscriptionId) return false;
  const eventId = await upsertTerminalBillingEvent(supabase, {
    row,
    eventType: "expired",
    idempotencyKey: `sub_expired:${subscriptionId}:${periodKeyFromRow(row)}`,
    atIso,
  });

  const patch: Row = {
    status: "expired",
    expired_at: atIso,
    next_billing_at: null,
    updated_at: atIso,
  };
  if (eventId) patch.last_billing_event_id = eventId;

  const { error } = await supabase.from(SUBSCRIPTIONS_TABLE).update(patch).eq("id", subscriptionId);
  if (error) {
    console.error("[subscriptionRenewal] expire transition failed", { subscriptionId, error: error.message });
    return false;
  }

  const studentId = getUserId(row, "student_id");
  if (studentId) {
    await insertNotificationBestEffort({
      recipientUserId: studentId,
      type: "subscription_expired_insufficient_cash",
      title: "구독이 만료됐어요",
      body: "갱신일 이후 유예 기간 동안 캐시 결제가 완료되지 않아 구독이 만료됐어요.",
      link: "/subscriptions",
      metadata: { subscriptionId },
    });
  }
  return true;
}

async function resolveRenewalAmountCents(
  supabase: SupabaseClient,
  row: Row
): Promise<{ ok: true; amountCents: number } | { ok: false; error: string }> {
  const tier = getTier(row);
  const mentorId = getUserId(row, "mentor_id");
  if (!tier) return { ok: false, error: "invalid_plan_tier" };
  if (!mentorId) return { ok: false, error: "missing_mentor_id" };

  const plans = await fetchPlansForMentor(supabase, mentorId);
  if (plans.error) {
    console.warn("[subscriptionRenewal] plan fetch failed; using tier fallback if possible", {
      mentorId,
      tier,
      error: plans.error,
    });
  }
  const { byTier } = assignPlansByTier(plans.rows);
  const amountCents = mentorPlanDebitAmountCents(byTier[tier], tier);
  if (!Number.isFinite(amountCents) || amountCents <= 0) {
    return { ok: false, error: "invalid_amount" };
  }
  return { ok: true, amountCents };
}

async function notifyRenewalSuccess(row: Row, result: RpcRenewalResult): Promise<void> {
  const studentId = getUserId(row, "student_id");
  const subscriptionId = getSubscriptionId(row);
  if (!studentId || !subscriptionId) return;

  await insertNotificationBestEffort({
    recipientUserId: studentId,
    type: "subscription_renewal_succeeded",
    title: "구독이 갱신됐어요",
    body: "이번 달 구독 캐시 결제가 완료되어 질문방 이용 기간이 연장됐어요.",
    link: "/subscriptions",
    metadata: {
      subscriptionId,
      billingEventId: result.billing_event_id,
      ledgerId: result.ledger_id,
      nextPeriodEnd: result.next_period_end,
    },
  });
}

async function notifyRenewalFailure(row: Row, result: RpcRenewalResult): Promise<void> {
  const studentId = getUserId(row, "student_id");
  const subscriptionId = getSubscriptionId(row);
  if (!studentId || !subscriptionId) return;

  await insertNotificationBestEffort({
    recipientUserId: studentId,
    type: "subscription_renewal_failed_insufficient_cash",
    title: "구독 갱신에 필요한 캐시가 부족해요",
    body: "캐시 잔액 부족으로 구독 갱신이 보류됐어요. 유예 기간 안에 충전하면 다음 갱신 배치에서 다시 시도됩니다.",
    link: "/wallet/charge",
    metadata: {
      subscriptionId,
      billingEventId: result.billing_event_id,
      attemptCount: result.attempt_count,
    },
  });
}

async function processRenewal(
  supabase: SupabaseClient,
  row: Row,
  atIso: string
): Promise<{ code: "renewed" | "already" | "insufficient" | "skipped" | "error"; message?: string }> {
  const subscriptionId = getSubscriptionId(row);
  if (!subscriptionId) return { code: "skipped", message: "missing_subscription_id" };

  const price = await resolveRenewalAmountCents(supabase, row);
  if (!price.ok) return { code: "skipped", message: price.error };

  const periodEnd = isoFromUnknown(row.current_period_end) ?? isoFromUnknown(row.next_billing_at) ?? atIso;
  const idempotencyKey = `sub_renewal:${subscriptionId}:${periodEnd.slice(0, 10)}`;

  const { data, error } = await supabase.rpc("process_subscription_renewal", {
    p_subscription_id: subscriptionId,
    p_period_end: periodEnd,
    p_amount_cents: price.amountCents,
    p_idempotency_key: idempotencyKey,
    p_processed_at: atIso,
  });

  if (error) {
    console.error("[subscriptionRenewal] renewal rpc failed", { subscriptionId, error: error.message });
    return { code: "error", message: error.message };
  }

  const result = (((data as RpcRenewalResult[] | null) ?? [])[0] ?? null) as RpcRenewalResult | null;
  if (!result) return { code: "error", message: "empty_rpc_result" };

  if (result.ok && result.code === "succeeded") {
    await notifyRenewalSuccess(row, result);
    return { code: "renewed" };
  }
  if (result.ok && result.code === "already_succeeded") {
    return { code: "already" };
  }
  if (!result.ok && result.code === "insufficient_cash") {
    if ((result.attempt_count ?? 0) <= 1) {
      await notifyRenewalFailure(row, result);
    }
    return { code: "insufficient" };
  }
  return { code: "skipped", message: `${result.code}: ${result.message ?? ""}`.trim() };
}

export async function runSubscriptionRenewalBatch(
  supabase: SupabaseClient,
  at: Date
): Promise<SubscriptionRenewalBatchSummary> {
  const atIso = at.toISOString();
  const summary: SubscriptionRenewalBatchSummary = {
    at: atIso,
    scanned: 0,
    renewed: 0,
    alreadyProcessed: 0,
    insufficientCash: 0,
    canceled: 0,
    expired: 0,
    skipped: 0,
    errors: [],
  };

  const { data, error } = await supabase
    .from(SUBSCRIPTIONS_TABLE)
    .select(SUBSCRIPTIONS_SELECT)
    .lte("next_billing_at", atIso)
    .in("status", RENEWABLE_STATUSES)
    .order("next_billing_at", { ascending: true })
    .limit(batchLimitFromEnv());

  if (error) {
    summary.errors.push({ subscriptionId: null, code: "query_failed", message: error.message });
    return summary;
  }

  const rows = ((data as unknown as Row[] | null) ?? []) as Row[];
  summary.scanned = rows.length;

  for (const row of rows) {
    const subscriptionId = getSubscriptionId(row);
    const status = normalizeStatus(row.status);
    const graceUntil = isoFromUnknown(row.grace_until);

    if (boolFromUnknown(row.cancel_at_period_end)) {
      if (await markCanceledAtPeriodEnd(supabase, row, atIso)) summary.canceled += 1;
      else {
        summary.skipped += 1;
        summary.errors.push({ subscriptionId, code: "cancel_failed", message: "cancel transition failed" });
      }
      continue;
    }

    if (status === "past_due" && graceUntil && new Date(graceUntil).getTime() <= at.getTime()) {
      if (await markExpired(supabase, row, atIso)) summary.expired += 1;
      else {
        summary.skipped += 1;
        summary.errors.push({ subscriptionId, code: "expire_failed", message: "expire transition failed" });
      }
      continue;
    }

    const result = await processRenewal(supabase, row, atIso);
    if (result.code === "renewed") summary.renewed += 1;
    else if (result.code === "already") summary.alreadyProcessed += 1;
    else if (result.code === "insufficient") summary.insufficientCash += 1;
    else if (result.code === "error") {
      summary.skipped += 1;
      summary.errors.push({
        subscriptionId,
        code: "renewal_rpc_failed",
        message: result.message ?? "renewal failed",
      });
    } else {
      summary.skipped += 1;
      if (result.message) {
        summary.errors.push({ subscriptionId, code: "skipped", message: result.message });
      }
    }
  }

  return summary;
}
