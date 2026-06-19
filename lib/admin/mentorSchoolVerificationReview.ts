import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { MentorSchoolVerificationRow } from "@/lib/mentor/mentorSchoolVerification";
import { SCHOOL_VERIFICATION_REVIEW_STATUSES } from "@/lib/mentor/schoolVerificationConstants";
import { mentorProfilesAdminReadClient } from "@/lib/admin/mentorProfilesAdminRead";

export type MentorSchoolVerificationReviewProfile = {
  user_id: string;
  university_name: string | null;
  department_name: string | null;
  verification_status: string | null;
  created_at: string | null;
  updated_at: string | null;
};

const SCHOOL_VERIFICATION_COLUMNS = [
  "id",
  "mentor_id",
  "status",
  "verified_university_name",
  "verified_university_id",
  "verified_major_category",
  "verified_department_name",
  "school_tier",
  "document_storage_ref",
  "reviewed_by",
  "reviewed_at",
  "reject_reason",
  "created_at",
  "updated_at",
].join(", ");

export async function loadMentorSchoolVerificationReviewRows(
  supabase: SupabaseClient,
  limit = 50
): Promise<{ rows: MentorSchoolVerificationRow[]; error: string | null }> {
  const db = mentorProfilesAdminReadClient(supabase);
  const { data, error } = await db
    .from("mentor_school_verifications")
    .select(SCHOOL_VERIFICATION_COLUMNS)
    .in("status", [...SCHOOL_VERIFICATION_REVIEW_STATUSES])
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    return { rows: [], error: error.message };
  }

  return { rows: (data as unknown as MentorSchoolVerificationRow[] | null) ?? [], error: null };
}

export async function fetchMentorSchoolVerificationProfilesByIds(
  supabase: SupabaseClient,
  mentorIds: string[]
): Promise<Record<string, MentorSchoolVerificationReviewProfile>> {
  const db = mentorProfilesAdminReadClient(supabase);
  const unique = [...new Set(mentorIds.map((id) => id.trim()).filter(Boolean))].slice(0, 100);
  if (!unique.length) return {};

  const { data, error } = await db
    .from("mentor_profiles")
    .select("user_id, university_name, department_name, verification_status, created_at, updated_at")
    .in("user_id", unique);

  if (error || !data) {
    if (error) console.error("[fetchMentorSchoolVerificationProfilesByIds]", error.message);
    return {};
  }

  const result: Record<string, MentorSchoolVerificationReviewProfile> = {};
  for (const row of data as MentorSchoolVerificationReviewProfile[]) {
    if (row.user_id) result[row.user_id] = row;
  }
  return result;
}
