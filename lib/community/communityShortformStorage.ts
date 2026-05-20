import type { SupabaseClient } from "@supabase/supabase-js";
import { randomUUID } from "crypto";
import {
  SHORTFORM_THUMB_BUCKET,
  SHORTFORM_VIDEO_BUCKET,
  SHORTFORM_VIDEO_MAX_BYTES,
} from "@/lib/community/communityShortformConstants";

export async function uploadShortformVideo(
  supabase: SupabaseClient,
  userId: string,
  buffer: Buffer,
  mime: string
): Promise<{ url: string | null; error: string | null }> {
  if (buffer.length > SHORTFORM_VIDEO_MAX_BYTES) {
    return { url: null, error: "size" };
  }
  const ext = mime.includes("quicktime") ? "mov" : mime.includes("webm") ? "webm" : "mp4";
  const path = `${userId}/${randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from(SHORTFORM_VIDEO_BUCKET).upload(path, buffer, {
    contentType: mime,
    upsert: false,
  });
  if (error) return { url: null, error: error.message };
  const { data } = supabase.storage.from(SHORTFORM_VIDEO_BUCKET).getPublicUrl(path);
  return { url: data.publicUrl ?? null, error: null };
}

export async function uploadShortformThumbnail(
  supabase: SupabaseClient,
  userId: string,
  buffer: Buffer,
  mime: string
): Promise<{ url: string | null; error: string | null }> {
  const ext = mime.includes("png") ? "png" : mime.includes("webp") ? "webp" : "jpg";
  const path = `${userId}/${randomUUID()}-thumb.${ext}`;
  const { error } = await supabase.storage.from(SHORTFORM_THUMB_BUCKET).upload(path, buffer, {
    contentType: mime,
    upsert: false,
  });
  if (error) return { url: null, error: error.message };
  const { data } = supabase.storage.from(SHORTFORM_THUMB_BUCKET).getPublicUrl(path);
  return { url: data.publicUrl ?? null, error: null };
}
