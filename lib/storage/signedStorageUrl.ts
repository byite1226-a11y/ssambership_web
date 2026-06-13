import type { SupabaseClient } from "@supabase/supabase-js";

const DEFAULT_TTL_SEC = 60 * 60 * 24 * 7;

/** 비공개 버킷 업로드 후 서명 URL 발급 (DB에는 장기 TTL URL 저장 — 만료 전 갱신 권장) */
export async function createSignedStorageUrl(
  supabase: SupabaseClient,
  bucket: string,
  path: string,
  expiresInSec = DEFAULT_TTL_SEC
): Promise<{ url: string | null; error: string | null }> {
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, expiresInSec);
  if (error) return { url: null, error: error.message };
  return { url: data?.signedUrl ?? null, error: null };
}
