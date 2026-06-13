import { randomUUID } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getMentorUserPublic } from "@/lib/auth/mentorPublicRead";
import { fetchPlansForMentor } from "@/lib/mentor/publicMentorBundle";
import { pickExistingColumn, rowsFromSupabaseData } from "@/lib/qna/safeSelect";
import { assignPlansByTier, type SubscribePlanTier } from "@/lib/subscribe/subscribePageQueries";
import { cashKrwForSubscribeTier, SUBSCRIBE_PLAN_CATALOG } from "@/lib/subscribe/subscribePlanCatalog";
import {
  SUBSCRIPTIONS_ORDER_COLUMN,
  SUBSCRIPTIONS_SELECT,
  SUBSCRIPTIONS_TABLE,
  buildSubscriptionsInsertPayload,
} from "@/lib/subscribe/subscriptionsTable";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { loadMentorCapUsage, wouldExceedCap } from "@/lib/subscribe/mentorCapService";
import { fetchRoomsForUser } from "@/lib/qna/questionRoomQueries";
import { assertMentorApprovedForAction } from "@/lib/mentor/mentorVerificationGate";

type Row = Record<string, unknown>;

const SUB_TABLES = ["subscriptions", "mentor_subscriptions", "user_subscriptions"] as const;
const STU_FK = ["student_id", "user_id", "student_user_id", "subscriber_id"] as const;
const MEN_FK = ["mentor_id", "mentor_user_id", "creator_id", "host_id"] as const;
const PAY_TABLES = ["payments", "payment_intents", "order_payments"] as const;
const ROOM_TABLE = "mentor_student_rooms" as const;

function isRowSubscriptionActive(row: Row): boolean {
  const st = String(
    row.status ?? row.state ?? row.subscription_status ?? ""
  )
    .toLowerCase()
    .trim();
  return st === "active";
}

/**
 * 멘토·학생 쌍에 대해 "활성"으로 보이는 구독이 이미 있으면 해당 행(첫 개)
 */
export async function findActiveSubscriptionForPair(
  supabase: SupabaseClient,
  studentId: string,
  mentorId: string
): Promise<{ table: string; row: Row } | null> {
  for (const table of SUB_TABLES) {
    const { error: pe } = await supabase.from(table).select("id").limit(1);
    if (pe) continue;
    if (table === SUBSCRIPTIONS_TABLE) {
      const { data, error } = await supabase
        .from(SUBSCRIPTIONS_TABLE)
        .select(SUBSCRIPTIONS_SELECT)
        .eq("student_id", studentId)
        .eq("mentor_id", mentorId)
        .order(SUBSCRIPTIONS_ORDER_COLUMN, { ascending: false })
        .limit(20);
      if (error) continue;
      const rows = rowsFromSupabaseData(data) as Row[];
      for (const r of rows) {
        if (isRowSubscriptionActive(r)) {
          return { table: SUBSCRIPTIONS_TABLE, row: r };
        }
      }
      continue;
    }

    const { column: sc } = await pickExistingColumn(supabase, table, STU_FK);
    const { column: mc } = await pickExistingColumn(supabase, table, MEN_FK);
    if (!sc || !mc) continue;
    const { data, error } = await supabase
      .from(table)
      .select("*")
      .eq(sc, studentId)
      .eq(mc, mentorId)
      .limit(20);
    if (error) continue;
    const rows = (data as Row[] | null) ?? [];
    for (const r of rows) {
      if (isRowSubscriptionActive(r)) {
        return { table, row: r };
      }
    }
  }
  return null;
}

async function firstPayTable(supabase: SupabaseClient): Promise<string | null> {
  for (const t of PAY_TABLES) {
    const { error } = await supabase.from(t).select("id").limit(1);
    if (!error) return t;
  }
  return null;
}

function planAmountKrw(planRow: Row | null): { amount: number; currency: string } {
  if (!planRow) return { amount: 0, currency: "KRW" };
  for (const k of ["amount_cents", "price_cents"] as const) {
    if (typeof planRow[k] === "number" && Number.isFinite(planRow[k] as number)) {
      return { amount: (planRow[k] as number) / 100, currency: "KRW" };
    }
  }
  for (const k of ["amount", "price", "monthly_price", "price_krw"] as const) {
    if (typeof planRow[k] === "number" && Number.isFinite(planRow[k] as number)) {
      return { amount: planRow[k] as number, currency: "KRW" };
    }
  }
  return { amount: 0, currency: "KRW" };
}

/**
 * cash_wallets / cash_ledger(004)의 balance_cents·delta_cents와 **동일한 정수 스케일**(문서: *_cents).
 * - `amount_cents`·`price_cents`가 있으면 planAmountKrw 가 그 값을 /100 하여 KRW 표시에 쓰므로, **원장 차감은 DB 정수를 그대로** 사용
 * (UI·결제 intent 의 won 표기와 `/_cents` 는 위 `planAmountKrw` 를 통해 맞음)
 * - KRW(원) 정수만 온 `amount`·`price_krw`·`monthly_price`·`price` 등: `planAmountKrw`의 표시 원화와, `_cents`가 있을 때 `*_cents/100`이 표시 원과 같다는 기존 관례에 맞춰 **최소화 단위 = KRW(표시) × 100** 으로 환산( `_cents` 를 100으로 나누는 쪽의 역
 */
