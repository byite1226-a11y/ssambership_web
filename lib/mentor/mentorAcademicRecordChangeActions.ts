"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/routeGuard";
import { createClient } from "@/lib/supabase/server";
import {
  buildMentorAcademicRecordChangeObjectPath,
  formatStudentIdImageStoredRef,
  safeStudentIdImageFileExtension,
  STUDENT_ID_IMAGES_BUCKET,
} from "@/lib/storage/studentIdImageStorage";
import { validateJpgPngPdfMagicBytes } from "@/lib/storage/uploadMagicBytes";
import { mapDataErrorMessage } from "@/lib/utils/mapDataError";
import { MENTOR_ACADEMIC_RECORD_CHANGE_TABLE } from "@/lib/mentor/mentorAcademicRecordChange";

const PATH = "/mentor/academic-record-change";

function redirectWith(kind: "ok" | "error", message: string): never {
  const q = new URLSearchParams();
  q.set(kind === "ok" ? "ok" : "error", message);
  redirect(`${PATH}?${q.toString()}`);
}

function fileFromForm(formData: FormData): File | null {
  const raw = formData.get("academicRecordDocument");
  return raw instanceof File ? raw : null;
}

export async function submitMentorAcademicRecordChangeAction(formData: FormData) {
  const { user } = await requireRole("mentor");

  const requestedUniversityName = String(formData.get("requestedUniversityName") ?? "").trim();
  const changeReason = String(formData.get("changeReason") ?? "").trim();
  const file = fileFromForm(formData);

  if (!requestedUniversityName) {
    redirectWith("error", "변경하려는 학교명을 입력해 주세요.");
  }
  if (!file || file.size <= 0) {
    redirectWith("error", "학적 변동을 증명할 서류 파일을 선택해 주세요.");
  }
  const extension = safeStudentIdImageFileExtension(file.name);
  if (!extension) {
    redirectWith("error", "JPG, JPEG, PNG, PDF 형식의 서류만 업로드할 수 있습니다.");
  }

  const supabase = await createClient();
  const objectPath = buildMentorAcademicRecordChangeObjectPath(user.id, file.name);
  const storedRef = formatStudentIdImageStoredRef(objectPath);
  const bytes = await file.arrayBuffer();
  const verified = validateJpgPngPdfMagicBytes(bytes, extension);
  if (!verified.ok) {
    redirectWith("error", verified.error);
  }

  const { error: uploadError } = await supabase.storage.from(STUDENT_ID_IMAGES_BUCKET).upload(objectPath, bytes, {
    contentType: verified.file.mimeType,
    cacheControl: "3600",
    upsert: false,
  });
  if (uploadError) {
    redirectWith("error", mapDataErrorMessage(uploadError.message));
  }

  const { error: insertError } = await supabase.from(MENTOR_ACADEMIC_RECORD_CHANGE_TABLE).insert({
    mentor_id: user.id,
    status: "pending",
    requested_university_name: requestedUniversityName,
    change_reason: changeReason || null,
    document_storage_ref: storedRef,
  });

  if (insertError) {
    await supabase.storage.from(STUDENT_ID_IMAGES_BUCKET).remove([objectPath]);
    redirectWith("error", mapDataErrorMessage(insertError.message));
  }

  revalidatePath(PATH);
  redirectWith("ok", "학적변경요청을 제출했습니다. 관리자 확인 후 학교 정보에 반영됩니다.");
}
