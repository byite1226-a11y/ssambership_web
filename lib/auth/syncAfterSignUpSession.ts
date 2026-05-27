import { createClient } from "@/lib/supabase/client";
import {
  buildStudentIdImageObjectPath,
  formatStudentIdImageStoredRef,
  STUDENT_ID_IMAGES_BUCKET,
} from "@/lib/storage/studentIdImageStorage";
import { mapDataErrorMessage } from "@/lib/utils/mapDataError";
import type { AppRole } from "@/lib/types/user";

type SyncInput = {
  userId: string;
  email: string;
  role: Exclude<AppRole, "admin">;
  fullName: string;
  nickname: string;
  gradeLevel: string;
  studentStatus: string;
  birthDate: string;
  termsAgree: boolean;
  privacyAgree: boolean;
  marketingAgree: boolean;
  universityName: string;
  departmentName: string;
  teachingSubjectsCsv: string;
  highSchoolName: string;
  introLine: string;
  studentIdFile: File | null;
};

type SyncResult = { warningMessages: string[] };

/**
 * signUp 이후 세션이 있을 때: users/mentor upsert(트리거와 맞춤) + (멘토) Storage 업로드 + mentor_profiles URL 갱신
 * 각 단계 try/catch 분리, 실패는 warning으로 누적(가입 자체는 이미 성공)
 */
export async function syncAfterSignUpWithSession(i: SyncInput): Promise<SyncResult> {
  const warnings: string[] = [];
  const supabase = createClient();
  const now = new Date().toISOString();

  const birthDate = i.birthDate?.trim() ? i.birthDate : null;
  try {
    const { error } = await supabase.from("users").upsert(
      {
        id: i.userId,
        email: i.email,
        role: i.role,
        status: "active",
        full_name: i.fullName || null,
        nickname: i.nickname || null,
        grade_level: i.gradeLevel || null,
        student_status: i.studentStatus || null,
        birth_date: birthDate,
        terms_agreed_at: i.termsAgree ? now : null,
        privacy_agreed_at: i.privacyAgree ? now : null,
        marketing_agreed: i.marketingAgree,
        updated_at: now,
      },
      { onConflict: "id" }
    );
    if (error) {
      throw error;
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    warnings.push(`[프로필 저장] ${mapDataErrorMessage(msg)}`);
  }

  if (i.role === "mentor") {
    let subjects: string[] = [];
    if (i.teachingSubjectsCsv.trim().length) {
      subjects = i.teachingSubjectsCsv
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    }
    try {
      const { error } = await supabase.from("mentor_profiles").upsert(
        {
          user_id: i.userId,
          university_name: i.universityName,
          department_name: i.departmentName,
          teaching_subjects: subjects,
          high_school_name: i.highSchoolName,
          intro_line: i.introLine || null,
          verification_status: "pending",
          updated_at: now,
        },
        { onConflict: "user_id" }
      );
      if (error) {
        throw error;
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      warnings.push(`[멘토 프로필] ${mapDataErrorMessage(msg)}`);
    }

    if (i.studentIdFile) {
      const objectPath = buildStudentIdImageObjectPath(i.userId, i.studentIdFile.name);
      const storedRef = formatStudentIdImageStoredRef(objectPath);

      try {
        const { error: upErr } = await supabase.storage
          .from(STUDENT_ID_IMAGES_BUCKET)
          .upload(objectPath, i.studentIdFile, { cacheControl: "3600", upsert: true });
        if (upErr) {
          throw upErr;
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        warnings.push(
          `[학생증 업로드] ${mapDataErrorMessage(msg)} — Storage bucket '${STUDENT_ID_IMAGES_BUCKET}' 생성·정책 확인`
        );
      }

      try {
        const { error: mErr } = await supabase
          .from("mentor_profiles")
          .update({ student_id_image_url: storedRef, updated_at: now })
          .eq("user_id", i.userId);
        if (mErr) {
          throw mErr;
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        warnings.push(`[학생증 경로 반영] ${mapDataErrorMessage(msg)}`);
      }
    }
  }

  return { warningMessages: warnings };
}
