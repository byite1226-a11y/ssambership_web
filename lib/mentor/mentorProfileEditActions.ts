"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/routeGuard";
import { createClient } from "@/lib/supabase/server";
import { updateMentorProfile } from "@/lib/mentor/mentorProfileMutations";
import { SUBSCRIBE_PLAN_TIERS } from "@/lib/subscribe/mentorPlanPricing";
import type { SubscribePlanTier } from "@/lib/subscribe/subscribePageQueries";

const PATH = "/mentor/profile/edit";

function errQ(msg: string) {
  const q = new URLSearchParams();
  q.set("error", msg);
  return `${PATH}?${q.toString()}`;
}

function parsePriceKrw(formData: FormData, tier: SubscribePlanTier): number | null {
  const raw = String(formData.get(`subscriptionPriceKrw_${tier}`) ?? "").replace(/[^\d]/g, "");
  if (!raw) return null;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 ? n : null;
}

/** 개별 질문 답변 단가(캐시). 미입력이면 null → 변경 없음. */
function parseIndividualQuestionPriceCash(formData: FormData): number | null {
  const raw = String(formData.get("individualQuestionPriceCash") ?? "").replace(/[^\d]/g, "");
  if (!raw) return null;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 ? n : null;
}

export async function submitMentorProfileEdit(formData: FormData) {
  const { user } = await requireRole("mentor");
  const supabase = await createClient();

  const intro = String(formData.get("intro") ?? "").trim();
  const university = String(formData.get("university") ?? "").trim();
  const department = String(formData.get("department") ?? "").trim();
  const grade = String(formData.get("grade") ?? "").trim();
  const subjects = String(formData.get("subjects") ?? "").trim();
  const highSchool = String(formData.get("highSchool") ?? "").trim();
  const tags = String(formData.get("tags") ?? "").trim();
  const subscribeOpen = formData.get("subscribeOpen") === "on";
  const subscriptionPricesKrw = Object.fromEntries(
    SUBSCRIBE_PLAN_TIERS.map((tier) => [tier, parsePriceKrw(formData, tier)])
  ) as Record<SubscribePlanTier, number | null>;

  if (SUBSCRIBE_PLAN_TIERS.some((tier) => subscriptionPricesKrw[tier] == null)) {
    redirect(errQ("구독 요금은 1캐시 이상 숫자로 입력해 주세요."));
  }

  const r = await updateMentorProfile(supabase, {
    userId: user.id,
    intro,
    university,
    department,
    grade,
    subjects,
    highSchool,
    tags,
    subscribeOpen,
    subscriptionPricesKrw,
    individualQuestionPriceCash: parseIndividualQuestionPriceCash(formData),
  });

  if (!r.ok) {
    redirect(errQ(r.error));
  }

  revalidatePath("/mentor/profile");
  revalidatePath(PATH);
  revalidatePath("/mentors");
  redirect(`${PATH}?ok=1`);
}
