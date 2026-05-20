import type { SupabaseClient } from "@supabase/supabase-js";
import { checkReviewEligibility } from "@/lib/reviews/checkReviewEligibility";
import { formatGradeSubject, maskStudentName } from "@/lib/reviews/reviewDisplay";

export type ReviewRow = {
  id: string;
  mentor_id: string;
  student_id: string;
  subscription_count: number;
  rating: number;
  content: string;
  mentor_reply: string | null;
  mentor_replied_at: string | null;
  is_hidden: boolean;
  created_at: string;
};

export type ReviewCardItem = {
  id: string;
  rating: number;
  content: string;
  createdAt: string;
  subscriptionCount: number;
  studentInitial: string;
  studentMaskedName: string;
  gradeSubject: string;
  mentorReply: string | null;
  mentorRepliedAt: string | null;
};

export type ReviewListResult = {
  items: ReviewCardItem[];
  total: number;
  page: number;
  limit: number;
  avgRating: number | null;
  distribution: Record<1 | 2 | 3 | 4 | 5, number>;
};

type UserMini = {
  full_name: string | null;
  nickname: string | null;
  grade_level: string | null;
};

async function loadStudentsMap(
  supabase: SupabaseClient,
  ids: string[]
): Promise<Map<string, UserMini>> {
  const map = new Map<string, UserMini>();
  const unique = [...new Set(ids)].slice(0, 100);
  if (!unique.length) return map;
  const { data } = await supabase.from("users").select("id, full_name, nickname, grade_level").in("id", unique);
  for (const r of data ?? []) {
    const id = String((r as { id?: string }).id ?? "");
    if (!id) continue;
    map.set(id, {
      full_name: (r as UserMini).full_name ?? null,
      nickname: (r as UserMini).nickname ?? null,
      grade_level: (r as UserMini).grade_level ?? null,
    });
  }
  return map;
}

async function mentorFirstSubject(supabase: SupabaseClient, mentorId: string): Promise<string | null> {
  const { data } = await supabase
    .from("mentor_profiles")
    .select("teaching_subjects")
    .eq("user_id", mentorId)
    .maybeSingle();
  const subjects = (data as { teaching_subjects?: string[] | null } | null)?.teaching_subjects;
  if (Array.isArray(subjects) && subjects[0]) return String(subjects[0]);
  return null;
}

function toCard(row: ReviewRow, student: UserMini | undefined, subject: string | null): ReviewCardItem {
  const name = maskStudentName(student?.full_name, student?.nickname);
  const initial = name.replace(/\*/g, "").slice(0, 1) || "학";
  return {
    id: row.id,
    rating: row.rating,
    content: row.content,
    createdAt: row.created_at,
    subscriptionCount: row.subscription_count,
    studentInitial: initial,
    studentMaskedName: name,
    gradeSubject: formatGradeSubject(student?.grade_level, subject),
    mentorReply: row.mentor_reply,
    mentorRepliedAt: row.mentor_replied_at,
  };
}

function buildDistribution(rows: { rating: number }[]): Record<1 | 2 | 3 | 4 | 5, number> {
  const d: Record<1 | 2 | 3 | 4 | 5, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const r of rows) {
    const k = Math.max(1, Math.min(5, Math.round(r.rating))) as 1 | 2 | 3 | 4 | 5;
    d[k] += 1;
  }
  return d;
}

export async function listMentorReviews(
  supabase: SupabaseClient,
  mentorId: string,
  opts: { page?: number; limit?: number; includeHidden?: boolean }
): Promise<ReviewListResult> {
  const page = Math.max(1, opts.page ?? 1);
  const limit = Math.min(50, Math.max(1, opts.limit ?? 10));
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let q = supabase
    .from("reviews")
    .select("*", { count: "exact" })
    .eq("mentor_id", mentorId)
    .order("created_at", { ascending: false });

  if (!opts.includeHidden) {
    q = q.eq("is_hidden", false);
  }

  const { data, count, error } = await q.range(from, to);
  if (error) {
    return {
      items: [],
      total: 0,
      page,
      limit,
      avgRating: null,
      distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    };
  }

  const rows = (data ?? []) as ReviewRow[];
  const studentIds = rows.map((r) => r.student_id);
  const [students, subject] = await Promise.all([
    loadStudentsMap(supabase, studentIds),
    mentorFirstSubject(supabase, mentorId),
  ]);

  const { data: allRatings } = await supabase
    .from("reviews")
    .select("rating")
    .eq("mentor_id", mentorId)
    .eq("is_hidden", false)
    .limit(500);

  const ratingRows = (allRatings ?? []) as { rating: number }[];
  const total = count ?? rows.length;
  const avgRating =
    ratingRows.length > 0
      ? Math.round((ratingRows.reduce((a, r) => a + r.rating, 0) / ratingRows.length) * 10) / 10
      : null;

  return {
    items: rows.map((r) => toCard(r, students.get(r.student_id), subject)),
    total,
    page,
    limit,
    avgRating,
    distribution: buildDistribution(ratingRows),
  };
}

