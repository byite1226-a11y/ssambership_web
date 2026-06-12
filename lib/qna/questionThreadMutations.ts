import type { SupabaseClient } from "@supabase/supabase-js";
import type { QuestionThreadWorkflowStatus } from "@/lib/qna/questionThreadStatus";

type MutationFail = { ok: false; error: string };
type MutationOk = { ok: true; row: Record<string, unknown> | null };

export async function updateQuestionThreadStatus(
  supabase: SupabaseClient,
  threadId: string,
  status: QuestionThreadWorkflowStatus,
  extra?: Record<string, unknown>
): Promise<MutationOk | MutationFail> {
  const payloads: Record<string, unknown>[] = [
    { status, ...(extra ?? {}), updated_at: new Date().toISOString() },
    { status, ...(extra ?? {}) },
    { status, updated_at: new Date().toISOString() },
    { status },
  ];
  let lastError = "상태를 변경하지 못했습니다.";
  for (const payload of payloads) {
    const { data, error } = await supabase
      .from("question_threads")
      .update(payload)
      .eq("id", threadId)
      .select("*")
      .limit(1)
      .maybeSingle();
    if (!error) {
      return { ok: true, row: (data as Record<string, unknown> | null) ?? null };
    }
    lastError = error.message;
    if (!/column|schema cache|Could not find/i.test(error.message)) {
      return { ok: false, error: error.message };
    }
  }
  return { ok: false, error: lastError };
}
