import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import {
  MENTOR_ACADEMIC_RECORD_CHANGE_COLUMNS,
  MENTOR_ACADEMIC_RECORD_CHANGE_TABLE,
  type MentorAcademicRecordChangeRow,
} from "@/lib/mentor/mentorAcademicRecordChange";
import { mentorProfilesAdminReadClient } from "@/lib/admin/mentorProfilesAdminRead";

export const ACADEMIC_RECORD_CHANGE_REVIEW_STATUSES = ["pending", "resubmit_required"] as const;

export type MentorAcademicRecordChangeReviewProfile = {
  user_id: string;
  university_name: string | null;
  department_name: string | null;
  verification_status: string | null;
};

export async function loadMentorAcademicRecordChangeReviewRows(
  supabase: SupabaseClient,
  limit = 50
): Promise<{ rows: MentorAcademicRecordChangeRow[]; error: string | null }> {
  const db = mentorProfilesAdminReadClient(supabase);
  const { data, error } = await db
    .from(MENTOR_ACADEMIC_RECORD_CHANGE_TABLE)
    .select(MENTOR_ACADEMIC_RECORD_CHANGE_COLUMNS)
    .in("status", [...ACADEMIC_RECORD_CHANGE_REVIEW_STATUSES])
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    return { rows: [], error: error.message };
  }

  return { rows: (data as unknown as MentorAcademicRecordChangeRow[] | null) ?? [], error: null };
}

export async function fetchAcademicRecordChangeProfilesByIds(
  supabase: SupabaseClient,
  mentorIds: string[]
): Promise<Record<string, MentorAcademicRecordChangeReviewProfile>> {
  const db = mentorProfilesAdminReadClient(supabase);
  const unique = [...new Set(mentorIds.map((id) => id.trim()).filter(Boolean))].slice(0, 100);
  if (!unique.length) return {};

  const { data, error } = await db
    .from("mentor_profiles")
    .select("user_id, university_name, department_name, verification_status")
    .in("user_id", unique);

  if (error || !data) {
    if (error) console.error("[fetchAcademicRecordChangeProfilesByIds]", error.message);
    return {};
  }

  const result: Record<string, MentorAcademicRecordChangeReviewProfile> = {};
  for (const row of data as MentorAcademicRecordChangeReviewProfile[]) {
    if (row.user_id) result[row.user_id] = row;
  }
  return result;
}
