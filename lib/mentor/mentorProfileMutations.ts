import type { PostgrestError, SupabaseClient } from "@supabase/supabase-js";
import { insertNotificationBestEffort } from "@/lib/notifications/notificationInsert";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import {
  amountCentsFromCashKrw,
  mentorPlanDebitAmountCents,
  SUBSCRIBE_PLAN_TIERS,
} from "@/lib/subscribe/mentorPlanPricing";
import type { SubscribePlanTier } from "@/lib/subscribe/subscribePageQueries";
import { SUBSCRIPTIONS_TABLE } from "@/lib/subscribe/subscriptionsTable";

function isMissingColumnError(err: PostgrestError | null): boolean {
  if (!err) return false;
  return /column|does not exist|schema cache/i.test(err.message);
}

export type MentorProfileFormInput = {
  userId: string;
  intro: string;
  university: string;
  department: string;
  grade: string;
  subjects: string;
  highSchool: string;
  tags: string;
  subscribeOpen: boolean;
  subscriptionPricesKrw?: Record<SubscribePlanTier, number | null>;
  /** 개별 질문(지정형) 답변 단가. null/미입력이면 변경하지 않음. 구독 요금제와 별개. */
  individualQuestionPriceCash?: number | null;
};

const ACTIVE_SUBSCRIPTION_STATUSES = ["active", "cancel_scheduled", "past_due"];

function priceChanged(
  row: Record<string, unknown> | null,
  tier: SubscribePlanTier,
  nextAmountCents: number
): boolean {
  if (!row) return true;
  return mentorPlanDebitAmountCents(row, tier) !== nextAmountCents;
}

async function notifyActiveSubscribersOfPriceChange(
  supabase: SupabaseClient,
  mentorId: string,
  changedTiers: SubscribePlanTier[]
): Promise<void> {
  if (changedTiers.length === 0) return;

  let readClient = supabase;
  try {
    readClient = createServiceRoleClient();
  } catch {
    readClient = supabase;
  }

  const { data, error } = await readClient
    .from(SUBSCRIPTIONS_TABLE)
    .select("student_id, status")
    .eq("mentor_id", mentorId)
    .in("status", ACTIVE_SUBSCRIPTION_STATUSES);

  if (error) {
    console.warn("[notifyActiveSubscribersOfPriceChange] subscription lookup failed", {
      mentorId,
      error: error.message,
    });
    return;
  }

  const studentIds = Array.from(
    new Set(
      ((data as Record<string, unknown>[] | null) ?? [])
        .map((row) => (typeof row.student_id === "string" ? row.student_id : null))
        .filter((id): id is string => Boolean(id))
    )
  );

  await Promise.all(
    studentIds.map((studentId) =>
      insertNotificationBestEffort({
        recipientUserId: studentId,
        type: "mentor_subscription_price_changed",
        title: "멘토 구독 요금이 변경됐어요",
        body: "구독 중인 멘토의 요금제가 변경됐어요. 현재 구독에는 바로 적용되지 않고 신규 구독 또는 다음 갱신부터 반영됩니다.",
        link: `/mentors/${mentorId}`,
        metadata: { mentorId, changedTiers },
      })
    )
  );
}

async function updateMentorSubscriptionPrices(
  supabase: SupabaseClient,
  mentorId: string,
  pricesKrw: Record<SubscribePlanTier, number | null> | undefined,
  now: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!pricesKrw) return { ok: true };

  const payloads: Record<string, unknown>[] = [];
  const changedTiers: SubscribePlanTier[] = [];
  const { data: existingRows, error: selectError } = await supabase
    .from("mentor_plans")
    .select("id, mentor_id, plan_tier, amount_cents")
    .eq("mentor_id", mentorId);

  if (selectError) {
    return { ok: false, error: selectError.message };
  }

  const byTier = new Map<SubscribePlanTier, Record<string, unknown>>();
  for (const row of (existingRows as Record<string, unknown>[] | null) ?? []) {
    const tier = row.plan_tier;
    if (tier === "limited" || tier === "standard" || tier === "premium") {
      byTier.set(tier, row);
    }
  }

  for (const tier of SUBSCRIBE_PLAN_TIERS) {
    const cashKrw = pricesKrw[tier];
    if (typeof cashKrw !== "number" || !Number.isFinite(cashKrw) || cashKrw <= 0) {
      return { ok: false, error: "구독 요금은 1캐시 이상 숫자로 입력해 주세요." };
    }
    const amountCents = amountCentsFromCashKrw(Math.trunc(cashKrw));
    const existing = byTier.get(tier) ?? null;
    if (!priceChanged(existing, tier, amountCents)) continue;

    changedTiers.push(tier);
    payloads.push({
      mentor_id: mentorId,
      plan_tier: tier,
      amount_cents: amountCents,
      updated_at: now,
      price_updated_at: now,
    });
  }

  if (payloads.length === 0) return { ok: true };

  const { error: upsertError } = await supabase
    .from("mentor_plans")
    .upsert(payloads, { onConflict: "mentor_id,plan_tier" });

  if (upsertError) {
    return { ok: false, error: upsertError.message };
  }

  await notifyActiveSubscribersOfPriceChange(supabase, mentorId, changedTiers);
  return { ok: true };
}

