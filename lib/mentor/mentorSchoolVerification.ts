import type { SupabaseClient } from "@supabase/supabase-js";

export type MentorSchoolVerificationStatus = "pending" | "approved" | "rejected" | "resubmit_required";

export type MentorSchoolVerificationRow = {
  id: string;
  mentor_id: string;
  status: MentorSchoolVerificationStatus;
  verified_university_name: string | null;
  verified_university_id: string | null;
  verified_major_category: string | null;
  verified_department_name: string | null;
  school_tier: string | null;
  document_storage_ref: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  reject_reason: string | null;
  created_at: string;
  updated_at: string;
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

export async function fetchLatestMentorSchoolVerification(
  supabase: SupabaseClient,
  mentorId: string
): Promise<{ row: MentorSchoolVerificationRow | null; error: string | null }> {
  const { data, error } = await supabase
    .from("mentor_school_verifications")
    .select(SCHOOL_VERIFICATION_COLUMNS)
    .eq("mentor_id", mentorId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    return { row: null, error: error.message };
  }

  return { row: (data as MentorSchoolVerificationRow | null) ?? null, error: null };
}
