import type { SupabaseClient } from "@supabase/supabase-js";
import {
  COMMUNITY_POST_CATEGORIES,
  COMMUNITY_POST_PAGE_SIZE,
  type CommunityPostCategorySlug,
} from "@/lib/community/communityBoardConstants";
import { pickAuthorRoleSummary, pickExcerpt, pickTitle } from "@/lib/community/communityQueries";

type Row = Record<string, unknown>;

export type CommunityBoardPostCard = {
  id: string;
  title: string;
  excerpt: string;
  category: string | null;
  categoryLabel: string;
  authorId: string | null;
  authorLabel: string;
  authorRole: string | null;
  imageUrls: string[];
  hashtags: string[];
  viewCount: number;
  likeCount: number;
  commentCount: number;
  createdAt: string;
  createdAtLabel: string;
};

export type CommunityHashtagRow = { tag: string; count: number };

export type CommunityBoardCommentNode = {
  id: string;
  postId: string;
  parentId: string | null;
  content: string;
  likeCount: number;
  authorId: string;
  authorLabel: string;
  createdAt: string;
  createdAtLabel: string;
  isOwn: boolean;
  replies: CommunityBoardCommentNode[];
};

function categoryLabel(slug: string | null): string {
  if (!slug || !slug.trim()) {
    return COMMUNITY_POST_CATEGORIES.find((c) => c.slug === "free")?.label ?? "\uC790\uC720";
  }
  const hit = COMMUNITY_POST_CATEGORIES.find((c) => c.slug === slug);
  if (hit) return hit.label;
  return slug;
}

function pickBody(row: Row): string {
  for (const k of ["content", "body", "text"] as const) {
    if (typeof row[k] === "string" && row[k].trim()) return row[k] as string;
  }
  return "";
}

