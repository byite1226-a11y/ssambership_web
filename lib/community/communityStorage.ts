import type { SupabaseClient } from "@supabase/supabase-js";
import { randomUUID } from "crypto";

import { createSignedStorageUrl } from "@/lib/storage/signedStorageUrl";
import { validateMagicBytesForMime } from "@/lib/storage/uploadMagicBytes";

export const COMMUNITY_POST_IMAGES_BUCKET = "community-post-images";

const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

export function buildCommunityImageObjectPath(userId: string, mime: string, originalName: string): string {
  const ext =
    mime === "image/png"
      ? "png"
      : mime === "image/webp"
        ? "webp"
        : mime === "image/gif"
          ? "gif"
          : "jpg";
  const safe = originalName.replace(/[^\w.\-]+/g, "_").slice(0, 40);
  return `${userId}/${randomUUID()}-${safe || "image"}.${ext}`;
}

export async function uploadCommunityPostImages(
  supabase: SupabaseClient,
  userId: string,
  files: { buffer: Buffer; mime: string; name: string }[]
): Promise<{ urls: string[]; error: string | null }> {
  const urls: string[] = [];
  for (const file of files) {
    if (!ALLOWED.has(file.mime)) {
      return { urls: [], error: "\uC9C0\uC6D0\uD558\uC9C0 \uC54A\uB294 \uC774\uBBF8\uC9C0 \uD615\uC2DD\uC785\uB2C8\uB2E4." };
    }
    if (file.buffer.length > 5 * 1024 * 1024) {
      return { urls: [], error: "\uC774\uBBF8\uC9C0\uB294 \uC7A5\uB2F9 5MB \uC774\uD558\uB85C \uC62C\uB824\uC8FC\uC138\uC694." };
    }
    const magicError = validateMagicBytesForMime(file.buffer, file.mime);
    if (magicError) {
      return { urls: [], error: magicError };
    }
    const path = buildCommunityImageObjectPath(userId, file.mime, file.name);
    const { error } = await supabase.storage.from(COMMUNITY_POST_IMAGES_BUCKET).upload(path, file.buffer, {
      contentType: file.mime,
      upsert: false,
    });
    if (error) return { urls: [], error: error.message };
    const signed = await createSignedStorageUrl(supabase, COMMUNITY_POST_IMAGES_BUCKET, path);
    if (signed.error) return { urls: [], error: signed.error };
    if (signed.url) urls.push(signed.url);
  }
  return { urls, error: null };
}
