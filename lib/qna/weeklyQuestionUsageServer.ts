import "server-only";

import { createServiceRoleClient } from "@/lib/supabase/admin";
import { fetchWeeklyQuestionUsage } from "@/lib/qna/weeklyQuestionUsage";

export async function fetchWeeklyQuestionUsageServiceRole(
  studentId: string,
  mentorId: string
) {
  try {
    const admin = createServiceRoleClient();
    return fetchWeeklyQuestionUsage(admin, studentId, mentorId);
  } catch (e) {
    const m = e instanceof Error ? e.message : String(e);
    return { usage: null, error: m };
  }
}
