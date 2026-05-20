import type { SupabaseClient } from "@supabase/supabase-js";
import type { ShortformCategorySlug } from "@/lib/community/communityShortformConstants";
import { SHORTFORM_DESC_MAX, SHORTFORM_TAG_MAX, SHORTFORM_TITLE_MAX } from "@/lib/community/communityShortformConstants";

export type InsertShortformInput = {
  title: string;
  category: ShortformCategorySlug;
  videoUrl: string;
  thumbnailUrl: string | null;
  description: string;
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
  const description = input.description.trim().slice(0, SHORTFORM_DESC_MAX);
  if (!title) return { ok: false, error: "title" };
  if (!input.videoUrl && input.status === "published") return { ok: false, error: "video" };
  const tags = input.tags.slice(0, SHORTFORM_TAG_MAX);

  const payload: Record<string, unknown> = {
    author_id: userId,
    creator_id: userId,
    title,
    body: description,
    description,
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
        body: description,
        category: input.category,
        source: input.source,
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