function planRowDebitAmountCents(planRow: Row): number {
  for (const k of ["amount_cents", "price_cents"] as const) {
    const v = planRow[k];
    if (typeof v === "number" && Number.isFinite(v) && v > 0) {
      return Math.trunc(v);
    }
  }
  const { amount: krwDisplay } = planAmountKrw(planRow);
  if (!Number.isFinite(krwDisplay) || krwDisplay <= 0) {
    return 0;
  }
  return Math.round(krwDisplay * 100);
}

/** DB mentor_plans 금액과 잠금 카탈로그(55k/114.9k/249.9k) 교차검증 — 불일치 시 차감·구독 차단 */
function assertPlanDebitMatchesCatalog(
  planRow: Row,
  planTier: SubscribePlanTier,
  context: string
): { ok: true; amountCents: number } | { ok: false; error: string } {
  const amountCents = planRowDebitAmountCents(planRow);
  const expectedCents = cashKrwForSubscribeTier(planTier) * 100;
  if (amountCents <= 0) {
    console.error(`[assertPlanDebitMatchesCatalog:${context}] non-positive debit`, {
      planTier,
      amountCents,
      planRowId: planRow.id ?? planRow.plan_id,
    });
    return {
      ok: false,
      error:
        "구독 플랜에서 캐시 차감할 유효 금액을 찾을 수 없습니다. 멘토 플랜 금액 설정을 확인하거나 잠시 후 다시 시도해 주세요.",
    };
  }
  if (amountCents !== expectedCents) {
    console.error(`[assertPlanDebitMatchesCatalog:${context}] plan_price_catalog_mismatch`, {
      planTier,
      amountCents,
      expectedCents,
      mentorId: planRow.mentor_id,
      planRowId: planRow.id ?? planRow.plan_id,
    });
    return {
      ok: false,
      error:
        "구독 플랜 금액이 시스템 기준과 일치하지 않아 결제를 진행할 수 없습니다. 고객센터에 문의해 주세요.",
    };
  }
  return { ok: true, amountCents };
}

/** DB `record_subscription_cash_debit`: idempotency_key = 'sub_debit_' || payment_id */
function subscriptionCashDebitIdempotencyKey(paymentId: string): string {
  return `sub_debit_${paymentId}`;
}

async function hasExistingSubscriptionCashDebitLedger(paymentId: string): Promise<boolean> {
  const admin = createServiceRoleClient();
  const key = subscriptionCashDebitIdempotencyKey(paymentId);
  const { data, error } = await admin.from("cash_ledger").select("id").eq("idempotency_key", key).maybeSingle();
  if (error) {
    console.error("[hasExistingSubscriptionCashDebitLedger] select failed", { paymentId, key, error });
    return false;
  }
  return Boolean(data && (data as Row).id != null);
}

/** `newSubscription`: 차감 전제 불충족 시 전체 체크아웃 실패. `alreadySucceeded`: 구독·결제 성과 유지, 원장만 스킵·로그. */
type SubscriptionCashLedgerRepairMode = "newSubscription" | "alreadySucceeded";

/**
 * 플랜 기준 차감액이 양수이고 구독 id가 있을 때만: 원장에 `sub_debit_<paymentId>` 가 없으면 RPC 1회.
 * RPC가 멱등(on conflict do nothing)이므로 레이스에서도 이중 차감 없음.
 */