function pickAuthorLabel(row: Row): string {
  for (const k of ["author_label", "author_name", "nickname", "display_name"] as const) {
    const v = row[k];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  const role = pickAuthorRoleSummary(row);
  if (role === "\uBA58\uD1A0") return "\uC37C\uBC84\uC2ED \uBA58\uD1A0";
  return "\uC37C\uBC84\uC2ED \uD68C\uC6D0";
}

function pickImageUrls(row: Row): string[] {
  const v = row.image_urls;
  if (Array.isArray(v)) {
    return v.filter((u): u is string => typeof u === "string" && u.trim().toLowerCase().startsWith("http")).slice(0, 5);
  }
  const single = row.image_url ?? row.thumbnail_url;
  if (typeof single === "string" && single.trim().startsWith("http")) return [single.trim()];
  return [];
}

function pickHashtags(row: Row): string[] {
  const v = row.hashtags;
  if (Array.isArray(v)) return v.map(String).filter(Boolean).slice(0, 8);
  return [];
}

function formatRelativeTime(iso: string): string {
  try {
    const d = new Date(iso);
    const diff = Date.now() - d.getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return "\uBC29\uAE08";
    if (m < 60) return `${m}\uBD84 \uC804`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}\uC2DC\uAC04 \uC804`;
    const day = Math.floor(h / 24);
    if (day < 7) return `${day}\uC77C \uC804`;
    return d.toLocaleDateString("ko-KR", { month: "short", day: "numeric" });
  } catch {
    return "";
  }
}

export function mapRowToBoardCard(row: Row, viewerId?: string | null): CommunityBoardPostCard {
  const id = String(row.id ?? "");
  const createdAt =
    typeof row.created_at === "string" ? row.created_at : new Date().toISOString();
  const cat = typeof row.category === "string" ? row.category : null;
  return {
    id,
    title: pickTitle(row),
    excerpt: pickExcerpt(row) || pickBody(row).slice(0, 120),
    category: cat,
    categoryLabel: categoryLabel(cat),
    authorId: typeof row.author_id === "string" ? row.author_id : null,
    authorLabel: pickAuthorLabel(row),
    authorRole: pickAuthorRoleSummary(row),
    imageUrls: pickImageUrls(row),
    hashtags: pickHashtags(row),
    viewCount: typeof row.view_count === "number" ? row.view_count : 0,
    likeCount: typeof row.like_count === "number" ? row.like_count : 0,
    commentCount: typeof row.comment_count === "number" ? row.comment_count : 0,
    createdAt,
    createdAtLabel: formatRelativeTime(createdAt),
  };
}

function applyBoardCategoryFilter<T extends { eq: (col: string, val: string) => T; or: (filters: string) => T }>(
  q: T,
  category: CommunityPostCategorySlug
): T {
  if (category === "free") {
    return q.or("category.eq.free,category.is.null,category.eq.");
  }
  return q.eq("category", category);
}

export async function listCommunityBoardPosts(
  supabase: SupabaseClient,
  opts: {
    category?: CommunityPostCategorySlug;
    cursor?: string | null;
    limit?: number;
    authorId?: string | null;
    status?: "published" | "draft";
  }
): Promise<{ posts: CommunityBoardPostCard[]; nextCursor: string | null; error: string | null }> {
  const limit = opts.limit ?? COMMUNITY_POST_PAGE_SIZE;
  let q = supabase
    .from("community_posts")
    .select("*")
    .eq("status", opts.status ?? "published")
    .order("created_at", { ascending: false })
    .limit(limit + 1);

  if (opts.category && opts.category !== "all") {
    q = applyBoardCategoryFilter(q, opts.category);
  }
  if (opts.authorId) {
    q = q.eq("author_id", opts.authorId);
  }
  if (opts.cursor) {
    q = q.lt("created_at", opts.cursor);
  }

  const { data, error } = await q;
  if (error) {
    if (/relation|does not exist|column|status/i.test(error.message)) {
      return listCommunityBoardPostsLegacy(supabase, opts);
    }
    return { posts: [], nextCursor: null, error: error.message };
  }

  const rows = (data as Row[]) ?? [];
  const hasMore = rows.length > limit;
  const slice = hasMore ? rows.slice(0, limit) : rows;
  const posts = slice.map((r) => mapRowToBoardCard(r));
  const nextCursor = hasMore && slice.length ? String(slice[slice.length - 1].created_at ?? "") : null;
  return { posts, nextCursor: nextCursor || null, error: null };
}

async function listCommunityBoardPostsLegacy(
  supabase: SupabaseClient,
  opts: {
    category?: CommunityPostCategorySlug;
    cursor?: string | null;
    limit?: number;
    authorId?: string | null;
  }
): Promise<{ posts: CommunityBoardPostCard[]; nextCursor: string | null; error: string | null }> {
  const limit = opts.limit ?? COMMUNITY_POST_PAGE_SIZE;
  let q = supabase.from("community_posts").select("*").order("created_at", { ascending: false }).limit(limit + 1);
  if (opts.category && opts.category !== "all") q = applyBoardCategoryFilter(q, opts.category);
  if (opts.authorId) q = q.eq("author_id", opts.authorId);
  if (opts.cursor) q = q.lt("created_at", opts.cursor);
  const { data, error } = await q;
  if (error) return { posts: [], nextCursor: null, error: error.message };
  const rows = (data as Row[]) ?? [];
  const hasMore = rows.length > limit;
  const slice = hasMore ? rows.slice(0, limit) : rows;
  const posts = slice.map((r) => mapRowToBoardCard(r));
  const nextCursor = hasMore && slice.length ? String(slice[slice.length - 1].created_at ?? "") : null;
  return { posts, nextCursor: nextCursor || null, error: null };
}

export async function getCommunityBoardPost(
  supabase: SupabaseClient,
  id: string
): Promise<{ post: CommunityBoardPostCard | null; row: Row | null; error: string | null }> {
  const { data, error } = await supabase.from("community_posts").select("*").eq("id", id).maybeSingle();
  if (error) return { post: null, row: null, error: error.message };
  if (!data) return { post: null, row: null, error: null };
  const row = data as Row;
  const status = typeof row.status === "string" ? row.status : "published";
  if (status === "hidden") {
    return { post: null, row, error: null };
  }
  if (status === "draft") {
    return { post: null, row, error: null };
  }
  return { post: mapRowToBoardCard(row), row, error: null };
}

export async function listPopularHashtags(
  supabase: SupabaseClient,
  limit: number
): Promise<{ rows: CommunityHashtagRow[]; error: string | null }> {
  const { data, error } = await supabase
    .from("community_hashtags")
    .select("tag, count")
    .order("count", { ascending: false })
    .limit(limit);
  if (error) {
    if (/relation|does not exist/i.test(error.message)) {
      return { rows: [], error: null };
    }
    return { rows: [], error: error.message };
  }
  const rows = ((data as { tag: string; count: number }[]) ?? []).map((r) => ({
    tag: r.tag,
    count: r.count ?? 0,
  }));
  return { rows, error: null };
}

export async function loadBoardComments(
  supabase: SupabaseClient,
  postId: string,
  viewerId: string | null
): Promise<{ nodes: CommunityBoardCommentNode[]; error: string | null }> {
  const { data, error } = await supabase
    .from("comments")
    .select("id, post_id, parent_id, content, like_count, author_id, author_label, created_at, is_deleted")
    .eq("post_id", postId)
    .eq("is_deleted", false)
    .order("created_at", { ascending: true });

  if (error) {
    if (/relation|does not exist/i.test(error.message)) return { nodes: [], error: null };
    return { nodes: [], error: "\uB313\uAE00\uC744 \uBD88\uB7EC\uC624\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4." };
  }

  const flat = ((data as Record<string, unknown>[]) ?? []).map((r) => {
    const createdAt = typeof r.created_at === "string" ? r.created_at : new Date().toISOString();
    const authorId = String(r.author_id ?? "");
    return {
      id: String(r.id ?? ""),
      postId: String(r.post_id ?? ""),
      parentId: typeof r.parent_id === "string" ? r.parent_id : null,
      content: String(r.content ?? ""),
      likeCount: typeof r.like_count === "number" ? r.like_count : 0,
      authorId,
      authorLabel:
        typeof r.author_label === "string" && r.author_label.trim() ? r.author_label.trim() : "\uC37C\uBC84\uC2ED \uD68C\uC6D0",
      createdAt,
      createdAtLabel: formatRelativeTime(createdAt),
      isOwn: viewerId != null && authorId === viewerId,
      replies: [] as CommunityBoardCommentNode[],
    };
  });

  const top: CommunityBoardCommentNode[] = [];
  const byId = new Map(flat.map((c) => [c.id, c]));
  for (const c of flat) {
    if (!c.parentId) {
      top.push(c);
      continue;
    }
    const parent = byId.get(c.parentId);
    if (parent && !parent.parentId) {
      parent.replies.push(c);
    } else {
      top.push(c);
    }
  }
  return { nodes: top, error: null };
}

export async function getPostReactionFlags(
  supabase: SupabaseClient,
  postId: string,
  userId: string | null
): Promise<{ liked: boolean; scrapped: boolean }> {
  if (!userId) return { liked: false, scrapped: false };
  const { data, error } = await supabase
    .from("post_reactions")
    .select("type")
    .eq("post_id", postId)
    .eq("user_id", userId);
  if (error) return { liked: false, scrapped: false };
  const types = ((data as { type: string }[]) ?? []).map((r) => r.type);
  return { liked: types.includes("like"), scrapped: types.includes("scrap") };
}

export async function listUserScrapPosts(
  supabase: SupabaseClient,
  userId: string,
  limit: number
): Promise<{ posts: CommunityBoardPostCard[]; error: string | null }> {
  const { data, error } = await supabase
    .from("post_reactions")
    .select("post_id, created_at")
    .eq("user_id", userId)
    .eq("type", "scrap")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) {
    if (/relation|does not exist/i.test(error.message)) return { posts: [], error: null };
    return { posts: [], error: error.message };
  }
  const ids = ((data as { post_id: string }[]) ?? []).map((r) => r.post_id).filter(Boolean);
  if (!ids.length) return { posts: [], error: null };
  const { data: posts, error: pErr } = await supabase.from("community_posts").select("*").in("id", ids);
  if (pErr) return { posts: [], error: pErr.message };
  const byId = new Map(((posts as Row[]) ?? []).map((r) => [String(r.id), r]));
  const ordered = ids.map((id) => byId.get(id)).filter((r): r is Row => Boolean(r));
  return { posts: ordered.map((r) => mapRowToBoardCard(r)), error: null };
}

export function pickPostBody(row: Row | null): string {
  if (!row) return "";
  return pickBody(row);
}