export async function createReview(
  supabase: SupabaseClient,
  studentId: string,
  input: { mentorId: string; rating: number; content: string }
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const eligibility = await checkReviewEligibility(supabase, studentId, input.mentorId);
  if (!eligibility.eligible) {
    return { ok: false, error: eligibility.reason };
  }

  const rating = Math.round(input.rating);
  if (rating < 1 || rating > 5) {
    return { ok: false, error: "별점은 1~5점 사이로 선택해 주세요." };
  }

  const content = input.content.trim();
  if (content.length < 20) {
    return { ok: false, error: "리뷰는 최소 20자 이상 작성해 주세요." };
  }
  if (content.length > 500) {
    return { ok: false, error: "리뷰는 최대 500자까지 작성할 수 있습니다." };
  }

  const { data, error } = await supabase
    .from("reviews")
    .insert({
      mentor_id: input.mentorId,
      student_id: studentId,
      subscription_count: eligibility.subscriptionCount,
      rating,
      content,
    })
    .select("id")
    .single();

  if (error) {
    if (/unique|duplicate/i.test(error.message)) {
      return { ok: false, error: "이미 리뷰를 작성했습니다." };
    }
    return { ok: false, error: "리뷰 저장에 실패했습니다." };
  }

  return { ok: true, id: String((data as { id: string }).id) };
}

export async function replyToReview(
  supabase: SupabaseClient,
  mentorId: string,
  reviewId: string,
  reply: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const body = reply.trim();
  if (body.length < 2) {
    return { ok: false, error: "답글을 입력해 주세요." };
  }
  if (body.length > 500) {
    return { ok: false, error: "답글은 최대 500자까지 작성할 수 있습니다." };
  }

  const { data: row, error: fetchErr } = await supabase
    .from("reviews")
    .select("id, mentor_id, mentor_reply")
    .eq("id", reviewId)
    .maybeSingle();

  if (fetchErr || !row) {
    return { ok: false, error: "리뷰를 찾을 수 없습니다." };
  }

  const r = row as { mentor_id: string; mentor_reply: string | null };
  if (r.mentor_id !== mentorId) {
    return { ok: false, error: "본인에게 달린 리뷰에만 답글할 수 있습니다." };
  }
  if (r.mentor_reply?.trim()) {
    return { ok: false, error: "답글은 1회만 작성할 수 있습니다." };
  }

  const { error } = await supabase
    .from("reviews")
    .update({ mentor_reply: body, mentor_replied_at: new Date().toISOString() })
    .eq("id", reviewId)
    .eq("mentor_id", mentorId);

  if (error) {
    return { ok: false, error: "답글 저장에 실패했습니다." };
  }
  return { ok: true };
}

export async function hideReview(
  supabase: SupabaseClient,
  reviewId: string,
  hidden: boolean
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { error } = await supabase.from("reviews").update({ is_hidden: hidden }).eq("id", reviewId);
  if (error) {
    return { ok: false, error: "처리에 실패했습니다." };
  }
  return { ok: true };
}

export async function listMentorReceivedReviews(
  supabase: SupabaseClient,
  mentorId: string,
  limit = 50
): Promise<ReviewCardItem[]> {
  const { data, error } = await supabase
    .from("reviews")
    .select("*")
    .eq("mentor_id", mentorId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !data) return [];

  const rows = data as ReviewRow[];
  const students = await loadStudentsMap(
    supabase,
    rows.map((r) => r.student_id)
  );
  const subject = await mentorFirstSubject(supabase, mentorId);
  return rows.map((r) => toCard(r, students.get(r.student_id), subject));
}
