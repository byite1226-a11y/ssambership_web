import { randomUUID } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getMentorUserPublic } from "@/lib/auth/mentorPublicRead";
import { fetchPlansForMentor } from "@/lib/mentor/publicMentorBundle";
import { pickExistingColumn } from "@/lib/qna/safeSelect";
import { assignPlansByTier, type SubscribePlanTier } from "@/lib/subscribe/subscribePageQueries";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { fetchRoomsForUser } from "@/lib/qna/questionRoomQueries";

type Row = Record<string, unknown>;

const SUB_TABLES = ["subscriptions", "mentor_subscriptions", "user_subscriptions"] as const;
const STU_FK = ["student_id", "user_id", "student_user_id", "subscriber_id"] as const;
const MEN_FK = ["mentor_id", "mentor_user_id", "creator_id", "host_id"] as const;
const PAY_TABLES = ["payments", "payment_intents", "order_payments"] as const;
const ROOM_TABLE = "mentor_student_rooms" as const;

const ACTIVE_SUB_RE = /cancel|expir|end|inactiv|refund|void|revok|close|stop/i;

function isRowSubscriptionActive(row: Row): boolean {
  const st = String(row.status ?? row.state ?? row.subscription_status ?? "").toLowerCase();
  if (!st) return true;
  return !ACTIVE_SUB_RE.test(st);
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

async function recordSubscriptionCashDebitRpc(
  userId: string,
  subscriptionId: string,
  paymentId: string,
  amountCents: number
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (amountCents <= 0) {
    return { ok: true };
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
        return { ok: false, error: "캐시 잔액이 부족합니다. 충전 후 다시 시도해 주세요." };
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
  if (amountCents <= 0) return;
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
  const dup = await findActiveSubscriptionForPair(supabase, studentId, mentorId);
  if (dup) {
    return {
      ok: false,
      error: "이미 해당 멘토에 활성 구독이 있습니다. 중복 구독을 막았습니다.",
      code: "dup",
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
export async function finalizeSubscriptionCheckout(
  supabase: SupabaseClient,
  args: { studentId: string; paymentId: string; mentorId: string; planTier: SubscribePlanTier }
): Promise<CompleteResult> {
  const { studentId, paymentId, mentorId, planTier } = args;
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

  const stCol = (await pickExistingColumn(supabase, payTable, ["status", "state", "payment_status"])).column;
  if (stCol) {
    const st = String(p[stCol] ?? "").toLowerCase();
    if (st === "succeeded" || st === "paid" || st === "complete" || st === "success") {
      const existingSub = await findActiveSubscriptionForPair(supabase, studentId, mentorId);
      const subscriptionId = existingSub ? String((existingSub.row as Row).id ?? "") : null;
      if (subscriptionId && subscriptionId.length > 0) {
        const plansR = await fetchPlansForMentor(supabase, mentorId);
        const { byTier: byTierR } = assignPlansByTier(plansR.rows);
        const pr = byTierR[planTier];
        if (pr) {
          const ac = planRowDebitAmountCents(pr as Row);
          if (ac > 0) {
            const d = await recordSubscriptionCashDebitRpc(studentId, subscriptionId, paymentId, ac);
            if (!d.ok) {
              return { ok: false, error: d.error, code: "db" };
            }
          }
        }
      }
      const roomR = await ensureMentorStudentRoom(
        supabase,
        studentId,
        mentorId,
        paymentId,
        subscriptionId && subscriptionId.length > 0 ? subscriptionId : null
      );
      return {
        ok: true,
        paymentId,
        subscriptionId: subscriptionId || null,
        roomId: roomR.ok ? roomR.roomId : null,
        message: roomR.ok
          ? "이미 완료된 결제입니다. 구독·질문방 정보를 다시 확인했습니다."
          : `이미 완료된 결제이나 질문방 연결에 문제가 있습니다: ${roomR.error}`,
      };
    }
  }

  const allowPendingComplete =
    process.env.SUBSCRIBE_CHECKOUT_ALLOW_PENDING === "true" ||
    process.env.SUBSCRIBE_CHECKOUT_ALLOW_PENDING === "1";
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

  let subId: string | null = null;
  const subInsert = await insertSubscriptionRow(
    supabase,
    { studentId, mentorId, planId, planTier, paymentId, payTable }
  );
  if (!subInsert.ok) {
    return { ok: false, error: `subscriptions 생성 실패: ${subInsert.error}`, code: "db" };
  }
  subId = subInsert.subscriptionId;

  const amountCents = planRowDebitAmountCents(planRow);
  if (amountCents > 0) {
    const d = await recordSubscriptionCashDebitRpc(studentId, subId, paymentId, amountCents);
    if (!d.ok) {
      await tryDeleteSubscriptionById(supabase, subId);
      return { ok: false, error: d.error, code: "db" };
    }
  }

  const payUpdate = await markPaymentSucceeded(supabase, payTable, paymentId, stCol);
  if (!payUpdate.ok) {
    if (amountCents > 0) {
      await tryReversalSubscriptionCashDebit(studentId, paymentId, subId, amountCents);
    }
    await tryDeleteSubscriptionById(supabase, subId);
    return { ok: false, error: `결제 완료 표시 실패(롤백: 구독 삭제 시도): ${payUpdate.error}`, code: "db" };
  }

  const roomR = await ensureMentorStudentRoom(supabase, studentId, mentorId, paymentId, subId);
  if (!roomR.ok) {
    return {
      ok: true,
      paymentId,
      subscriptionId: subId,
      roomId: null,
      message: `구독은 생성됐으나 질문방을 만들지 못했습니다: ${roomR.error}`,
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
  for (const table of SUB_TABLES) {
    const { error: pe } = await supabase.from(table).select("id").limit(1);
    if (pe) continue;
    const { column: sc } = await pickExistingColumn(supabase, table, STU_FK);
    const { column: mc } = await pickExistingColumn(supabase, table, MEN_FK);
    if (!sc || !mc) continue;
    const st = (await pickExistingColumn(supabase, table, ["status", "state", "subscription_status"])).column;
    const pc = (await pickExistingColumn(supabase, table, ["plan_id", "mentor_plan_id", "product_id", "price_id"])).column;
    const payRef = (await pickExistingColumn(supabase, table, ["payment_id", "last_payment_id", "initial_payment_id"])).column;
    const p: Record<string, unknown> = { [sc]: ctx.studentId, [mc]: ctx.mentorId };
    if (st) p[st] = "active";
    if (pc && ctx.planId) p[pc] = ctx.planId;
    if (payRef) p[payRef] = ctx.paymentId;
    const { column: tierC } = await pickExistingColumn(supabase, table, ["plan_tier", "tier", "label"]);
    if (tierC) p[tierC] = ctx.planTier;
    const { data, error } = await supabase.from(table).insert(p).select("id").maybeSingle();
    if (!error && data && (data as Row).id != null) {
      return { ok: true, subscriptionId: String((data as Row).id) };
    }
  }
  return { ok: false, error: "subscriptions insert 후보 전부 실패" };
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