async function repairMissingSubscriptionCashLedgerIfNeeded(
  supabase: SupabaseClient,
  args: {
    mode: SubscriptionCashLedgerRepairMode;
    studentId: string;
    paymentId: string;
    mentorId: string;
    planTier: SubscribePlanTier;
    subscriptionId: string | null;
    /** 신규 구독 경로에서 이미 조회한 플랜 행 — 재조회 실패 시에도 차감액을 동일하게 쓰기 위함 */
    planRowHint?: Row | null;
  }
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { mode, studentId, paymentId, mentorId, planTier, subscriptionId, planRowHint } = args;
  const logTag = `[repairMissingSubscriptionCashLedger:${mode}]`;

  let planRow: Row | null = planRowHint ?? null;
  if (!planRow) {
    const plans = await fetchPlansForMentor(supabase, mentorId);
    if (plans.error) {
      console.error(`${logTag} fetchPlansForMentor`, plans.error, { paymentId, mentorId });
      if (mode === "alreadySucceeded") {
        console.warn(`${logTag} skip ledger repair (plan fetch failed); preserving succeeded payment + subscription UX`, {
          paymentId,
          studentId,
        });
        return { ok: true };
      }
      return {
        ok: false,
        error: "플랜 정보를 불러오지 못해 캐시 원장을 점검·반영할 수 없습니다. 잠시 후 다시 시도해 주세요.",
      };
    }
    const { byTier } = assignPlansByTier(plans.rows);
    planRow = byTier[planTier];
  }
  if (!planRow) {
    const details = { studentId, paymentId, mentorId, planTier, hasPlanRow: false };
    if (mode === "newSubscription") {
      console.error(`${logTag} missing plan row (blocking new subscription)`, details);
      return {
        ok: false,
        error:
          "구독 플랜에서 캐시 차감할 유효 금액을 찾을 수 없습니다. 멘토 플랜 금액 설정을 확인하거나 잠시 후 다시 시도해 주세요.",
      };
    }
    console.warn(`${logTag} skip ledger repair: no plan row`, details);
    return { ok: true };
  }

  const debitCheck = assertPlanDebitMatchesCatalog(planRow, planTier, mode);
  if (!debitCheck.ok) {
    if (mode === "newSubscription") {
      return { ok: false, error: debitCheck.error };
    }
    console.warn(`${logTag} skip ledger repair: catalog mismatch`, {
      studentId,
      paymentId,
      mentorId,
      planTier,
      error: debitCheck.error,
    });
    return { ok: true };
  }
  const amountCents = debitCheck.amountCents;
  if (!subscriptionId) {
    const details = {
      studentId,
      paymentId,
      mentorId,
      planTier,
      amountCents,
    };
    if (mode === "newSubscription") {
      console.error(`${logTag} missing subscriptionId (blocking new subscription)`, details);
      return {
        ok: false,
        error: "구독 정보가 올바르지 않아 캐시 원장을 반영할 수 없습니다. 잠시 후 다시 시도해 주세요.",
      };
    }
    console.warn(
      `${logTag} skip ledger repair: no active subscription id for pair (cannot attach subscription debit row)`,
      details
    );
    return { ok: true };
  }
  if (await hasExistingSubscriptionCashDebitLedger(paymentId)) {
    return { ok: true };
  }
  console.warn(`${logTag} applying subscription cash debit (ledger row was missing for this payment)`, {
    paymentId,
    subscriptionId,
    amountCents,
  });
  return recordSubscriptionCashDebitRpc(studentId, subscriptionId, paymentId, amountCents);
}

async function recordSubscriptionCashDebitRpc(
  userId: string,
  subscriptionId: string,
  paymentId: string,
  amountCents: number
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (amountCents <= 0) {
    console.error("[recordSubscriptionCashDebitRpc] refused: p_amount_cents must be positive (019 RPC)", {
      userId,
      subscriptionId,
      paymentId,
      amountCents,
    });
    return {
      ok: false,
      error: "구독 플랜에서 캐시 차감 금액을 확인할 수 없습니다. 플랜 금액 설정을 점검해 주세요.",
    };
  }
  try {
    const admin = createServiceRoleClient();
    const { error } = await admin.rpc("record_subscription_cash_debit", {
      p_user_id: userId,
      p_subscription_id: subscriptionId,
      p_payment_id: paymentId,
      p_amount_cents: amountCents,
    });
    if (error) {
      const m = String(error.message ?? error);
      if (/CASH_INSUFFICIENT|잔액|balance|P0001/i.test(m) || m.includes("CASH")) {
        return {
          ok: false,
          error: "캐시 잔액이 부족합니다. 캐시 충전 후 다시 시도하거나 운영팀에 문의해 주세요.",
        };
      }
      return { ok: false, error: "캐시 정산(구독 결제)에 실패했습니다. 잠시 후 다시 시도해 주세요." };
    }
    return { ok: true };
  } catch (e) {
    const m = e instanceof Error ? e.message : String(e);
    return { ok: false, error: `캐시 정산(구독 결제)에 실패했습니다: ${m}` };
  }
}

/**
 * `record_subscription_cash_debit` 이후 `markPaymentSucceeded`만 실패한 경우(드묾) 보정: 원장+지갑을 019 `record_subscription_cash_rollback`에서 원자적으로 되돌림
 */
async function tryReversalSubscriptionCashDebit(
  userId: string,
  paymentId: string,
  subscriptionId: string,
  amountCents: number
): Promise<void> {
  if (amountCents <= 0) {
    console.error("[tryReversalSubscriptionCashDebit] skip rollback: non-positive amountCents", {
      userId,
      paymentId,
      subscriptionId,
      amountCents,
    });
    return;
  }
  try {
    const admin = createServiceRoleClient();
    const { error } = await admin.rpc("record_subscription_cash_rollback", {
      p_user_id: userId,
      p_subscription_id: subscriptionId,
      p_payment_id: paymentId,
      p_amount_cents: amountCents,
    });
    if (error) {
      console.error("[tryReversalSubscriptionCashDebit] record_subscription_cash_rollback", error);
    }
  } catch (e) {
    console.error("[tryReversalSubscriptionCashDebit]", e);
  }
}

type IntentResult =
  | {
      ok: true;
      paymentId: string;
      intentKey: string;
      paymentTable: string;
      planProbe: string;
      message: string;
    }
  | { ok: false; error: string; code: "mentor" | "plan" | "dup" | "db" | "auth" };

/**
 * PG 전: pending 결제 1행 + client가 complete 호출(또는 이후 웹훅이 동일 서비스 함수 호출)
 */
