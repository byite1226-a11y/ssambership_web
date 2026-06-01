import type { SupabaseClient } from "@supabase/supabase-js";
import type { ShortformCategorySlug } from "@/lib/community/communityShortformConstants";
import { pickAuthorRoleSummary, pickTitle } from "@/lib/community/communityQueries";

type Row = Record<string, unknown>;

export type ShortformCard = {
  id: string;
  title: string;
  authorLabel: string;
  authorRole: string | null;
  category: string | null;
  thumbnailUrl: string | null;
  videoUrl: string | null;
  description: string;
  tags: string[];
  viewCount: number;
  likeCount: number;
  createdAtLabel: string;
};

function pickAuthorLabel(row: Row): string {
  for (const k of ["author_label", "author_name", "nickname"] as const) {
    const v = row[k];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return pickAuthorRoleSummary(row) === "\uBA58\uD1A0" ? "\uC37C\uBC84\uC2ED \uBA58\uD1A0" : "\uC37C\uBC84\uC2ED \uD68C\uC6D0";
}

function pickThumb(row: Row): string | null {
  for (const k of ["thumbnail_url", "thumbnailUrl", "cover_url"] as const) {
    const v = row[k];
    if (typeof v === "string" && v.startsWith("http")) return v;
  }
  return null;
}

function pickVideo(row: Row): string | null {
  for (const k of ["video_url", "videoUrl", "source_url", "source"] as const) {
    const v = row[k];
    if (typeof v === "string" && v.startsWith("http")) return v;
  }
  return null;
}

function relTime(iso: string): string {
  try {
    const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
    if (m < 60) return `${m}\uBD84 \uC804`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}\uC2DC\uAC04 \uC804`;
    return new Date(iso).toLocaleDateString("ko-KR");
  } catch {
    return "";
  }
}

export function mapShortformRow(row: Row): ShortformCard {
  const created = typeof row.created_at === "string" ? row.created_at : new Date().toISOString();
  const tags = Array.isArray(row.tags) ? row.tags.map(String).filter(Boolean) : [];
  return {
    id: String(row.id ?? ""),
    title: pickTitle(row),
    authorLabel: pickAuthorLabel(row),
    authorRole: pickAuthorRoleSummary(row),
    category: typeof row.category === "string" ? row.category : null,
    thumbnailUrl: pickThumb(row),
    videoUrl: pickVideo(row),
    description: typeof row.body === "string" ? row.body : "",
    tags,
    viewCount: typeof row.view_count === "number" ? row.view_count : 0,
    likeCount: typeof row.like_count === "number" ? row.like_count : 0,
    createdAtLabel: relTime(created),
  };
}

export async function listShortformFeed(
  supabase: SupabaseClient,
  opts: { category?: ShortformCategorySlug; limit?: number }
): Promise<{ items: ShortformCard[]; error: string | null }> {
  const limit = opts.limit ?? 40;
  let q = supabase.from("shortform_posts").select("*").order("created_at", { ascending: false }).limit(limit);
  if (opts.category && opts.category !== "all") q = q.eq("category", opts.category);
  const { data, error } = await q;
  if (error) {
    const fb = await supabase.from("shortform_posts").select("*").order("created_at", { ascending: false }).limit(limit);
    if (fb.error) return { items: [], error: fb.error.message };
    return { items: ((fb.data as Row[]) ?? []).map(mapShortformRow), error: null };
  }
  const rows = (data as Row[]) ?? [];
  const published = rows.filter((r) => !r.status || r.status === "published");
  return { items: published.map(mapShortformRow), error: null };
}

export async function getShortformDetail(
  supabase: SupabaseClient,
  id: string
): Promise<{ item: ShortformCard | null; row: Row | null; error: string | null }> {
  const { data, error } = await supabase.from("shortform_posts").select("*").eq("id", id).maybeSingle();
  if (error) return { item: null, row: null, error: error.message };
  if (!data) return { item: null, row: null, error: null };
  const row = data as Row;
  if (row.status === "hidden") return { item: null, row, error: null };
  return { item: mapShortformRow(row), row, error: null };
}

export async function incrementShortformView(supabase: SupabaseClient, id: string): Promise<void> {
  await supabase.rpc("increment_shortform_post_view", { p_post_id: id });
}
