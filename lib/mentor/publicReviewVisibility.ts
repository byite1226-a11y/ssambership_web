import type { SupabaseClient } from "@supabase/supabase-js";
import { pickExistingColumn } from "@/lib/qna/safeSelect";

/** 033 등으로 추가된 공개 제외 플래그 컬럼(있을 때만 .eq 로 필터 — 컬럼 없으면 쿼리 변경 없음) */
export type PublicReviewVisibilityColumns = {
  isHidden: string | null;
  isBlinded: string | null;
};

export async function probePublicReviewVisibilityColumns(
  supabase: SupabaseClient,
  table: string
): Promise<PublicReviewVisibilityColumns> {
  const { column: isHidden } = await pickExistingColumn(supabase, table, ["is_hidden", "hidden"]);
  const { column: isBlinded } = await pickExistingColumn(supabase, table, ["is_blinded", "is_blind"]);
  return { isHidden, isBlinded };
}
