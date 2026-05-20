import type { SupabaseClient } from "@supabase/supabase-js";
import { pickExistingColumn } from "@/lib/qna/safeSelect";

const ELIGIBLE_STATUSES = ["active", "expired"] as const;
const MIN_SUBSCRIPTION_COUNT = 2;

export type ReviewEligibilityResult =
  | { eligible: true; subscriptionCount: number }
  | { eligible: false; reason: string; subscriptionCount: number };

async function subscriptionStudentColumn(supabase: SupabaseClient): Promise<string | null> {
  const { column } = await pickExistingColumn(supabase, "subscriptions", ["author_id", "student_id"]);
  return column;
}

/**
 * 동일 멘토에 대해 active/expired 구독 2회 이상 + 미작성 리뷰일 때만 작성 가능.
 */
export async function checkReviewEligibility(
  supabase: SupabaseClient,
  authorId: string,
  mentorId: string
): Promise<ReviewEligibilityResult> {
  const subCol = await subscriptionStudentColumn(supabase);
  if (!subCol) {
    return {
      eligible: false,
      reason: "구독 이력을 확인하지 못했습니다. 잠시 후 다시 시도해 주세요.",
      subscriptionCount: 0,
    };
  }

  const { count, error: countErr } = await supabase
    .from("subscriptions")
    .select("*", { count: "exact", head: true })
    .eq(subCol, authorId)
    .eq("mentor_id", mentorId)
    .in("status", [...ELIGIBLE_STATUSES]);

  if (countErr) {
    return {
      eligible: false,
      reason: "구독 이력을 확인하지 못했습니다. 잠시 후 다시 시도해 주세요.",
      subscriptionCount: 0,
    };
  }

  const subscriptionCount = count ?? 0;

  if (subscriptionCount < MIN_SUBSCRIPTION_COUNT) {
    return {
      eligible: false,
      reason:
        subscriptionCount === 0
          ? "동일 멘토에 2회 이상 구독(결제) 후 리뷰를 작성할 수 있습니다. 무료체험만 이용한 경우 작성할 수 없습니다."
          : "동일 멘토에 2회 이상 구독한 경우에만 리뷰를 작성할 수 있습니다.",
      subscriptionCount,
    };
  }

  const { data: existing, error: reviewErr } = await supabase
    .from("reviews")
    .select("id")
    .eq("author_id", authorId)
    .eq("mentor_id", mentorId)
    .maybeSingle();

  if (reviewErr) {
    return {
      eligible: false,
      reason: "리뷰 작성 여부를 확인하지 못했습니다.",
      subscriptionCount,
    };
  }

  if (existing?.id) {
    return {
      eligible: false,
      reason: "이미 이 멘토에 대한 리뷰를 작성했습니다. 작성 후에는 수정할 수 없습니다.",
      subscriptionCount,
    };
  }

  return { eligible: true, subscriptionCount };
}