export async function createSubscriptionPaymentIntent(
  supabase: SupabaseClient,
  args: { studentId: string; mentorId: string; planTier: SubscribePlanTier }
): Promise<IntentResult> {
  const { studentId, mentorId, planTier } = args;
  const mUser = await getMentorUserPublic(supabase, mentorId);
  if (mUser.error || !mUser.data || mUser.data.role !== "mentor") {
    return { ok: false, error: "멘토를 확인할 수 없습니다.", code: "mentor" };
  }
  const mentorGate = await assertMentorApprovedForAction(supabase, mentorId);
  if (!mentorGate.ok) {
    return { ok: false, error: mentorGate.error, code: "mentor" };
  }
  const dup = await findActiveSubscriptionForPair(supabase, studentId, mentorId);
  if (dup) {
    return {
      ok: false,
      error: "이미 해당 멘토에 활성 구독이 있습니다. 중복 구독을 막았습니다.",
      code: "dup",
    };
  }
  const capUsage = await loadMentorCapUsage(mentorId);
  if (wouldExceedCap(capUsage, planTier)) {
    return {
      ok: false,
      error: "이 멘토는 현재 구독이 마감되었습니다. 다른 멘토를 찾아보거나 잠시 후 다시 시도해 주세요.",
      code: "mentor",
    };
  }
  const plans = await fetchPlansForMentor(supabase, mentorId);
  if (plans.error) {
    return { ok: false, error: `플랜 조회 실패: ${plans.error}`, code: "plan" };
  }
  const { byTier, fillProbe } = assignPlansByTier(plans.rows);
  const planRow = byTier[planTier];
  if (!planRow) {
    return { ok: false, error: `선택한 티어(${planTier})에 맞는 플랜 행이 없습니다. ${fillProbe}`, code: "plan" };
  }
  const { amount, currency } = planAmountKrw(planRow);
  const intentKey = `sub_${randomUUID()}`;
  const payTable = await firstPayTable(supabase);
  if (!payTable) {
    return { ok: false, error: "payments 계열 테이블을 쓸 수 없습니다.RLS/스키마", code: "db" };
  }
  const { column: ucol } = await pickExistingColumn(supabase, payTable, [
    "user_id",
    "student_id",
    "payer_id",
    "customer_id",
    "subscriber_id",
  ]);
  if (!ucol) {
    return { ok: false, error: `${payTable}: 사용자 FK 컬럼 없음`, code: "db" };
  }
  const mcol = (await pickExistingColumn(supabase, payTable, ["mentor_id", "mentor_user_id", "payee_id", "recipient_id"])).column;
  const stCol = (await pickExistingColumn(supabase, payTable, ["status", "state", "payment_status"])).column;
  const amtCol = (await pickExistingColumn(supabase, payTable, ["amount", "total", "amount_krw", "gross"])).column;
  const extCol = (await pickExistingColumn(supabase, payTable, ["external_id", "client_reference", "idempotency_key", "request_id"])).column;
  const metaCol = (await pickExistingColumn(supabase, payTable, ["metadata", "raw", "payload", "data"])).column;
  const curCol = (await pickExistingColumn(supabase, payTable, ["currency", "ccy"])).column;
  const kindCol = (await pickExistingColumn(supabase, payTable, ["kind", "type", "purpose", "product"])).column;

  const planIdStr = String(
    (planRow as Row).id ?? (planRow as Row).plan_id ?? (planRow as Row).uuid ?? ""
  );

  const base: Record<string, unknown> = {
    [ucol]: studentId,
  };
  if (mcol) base[mcol] = mentorId;
  if (stCol) base[stCol] = "pending";
  if (amtCol) base[amtCol] = amount;
  if (curCol) base[curCol] = currency;
  if (extCol) base[extCol] = `sub_intent_${intentKey}`;
  if (metaCol) {
    base[metaCol] = { planTier, intentKey, planId: planIdStr || undefined, source: "subscribe_checkout" };
  }
  if (kindCol) base[kindCol] = "subscription";

  const { data, error } = await supabase.from(payTable).insert(base).select("id").maybeSingle();
  if (error || !data || typeof (data as Row).id === "undefined") {
    return {
      ok: false,
      error: error?.message ?? "payments insert 실패(필수 컬럼·RLS·NOT NULL)",
      code: "db",
    };
  }
  const paymentId = String((data as Row).id);
  return {
    ok: true,
    paymentId,
    intentKey,
    paymentTable: payTable,
    planProbe: plans.probe,
    message: "intent 생성. PG 붙이면 ext/intentKey로 매칭, 완료는 /api/subscribe/complete",
  };
}

type CompleteResult =
  | { ok: true; subscriptionId: string | null; roomId: string | null; paymentId: string; message: string }
  | { ok: false; error: string; code: "not_found" | "dup" | "db" | "idempotent" | "forbidden" };

/**
 * 결제 행이 성공 상태(succeeded/paid 등)일 때만 subscriptions + rooms 활성화.
 * pending 등 비확정 상태는 SUBSCRIBE_CHECKOUT_ALLOW_PENDING=true 일 때만 허용(로컬·스테이징 전용).
 * PG·웹훅에서 결제 확정 후 동일 함수를 호출하는 것이 출시 기준 흐름.
 */
