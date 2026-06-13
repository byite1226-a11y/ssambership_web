import type { SupabaseClient } from "@supabase/supabase-js";
import type { ShortformCategorySlug } from "@/lib/community/communityShortformConstants";
import { SHORTFORM_DESC_MAX, SHORTFORM_TAG_MAX, SHORTFORM_TITLE_MAX } from "@/lib/community/communityShortformConstants";

export type InsertShortformInput = {
  title: string;
  category: ShortformCategorySlug;
  videoUrl: string;
  thumbnailUrl: string | null;
  body: string;
  tags: string[];
  source: string;
  status: "draft" | "published";
  authorLabel: string;
};

export async function insertShortformPost(
  supabase: SupabaseClient,
  userId: string,
  input: InsertShortformInput
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const title = input.title.trim().slice(0, SHORTFORM_TITLE_MAX);
  const body = input.body.trim().slice(0, SHORTFORM_DESC_MAX);
  if (!title) return { ok: false, error: "title" };
  if (!input.videoUrl && input.status === "published") return { ok: false, error: "video" };
  const tags = input.tags.slice(0, SHORTFORM_TAG_MAX);

  const payload: Record<string, unknown> = {
    author_id: userId,
    title,
    body,
    category: input.category === "all" ? "study" : input.category,
    source: input.source || null,
    video_url: input.videoUrl,
    thumbnail_url: input.thumbnailUrl,
    tags,
    status: input.status,
    author_role: "mentor",
    author_label: input.authorLabel,
  };

  const { data, error } = await supabase.from("shortform_posts").insert(payload).select("id").maybeSingle();
  if (error) {
    const fb = await supabase
      .from("shortform_posts")
      .insert({
        author_id: userId,
        title,
        body,
        category: input.category === "all" ? "study" : input.category,
        source: input.source || null,
      })
      .select("id")
      .maybeSingle();
    if (fb.error) return { ok: false, error: "db" };
    const id = fb.data && typeof (fb.data as { id: string }).id === "string" ? (fb.data as { id: string }).id : "";
    return id ? { ok: true, id } : { ok: false, error: "db" };
  }
  const id = data && typeof (data as { id: string }).id === "string" ? (data as { id: string }).id : "";
  return id ? { ok: true, id } : { ok: false, error: "db" };
}

export async function updateShortformPost(
  supabase: SupabaseClient,
  userId: string,
  postId: string,
  input: InsertShortformInput
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const title = input.title.trim().slice(0, SHORTFORM_TITLE_MAX);
  const body = input.body.trim().slice(0, SHORTFORM_DESC_MAX);
  if (!title) return { ok: false, error: "title" };
  if (!input.videoUrl && input.status === "published") return { ok: false, error: "video" };
  const tags = input.tags.slice(0, SHORTFORM_TAG_MAX);

  const payload: Record<string, unknown> = {
    title,
    body,
    category: input.category === "all" ? "study" : input.category,
    source: input.source || null,
    video_url: input.videoUrl,
    thumbnail_url: input.thumbnailUrl,
    tags,
    status: input.status,
    author_label: input.authorLabel,
  };

  const { data, error } = await supabase
    .from("shortform_posts")
    .update(payload)
    .eq("id", postId)
    .eq("author_id", userId)
    .select("id")
    .maybeSingle();

  if (error) return { ok: false, error: "db" };
  const id = data && typeof (data as { id: string }).id === "string" ? (data as { id: string }).id : postId;
  return { ok: true, id };
}