/**
 * 개별 질문(지정형) 답변 단가 upsert. 구독 요금제(mentor_plans)와 별개 테이블.
 * 미입력(null)이면 변경하지 않는다. 입력 시 0 초과만 허용(최소/최대 강제 없음 — 자유 금액).
 */
async function updateMentorIndividualQuestionPrice(
  supabase: SupabaseClient,
  mentorId: string,
  priceCash: number | null | undefined,
  now: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (priceCash == null) return { ok: true };
  if (!Number.isFinite(priceCash) || priceCash <= 0) {
    return { ok: false, error: "개별 질문 답변 단가는 1캐시 이상 숫자로 입력해 주세요." };
  }
  // 입력은 캐시(=원). 정규 cents(=캐시×100)로 저장 — 구독 헬퍼 재사용으로 규약 일원화.
  const { error } = await supabase
    .from("mentor_individual_question_pricing")
    .upsert(
      { mentor_id: mentorId, amount_cents: amountCentsFromCashKrw(priceCash), updated_at: now },
      { onConflict: "mentor_id" }
    );
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

/**
 * 가입·sync 시 사용한 컬럼 + 확장 후보(마이그레이션과 맞춤)
 */
export async function updateMentorProfile(
  supabase: SupabaseClient,
  input: MentorProfileFormInput
): Promise<{ ok: true } | { ok: false; error: string }> {
  const subjects = input.subjects
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const tags = input.tags
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const now = new Date().toISOString();
  // [학적 잠금] university_name 은 멘토가 직접 수정할 수 없다.
  // 최초값은 가입(syncAfterSignUpSession)에서 설정되고, 이후 변경은
  // 학적변경요청(mentor_academic_record_change_requests) 관리자 승인으로만 반영된다.
  // 따라서 이 upsert 에서는 university_name 을 의도적으로 제외한다.
  const core: Record<string, unknown> = {
    user_id: input.userId,
    intro_line: input.intro || null,
    department_name: input.department || null,
    teaching_subjects: subjects,
    high_school_name: input.highSchool || null,
    updated_at: now,
  };

  // [안전장치] 정상 계정은 가입(syncAfterSignUpSession)에서 mentor_profiles 행이
  // 이미 만들어지므로 위 upsert 는 UPDATE 가 되어 university_name 을 건드리지 않는다(잠금 유지).
  // 다만 행이 없는 비정상 계정이면 이 upsert 가 INSERT 가 되는데, university_name 은
  // NOT NULL(기본값 없음)이라 누락 시 저장이 통째로 실패한다. 그 경우에만 한해
  // 최초 INSERT 를 성립시키기 위해 현재 표시값으로 채운다. 행이 이미 있으면 절대 덮어쓰지 않는다.
  const { data: existingProfile } = await supabase
    .from("mentor_profiles")
    .select("user_id")
    .eq("user_id", input.userId)
    .maybeSingle();
  if (!existingProfile) {
    core.university_name = input.university?.trim() || "";
  }

  const { error: upErr } = await supabase.from("mentor_profiles").upsert(core, { onConflict: "user_id" });
  if (upErr) {
    return { ok: false, error: upErr.message };
  }

  const extras: Record<string, unknown>[] = [
    {
      tags: tags.join(", "),
      featured_tags: tags,
      accept_subscriptions: input.subscribeOpen,
      accepts_subscriptions: input.subscribeOpen,
      is_open_for_subscriptions: input.subscribeOpen,
      grade: input.grade || null,
      grade_level: input.grade || null,
      academic_year: input.grade || null,
    },
    { tags, featured_tags: tags.join(", ") },
    { grade: input.grade || null },
    { grade_level: input.grade || null },
  ];

  for (const patch of extras) {
    const { error } = await supabase.from("mentor_profiles").update({ ...patch, updated_at: now }).eq("user_id", input.userId);
    if (!error) {
      break;
    }
    if (!isMissingColumnError(error)) {
      return { ok: false, error: error.message };
    }
  }

  const priceUpdate = await updateMentorSubscriptionPrices(
    supabase,
    input.userId,
    input.subscriptionPricesKrw,
    now
  );
  if (!priceUpdate.ok) return priceUpdate;

  const iqPriceUpdate = await updateMentorIndividualQuestionPrice(
    supabase,
    input.userId,
    input.individualQuestionPriceCash,
    now
  );
  if (!iqPriceUpdate.ok) return iqPriceUpdate;

  return { ok: true };
}