export function isSubscribeCheckoutPendingBypassAllowed(): boolean {
  const on =
    process.env.SUBSCRIBE_CHECKOUT_ALLOW_PENDING === "true" ||
    process.env.SUBSCRIBE_CHECKOUT_ALLOW_PENDING === "1";
  if (process.env.NODE_ENV === "production" && on) {
    throw new Error("SUBSCRIBE_CHECKOUT_ALLOW_PENDING: 프로덕션에서는 허용되지 않습니다");
  }
  if (on) {
    console.warn(
      "[subscribeCheckout] SUBSCRIBE_CHECKOUT_ALLOW_PENDING=true — 미결제 구독 완료 우회가 허용됩니다(개발·스테이징 전용)."
    );
  }
  return on;
}

const PLAN_TABLE_CANDIDATES = ["plans", "mentor_plans", "subscription_plans", "mentor_subscription_plans"] as const;
const PLAN_FK_CANDIDATES = ["mentor_id", "mentor_user_id", "user_id", "owner_id"] as const;

/**
 * 구독 카탈로그 티어 행이 DB에 없으면 service role로 생성(캐시 구독 전용).
 */
export async function ensureMentorCatalogPlanRows(
  supabase: SupabaseClient,
  mentorId: string
): Promise<{ ok: true; table: string | null } | { ok: false; error: string }> {
  const plans = await fetchPlansForMentor(supabase, mentorId);
  const { byTier } = assignPlansByTier(plans.rows);
  const missing = SUBSCRIBE_PLAN_CATALOG.filter((p) => !byTier[p.tier]);
  if (missing.length === 0) {
    return { ok: true, table: plans.table };
  }

  let admin: ReturnType<typeof createServiceRoleClient>;
  try {
    admin = createServiceRoleClient();
  } catch (e) {
    const m = e instanceof Error ? e.message : String(e);
    return { ok: false, error: `서비스 설정 오류: ${m}` };
  }

  let table = plans.table;
  if (!table) {
    for (const t of PLAN_TABLE_CANDIDATES) {
      const { error } = await admin.from(t).select("id").limit(1);
      if (!error) {
        table = t;
        break;
      }
    }
  }
  if (!table) {
    return { ok: false, error: "플랜 테이블을 찾을 수 없습니다. 스키마를 확인해 주세요." };
  }

  const { column: fk } = await pickExistingColumn(admin, table, PLAN_FK_CANDIDATES);
  if (!fk) {
    return { ok: false, error: `${table}: 멘토 FK 컬럼이 없습니다.` };
  }
  const tierCol = (await pickExistingColumn(admin, table, ["plan_tier", "tier", "slug", "code"])).column;
  const amtCol = (await pickExistingColumn(admin, table, ["amount_cents", "price_cents", "amount", "price"])).column;
  const labelCol = (await pickExistingColumn(admin, table, ["label", "title", "name"])).column;

  for (const item of missing) {
    const row: Record<string, unknown> = { [fk]: mentorId };
    if (tierCol) row[tierCol] = item.tier;
    if (amtCol) row[amtCol] = item.cashKrw * 100;
    if (labelCol) row[labelCol] = item.label;
    const { error } = await admin.from(table).insert(row);
    if (error) {
      return { ok: false, error: `${table} 플랜(${item.tier}) 생성 실패: ${error.message}` };
    }
  }
  return { ok: true, table };
}

/**
 * 캐시 지갑 즉시 차감 구독: intent 생성 → subscriptions + record_subscription_cash_debit
 */
export async function finalizeSubscriptionCashWalletCheckout(
  supabase: SupabaseClient,
  args: { studentId: string; mentorId: string; planTier: SubscribePlanTier }
): Promise<CompleteResult> {
  const ensured = await ensureMentorCatalogPlanRows(supabase, args.mentorId);
  if (!ensured.ok) {
    return { ok: false, error: ensured.error, code: "db" };
  }

  const intent = await createSubscriptionPaymentIntent(supabase, args);
  if (!intent.ok) {
    const code =
      intent.code === "dup" ? ("dup" as const) : intent.code === "mentor" ? ("not_found" as const) : ("db" as const);
    return { ok: false, error: intent.error, code };
  }

  return finalizeSubscriptionCheckout(supabase, {
    studentId: args.studentId,
    paymentId: intent.paymentId,
    mentorId: args.mentorId,
    planTier: args.planTier,
    cashWallet: true,
  });
}

