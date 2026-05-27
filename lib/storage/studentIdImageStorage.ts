import type { SupabaseClient } from "@supabase/supabase-js";
import { createSignedStorageUrl } from "@/lib/storage/signedStorageUrl";

export const STUDENT_ID_IMAGES_BUCKET = "student-id-images" as const;
export const STUDENT_ID_IMAGE_SIGNED_URL_TTL_SEC = 300;

/** DB `mentor_profiles.student_id_image_url` 에 저장할 값 (버킷/경로만, 공개 URL 아님) */
export function formatStudentIdImageStoredRef(objectPath: string): string {
  const p = objectPath.replace(/^\/+/, "");
  if (p.startsWith(`${STUDENT_ID_IMAGES_BUCKET}/`)) {
    return p;
  }
  return `${STUDENT_ID_IMAGES_BUCKET}/${p}`;
}

/** 업로드 객체 경로: `{userId}/{filename}` */
export function buildStudentIdImageObjectPath(userId: string, fileName: string): string {
  const safeName = fileName.replace(/[^\w.가-힣-]+/g, "_");
  return `${userId}/${Date.now()}-${safeName}`;
}

/**
 * 저장값(경로 또는 레거시 public URL) → 버킷·객체 경로.
 * 레거시 URL은 `.../student-id-images/{path}` 패턴만 복원한다.
 */
export function parseStudentIdImageStorageRef(
  stored: string | null | undefined
): { bucket: string; path: string } | null {
  const raw = typeof stored === "string" ? stored.trim() : "";
  if (!raw) return null;

  if (raw.startsWith("http://") || raw.startsWith("https://")) {
    const marker = `/${STUDENT_ID_IMAGES_BUCKET}/`;
    const idx = raw.indexOf(marker);
    if (idx < 0) return null;
    const path = raw.slice(idx + marker.length).split("?")[0]?.split("#")[0]?.trim() ?? "";
    return path ? { bucket: STUDENT_ID_IMAGES_BUCKET, path } : null;
  }

  if (raw.startsWith(`${STUDENT_ID_IMAGES_BUCKET}/`)) {
    const path = raw.slice(STUDENT_ID_IMAGES_BUCKET.length + 1).replace(/^\/+/, "");
    return path ? { bucket: STUDENT_ID_IMAGES_BUCKET, path } : null;
  }

  if (raw.includes("/")) {
    return { bucket: STUDENT_ID_IMAGES_BUCKET, path: raw.replace(/^\/+/, "") };
  }

  return null;
}

/** 관리자 조회: 저장 path 기준 단기 signed URL (기본 300초) */
export async function resolveStudentIdImageSignedUrl(
  supabase: SupabaseClient,
  stored: string | null | undefined,
  expiresInSec = STUDENT_ID_IMAGE_SIGNED_URL_TTL_SEC
): Promise<string | null> {
  const ref = parseStudentIdImageStorageRef(stored);
  if (!ref) return null;
  const { url, error } = await createSignedStorageUrl(supabase, ref.bucket, ref.path, expiresInSec);
  if (error) {
    console.error("[resolveStudentIdImageSignedUrl]", error);
    return null;
  }
  return url;
}
