import type { SupabaseClient } from "@supabase/supabase-js";
import type { ShortformCategorySlug } from "@/lib/community/communityShortformConstants";
import {
  collectAuthorIdsNeedingLookup,
  fetchCommunityAuthorNamesByIds,
  resolveCommunityAuthorLabel,
  type CommunityAuthorNameRow,
} from "@/lib/community/communityAuthorLabels";
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

async function shortformAuthorNameMap(
  supabase: SupabaseClient,
  rows: Row[]
): Promise<Map<string, CommunityAuthorNameRow>> {
  return fetchCommunityAuthorNamesByIds(supabase, collectAuthorIdsNeedingLookup(rows));
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
    if (m < 60) return `${m}분 전`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}시간 전`;
    return new Date(iso).toLocaleDateString("ko-KR");
  } catch {
    return "";
  }
}

export function mapShortformRow(row: Row, userMap?: Map<string, CommunityAuthorNameRow>): ShortformCard {
  const created = typeof row.created_at === "string" ? row.created_at : new Date().toISOString();
  const tags = Array.isArray(row.tags) ? row.tags.map(String).filter(Boolean) : [];
  const authorId = typeof row.author_id === "string" ? row.author_id : null;
  const user = authorId && userMap ? userMap.get(authorId) : undefined;
  return {
    id: String(row.id ?? ""),
    title: pickTitle(row),
    authorLabel: resolveCommunityAuthorLabel(row, user),
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

export type ShortformFeedSort = "all" | "latest" | "popular";

function buildShortformFeedQuery(
  supabase: SupabaseClient,
  opts: { category?: ShortformCategorySlug; limit: number; sort: ShortformFeedSort }
) {
  let q =
    opts.sort === "popular"
      ? supabase
          .from("shortform_posts")
          .select("*")
          .order("like_count", { ascending: false })
          .order("view_count", { ascending: false })
      : supabase.from("shortform_posts").select("*").order("created_at", { ascending: false });
  q = q.limit(opts.limit);
  if (opts.category && opts.category !== "all") q = q.eq("category", opts.category);
  return q;
}

export async function listShortformFeed(
  supabase: SupabaseClient,
  opts: { category?: ShortformCategorySlug; limit?: number; sort?: ShortformFeedSort }
): Promise<{ items: ShortformCard[]; error: string | null }> {
  const limit = opts.limit ?? 40;
  const sort = opts.sort ?? "all";
  const q = buildShortformFeedQuery(supabase, { category: opts.category, limit, sort });
  const { data, error } = await q;
  if (error) {
    const fb = await buildShortformFeedQuery(supabase, { limit, sort });
    if (fb.error) return { items: [], error: fb.error.message };
    const fbRows = (fb.data as Row[]) ?? [];
    const userMap = await shortformAuthorNameMap(supabase, fbRows);
    return { items: fbRows.map((r) => mapShortformRow(r, userMap)), error: null };
  }
  const rows = (data as Row[]) ?? [];
  const published = rows.filter((r) => !r.status || r.status === "published");
  const userMap = await shortformAuthorNameMap(supabase, published);
  return { items: published.map((r) => mapShortformRow(r, userMap)), error: null };
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
  const userMap = await shortformAuthorNameMap(supabase, [row]);
  return { item: mapShortformRow(row, userMap), row, error: null };
}

export type ShortformDraftRow = {
  id: string;
  title: string;
  body: string;
  category: string;
  videoUrl: string;
  source: string;
};

export async function getShortformDraft(
  supabase: SupabaseClient,
  userId: string,
  draftId: string
): Promise<{ draft: ShortformDraftRow | null; error: string | null }> {
  const { data, error } = await supabase
    .from("shortform_posts")
    .select("id, title, body, category, video_url, source, status, author_id")
    .eq("id", draftId)
    .eq("author_id", userId)
    .eq("status", "draft")
    .maybeSingle();
  if (error) return { draft: null, error: error.message };
  if (!data) return { draft: null, error: null };
  const row = data as Row;
  return {
    draft: {
      id: String(row.id ?? ""),
      title: typeof row.title === "string" ? row.title : "",
      body: typeof row.body === "string" ? row.body : "",
      category: typeof row.category === "string" ? row.category : "study",
      videoUrl: typeof row.video_url === "string" ? row.video_url : "",
      source: typeof row.source === "string" ? row.source : "",
    },
    error: null,
  };
}

export async function incrementShortformView(supabase: SupabaseClient, id: string): Promise<void> {
  await supabase.rpc("increment_shortform_post_view", { p_post_id: id });
}