export async function finalizeSubscriptionCheckout(
  supabase: SupabaseClient,
  args: {
    studentId: string;
    paymentId: string;
    mentorId: string;
    planTier: SubscribePlanTier;
    cashWallet?: boolean;
  }
): Promise<CompleteResult> {
  const { studentId, paymentId, mentorId, planTier, cashWallet } = args;
  const payTable = await firstPayTable(supabase);
  if (!payTable) {
    return { ok: false, error: "payments 테이블 없음", code: "db" };
  }
  const { data: payRow, error: pe } = await supabase.from(payTable).select("*").eq("id", paymentId).maybeSingle();
  if (pe || !payRow) {
    return { ok: false, error: "결제 행을 찾을 수 없습니다.", code: "not_found" };
  }
  const p = payRow as Row;
  const { column: ucol } = await pickExistingColumn(supabase, payTable, [
    "user_id",
    "student_id",
    "payer_id",
    "customer_id",
  ]);
  if (ucol && String(p[ucol]) !== studentId) {
    return { ok: false, error: "본인 결제만 완료 처리할 수 있습니다.", code: "forbidden" };
  }
  const mcol = (await pickExistingColumn(supabase, payTable, ["mentor_id", "mentor_user_id"])).column;
  if (mcol && p[mcol] != null && String(p[mcol]) !== mentorId) {
    return { ok: false, error: "멘토 정보가 결제와 일치하지 않습니다.", code: "forbidden" };
  }
  const mentorGate = await assertMentorApprovedForAction(supabase, mentorId);
  if (!mentorGate.ok) {
    return { ok: false, error: mentorGate.error, code: "forbidden" };
  }

  const stCol = (await pickExistingColumn(supabase, payTable, ["status", "state", "payment_status"])).column;
  if (stCol) {
    const st = String(p[stCol] ?? "").toLowerCase();
    if (st === "succeeded" || st === "paid" || st === "complete" || st === "success") {
      const existingSub = await findActiveSubscriptionForPair(supabase, studentId, mentorId);
      const subscriptionId = existingSub ? String((existingSub.row as Row).id ?? "") : null;
      /**
       * 결제가 이미 성공 상태인 complete 재호출(멱등)에서는 **기존 원장이 있으면** RPC를 다시 호출하지 않는다
       * (`sub_debit_<paymentId>` 멱등 키 + `record_subscription_cash_debit` on conflict do nothing).
       * PG·웹훅 등으로 payment만 먼저 succeeded 된 뒤 앱이 이 분기만 탄 경우 원장 누락이 있을 수 있어,
       * 활성 구독 + 플랜 차감액이 있으면 원장이 없을 때만 1회 보정한다(이중 차감 없음).
       */
      const subIdForRoom = subscriptionId && subscriptionId.length > 0 ? subscriptionId : null;
      const ledgerRepair = await repairMissingSubscriptionCashLedgerIfNeeded(supabase, {
        mode: "alreadySucceeded",
        studentId,
        paymentId,
        mentorId,
        planTier,
        subscriptionId: subIdForRoom,
      });
      if (!ledgerRepair.ok) {
        return {
          ok: false,
          error: ledgerRepair.error,
          code: "db",
        };
      }
      const roomR = await ensureMentorStudentRoomWithServiceRetry(
        supabase,
        studentId,
        mentorId,
        paymentId,
        subIdForRoom,
        "finalizeSubscriptionCheckout.idempotent"
      );
      return {
        ok: true,
        paymentId,
        subscriptionId: subscriptionId || null,
        roomId: roomR.ok ? roomR.roomId : null,
        message: roomR.ok
          ? "이미 완료된 결제입니다. 구독·질문방 정보를 다시 확인했습니다."
          : `이미 완료된 결제이나 질문방을 연결하지 못했습니다. ${userFacingRoomConnectError(roomR.error)}`,
      };
    }
  }

  const allowPendingComplete = cashWallet === true || isSubscribeCheckoutPendingBypassAllowed();
  if (stCol && !allowPendingComplete) {
    const st = String(p[stCol] ?? "").toLowerCase();
    const paidLike =
      st === "succeeded" || st === "paid" || st === "complete" || st === "success";
    if (!paidLike) {
      return {
        ok: false,
        error:
          "결제가 아직 확정되지 않았습니다. PG·웹훅에서 결제 성공 상태로 반영된 뒤에만 구독을 활성화할 수 있습니다. 로컬 개발만 SUBSCRIBE_CHECKOUT_ALLOW_PENDING=true 로 예외 허용.",
        code: "forbidden",
      };
    }
  }

  const again = await findActiveSubscriptionForPair(supabase, studentId, mentorId);
  if (again) {
    return { ok: false, error: "이미 해당 멘토에 활성 구독이 있어 중복을 막았습니다.", code: "dup" };
  }

  const plans = await fetchPlansForMentor(supabase, mentorId);
  const { byTier } = assignPlansByTier(plans.rows);
  const planRow = byTier[planTier];
  if (!planRow) {
    return { ok: false, error: "플랜 행이 없어 구독을 만들 수 없습니다.", code: "db" };
  }
  const planId = String(
    (planRow as Row).id ?? (planRow as Row).plan_id ?? (planRow as Row).uuid ?? ""
  );

  // cap 재검증(서버): 멘토 used_cap + 신청 플랜 cap_weight > cap_limit 이면 결제 거부.
  // (DB 트리거 trg_enforce_mentor_cap가 동시성 최종 방어. 여기서는 친절한 메시지로 선차단.)
  const capUsage = await loadMentorCapUsage(mentorId);
  if (wouldExceedCap(capUsage, planTier)) {
    return {
      ok: false,
      error: "이 멘토는 현재 구독이 마감되었습니다. 다른 멘토를 찾아보거나 잠시 후 다시 시도해 주세요.",
      code: "forbidden",
    };
  }

  const debitCheck = assertPlanDebitMatchesCatalog(planRow, planTier, "finalizeSubscriptionCheckout");
  if (!debitCheck.ok) {
    return { ok: false, error: debitCheck.error, code: "db" };
  }
  const amountCents = debitCheck.amountCents;

  let subId: string | null = null;
  const subInsert = await insertSubscriptionRow(
    supabase,
    { studentId, mentorId, planId, planTier, paymentId, payTable }
  );
  if (!subInsert.ok) {
    return { ok: false, error: `subscriptions 생성 실패: ${subInsert.error}`, code: "db" };
  }
  subId = subInsert.subscriptionId;

  const debit = await repairMissingSubscriptionCashLedgerIfNeeded(supabase, {
    mode: "newSubscription",
    studentId,
    paymentId,
    mentorId,
    planTier,
    subscriptionId: subId,
    planRowHint: planRow,
  });
  if (!debit.ok) {
    await tryDeleteSubscriptionById(supabase, subId);
    return { ok: false, error: debit.error, code: "db" };
  }

  const payUpdate = await markPaymentSucceeded(supabase, payTable, paymentId, stCol);
  if (!payUpdate.ok) {
    if (amountCents > 0) {
      await tryReversalSubscriptionCashDebit(studentId, paymentId, subId, amountCents);
    }
    await tryDeleteSubscriptionById(supabase, subId);
    return { ok: false, error: `결제 완료 표시 실패(롤백: 구독 삭제 시도): ${payUpdate.error}`, code: "db" };
  }

  const roomR = await ensureMentorStudentRoomWithServiceRetry(
    supabase,
    studentId,
    mentorId,
    paymentId,
    subId,
    "finalizeSubscriptionCheckout.newSubscription"
  );
  if (!roomR.ok) {
    return {
      ok: true,
      paymentId,
      subscriptionId: subId,
      roomId: null,
      message: `구독은 반영됐는데 질문방을 열지 못했어요. ${userFacingRoomConnectError(roomR.error)}`,
    };
  }
  return {
    ok: true,
    paymentId,
    subscriptionId: subId,
    roomId: roomR.roomId,
    message: "구독·질문방·결제 완료 처리를 마쳤습니다.",
  };
}

