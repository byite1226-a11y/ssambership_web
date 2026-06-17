import type { SupabaseClient } from "@supabase/supabase-js";
import type { MentorIndividualQuestionPricingRow } from "@/lib/individualQuestion/individualQuestionTypes";

const TABLE = "mentor_individual_question_pricing" as const;

function positiveAmountCents(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  const amount = Math.trunc(value);
  return amount > 0 ? amount : null;
}

export async function fetchMentorIndividualQuestionPrice(
  supabase: SupabaseClient,
  mentorId: string
): Promise<{ row: MentorIndividualQuestionPricingRow | null; amountCents: number | null; error: string | null }> {
  const { data, error } = await supabase
    .from(TABLE)
    .select("mentor_id, amount_cents, updated_at")
    .eq("mentor_id", mentorId)
    .maybeSingle();

  if (error) {
    return { row: null, amountCents: null, error: error.message };
  }

  const row = data as MentorIndividualQuestionPricingRow | null;
  return {
    row,
    amountCents: positiveAmountCents(row?.amount_cents),
    error: null,
  };
}
