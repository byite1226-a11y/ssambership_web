"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/routeGuard";
import { createClient } from "@/lib/supabase/server";
import {
  buildMentorSchoolVerificationObjectPath,
  formatStudentIdImageStoredRef,
  STUDENT_ID_IMAGES_BUCKET,
} from "@/lib/storage/studentIdImageStorage";
import { mapDataErrorMessage } from "@/lib/utils/mapDataError";

const PATH = "/mentor/verification";
const ALLOWED_MIME_TYPES = new Set(["application/pdf", "image/jpeg", "image/png", "image/webp", "image/gif"]);

function redirectWith(kind: "ok" | "error", message: string): never {
  const q = new URLSearchParams();
  q.set(kind === "ok" ? "schoolDoc" : "schoolDocError", message);
  redirect(`${PATH}?${q.toString()}`);
}

function fileLooksAllowed(file: File): boolean {
  const mime = file.type.toLowerCase();
  if (ALLOWED_MIME_TYPES.has(mime)) return true;
  if (mime.startsWith("image/")) return true;
  return /\.pdf$/i.test(file.name);
}

function fileFromForm(formData: FormData): File | null {
  const raw = formData.get("schoolVerificationDocument");
  return raw instanceof File ? raw : null;
}

export async function submitMentorSchoolVerificationAction(formData: FormData) {
  const { user } = await requireRole("mentor");
  const file = fileFromForm(formData);

  if (!file || file.size <= 0) {
    redirectWith("error", "학교·전공 증명 서류 파일을 선택해 주세요.");
  }
  if (!fileLooksAllowed(file)) {
    redirectWith("error", "JPG, PNG, PDF 형식의 서류만 업로드할 수 있습니다.");
  }

  const supabase = await createClient();
  const objectPath = buildMentorSchoolVerificationObjectPath(user.id, file.name);
  const storedRef = formatStudentIdImageStoredRef(objectPath);
  const bytes = await file.arrayBuffer();

  const { error: uploadError } = await supabase.storage.from(STUDENT_ID_IMAGES_BUCKET).upload(objectPath, bytes, {
    contentType: file.type || "application/octet-stream",
    cacheControl: "3600",
    upsert: false,
  });
  if (uploadError) {
    redirectWith("error", mapDataErrorMessage(uploadError.message));
  }

  const { error: insertError } = await supabase.from("mentor_school_verifications").insert({
    mentor_id: user.id,
    status: "pending",
    document_storage_ref: storedRef,
  });

  if (insertError) {
    await supabase.storage.from(STUDENT_ID_IMAGES_BUCKET).remove([objectPath]);
    redirectWith("error", mapDataErrorMessage(insertError.message));
  }

  revalidatePath(PATH);
  redirectWith("ok", "학교·전공 증명 서류를 제출했습니다. 관리자 확인 후 인증됩니다.");
}