type InsSub =
  | { ok: true; subscriptionId: string }
  | { ok: false; error: string };

async function insertSubscriptionRow(
  supabase: SupabaseClient,
  ctx: {
    studentId: string;
    mentorId: string;
    planId: string;
    planTier: SubscribePlanTier;
    paymentId: string;
    payTable: string;
  }
): Promise<InsSub> {
  void supabase;
  const admin = createServiceRoleClient();

  const canonical = await admin
    .from(SUBSCRIPTIONS_TABLE)
    .insert(
      buildSubscriptionsInsertPayload({
        studentId: ctx.studentId,
        mentorId: ctx.mentorId,
        planId: ctx.planId,
        planTier: ctx.planTier,
        paymentId: ctx.paymentId,
      })
    )
    .select("id")
    .maybeSingle();
  if (!canonical.error && canonical.data && (canonical.data as Row).id != null) {
    return { ok: true, subscriptionId: String((canonical.data as Row).id) };
  }
  if (canonical.error) {
    console.error("[insertSubscriptionRow] subscriptions insert", canonical.error);
  }

  for (const table of SUB_TABLES) {
    if (table === SUBSCRIPTIONS_TABLE) continue;
    const { error: pe } = await admin.from(table).select("id").limit(1);
    if (pe) continue;
    const { column: sc } = await pickExistingColumn(admin, table, STU_FK);
    const { column: mc } = await pickExistingColumn(admin, table, MEN_FK);
    if (!sc || !mc) continue;
    const st = (await pickExistingColumn(admin, table, ["status", "state", "subscription_status"])).column;
    const pc = (await pickExistingColumn(admin, table, ["plan_id", "mentor_plan_id", "product_id", "price_id"])).column;
    const payRef = (await pickExistingColumn(admin, table, ["payment_id", "last_payment_id", "initial_payment_id"])).column;
    const p: Record<string, unknown> = { [sc]: ctx.studentId, [mc]: ctx.mentorId };
    if (st) p[st] = "active";
    if (pc && ctx.planId) p[pc] = ctx.planId;
    if (payRef) p[payRef] = ctx.paymentId;
    const { column: tierC } = await pickExistingColumn(admin, table, ["plan_tier", "tier", "label"]);
    if (tierC) p[tierC] = ctx.planTier;
    const { data, error } = await admin.from(table).insert(p).select("id").maybeSingle();
    if (!error && data && (data as Row).id != null) {
      return { ok: true, subscriptionId: String((data as Row).id) };
    }
  }
  return {
    ok: false,
    error: canonical.error?.message ?? "subscriptions insert 후보 전부 실패",
  };
}

async function markPaymentSucceeded(
  supabase: SupabaseClient,
  table: string,
  id: string,
  stCol: string | null
): Promise<{ ok: true } | { ok: false; error: string }> {
  void supabase;
  if (!stCol) return { ok: true };
  const admin = createServiceRoleClient();
  for (const val of ["succeeded", "paid", "success", "complete", "captured"] as const) {
    const { data, error } = await admin
      .from(table)
      .update({ [stCol]: val })
      .eq("id", id)
      .select("id")
      .maybeSingle();
    if (!error && data) {
      return { ok: true };
    }
  }
  return { ok: false, error: "status 업데이트 실패" };
}

async function tryDeleteSubscriptionById(supabase: SupabaseClient, subId: string | null) {
  void supabase;
  if (!subId) return;
  const admin = createServiceRoleClient();
  for (const table of SUB_TABLES) {
    const { error } = await admin.from(table).delete().eq("id", subId);
    if (!error) return;
    console.error(
      "[tryDeleteSubscriptionById] failed on",
      table,
      "subId:",
      subId,
      error.message
    );
  }
  console.error("[tryDeleteSubscriptionById] ZOMBIE_SUBSCRIPTION_RISK subId:", subId);
}

type RoomR = { ok: true; roomId: string } | { ok: false; error: string };

/**
 * room이 있으면 재사용(멱등) — 별도 행이 없을 때만 insert
 */
export async function ensureMentorStudentRoom(
  supabase: SupabaseClient,
  studentId: string,
  mentorId: string,
  paymentId: string,
  subscriptionId?: string | null
): Promise<RoomR> {
  const stu = await fetchRoomsForUser(supabase, "student", studentId);
  for (const r of stu.rows) {
    const m =
      (r.mentor_id as string) ??
      (r.mentor_user_id as string) ??
      (r.mentor_uid as string) ??
      null;
    if (m === mentorId) {
      return { ok: true, roomId: String(r.id) };
    }
  }
  const { error: re } = await supabase.from(ROOM_TABLE).select("id").limit(1);
  if (re) {
    return { ok: false, error: re.message };
  }
  const { column: sCol } = await pickExistingColumn(supabase, ROOM_TABLE, [
    "student_id",
    "student_user_id",
    "student_uid",
  ]);
  const { column: mCol } = await pickExistingColumn(supabase, ROOM_TABLE, [
    "mentor_id",
    "mentor_user_id",
    "mentor_uid",
  ]);
  if (!sCol || !mCol) {
    return { ok: false, error: "mentor_student_rooms: student/mentor FK 찾지 못함" };
  }
  const { column: payCol } = await pickExistingColumn(supabase, ROOM_TABLE, [
    "payment_id",
    "source_payment_id",
  ]);
  const { column: subCol } = await pickExistingColumn(supabase, ROOM_TABLE, [
    "subscription_id",
    "sub_id",
  ]);
  const payload: Record<string, unknown> = {
    [sCol]: studentId,
    [mCol]: mentorId,
  };
  if (payCol) payload[payCol] = paymentId;
  if (subCol && subscriptionId) payload[subCol] = subscriptionId;
  const { data, error } = await supabase
    .from(ROOM_TABLE)
    .insert(payload)
    .select("id")
    .maybeSingle();
  if (error) {
    const isDup =
      (error as { code?: string }).code === "23505" || /unique|duplicate/i.test(error.message);
    if (isDup) {
      const stu2 = await fetchRoomsForUser(supabase, "student", studentId);
      if (!stu2.error) {
        for (const r of stu2.rows) {
          const m =
            (r.mentor_id as string) ??
            (r.mentor_user_id as string) ??
            (r.mentor_uid as string) ??
            null;
          if (m === mentorId && r.id != null) {
            return { ok: true, roomId: String(r.id) };
          }
        }
      }
    }
    return { ok: false, error: error.message };
  }
  if (data && (data as Row).id != null) {
    return { ok: true, roomId: String((data as Row).id) };
  }
  return { ok: false, error: "room insert id 없음" };
}

function userFacingRoomConnectError(detail: string | undefined): string {
  const s = String(detail ?? "").trim();
  if (!s) {
    return "잠시 뒤 질문방 메뉴를 다시 열어 보시거나, 문제가 계속되면 고객센터로 문의해 주세요.";
  }
  if (
    /PGRST|postgrest|permission|RLS|42501|42503|42P01|22P02|23\d{3}|violates foreign key/i.test(s) ||
    s.length > 280
  ) {
    return "질문방을 연결하는 데 일시적인 문제가 있어요. 잠시 뒤 다시 시도해 주세요.";
  }
  return s;
}

/**
 * mentor_student_rooms insert는 authenticated RLS(027 등)로 막히는 경우가 많아
 * service_role로만 생성·재사용을 시도한다. 구독이 확정된 뒤 호출된다.
 */
async function ensureMentorStudentRoomWithServiceRetry(
  userClient: SupabaseClient,
  studentId: string,
  mentorId: string,
  paymentId: string,
  subscriptionId: string | null,
  logLabel: string
): Promise<RoomR> {
  void userClient;
  void logLabel;
  return ensureMentorStudentRoom(createServiceRoleClient(), studentId, mentorId, paymentId, subscriptionId);
}
