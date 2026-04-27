import type { SupabaseClient } from "@supabase/supabase-js";
import { fetchMentorMediaSample, getProfileFieldString } from "@/lib/mentor/mentorProfileQueries";
import { getStringField } from "@/lib/qna/safeSelect";

export type ChannelMediaBucket = "shortform" | "explanation" | "material" | "featured_other";

export type MentorChannelListItem = {
  id: string;
  title: string;
  bucket: ChannelMediaBucket;
  publicLabel: string;
};

type Row = Record<string, unknown>;

function inferBucket(row: Row): ChannelMediaBucket {
  const raw =
    getStringField(row, ["content_type", "media_type", "kind", "category", "type"])?.toLowerCase() ?? "";
  if (raw.includes("short") || raw.includes("reel") || raw.includes("vertical")) return "shortform";
  if (raw.includes("해설") || raw.includes("explain") || raw.includes("lecture") || raw.includes("clip"))
    return "explanation";
  if (raw.includes("자료") || raw.includes("doc") || raw.includes("pdf") || raw.includes("sheet") || raw.includes("file"))
    return "material";
  return "featured_other";
}

function publicStatusLabel(row: Row): string {
  if ("is_public" in row && typeof row.is_public === "boolean") {
    return row.is_public ? "공개" : "비공개";
  }
  const vis = getStringField(row, ["visibility", "status", "publish_state"]);
  return vis?.trim() ? vis : "공개 여부(컬럼 미확정)";
}

function rowTitle(row: Row): string {
  const head = getStringField(row, ["title", "name", "label", "caption", "description"]);
  if (head) return head;
  const body = getProfileFieldString(row, ["body", "summary"]);
  return body.trim() ? body : "(제목 없음)";
}

function rowId(row: Row): string | null {
  const v = row.id;
  if (typeof v === "string" || typeof v === "number") return String(v);
  return null;
}

/**
 * mentor_media 계열: fetchMentorMediaSample과 동일 probe + 행 분류(타입 컬럼 없으면 featured_other).
 */
export async function loadMentorChannelMedia(
  supabase: SupabaseClient,
  userId: string
): Promise<{
  items: MentorChannelListItem[];
  table: string | null;
  error: string | null;
  probe: string;
}> {
  const { rows, table, error } = await fetchMentorMediaSample(supabase, userId, 48);
  const probe = table
    ? `mentor_media 계열: ${table} · ${rows.length}행`
    : "mentor_media / mentor_content_links / mentor_link_items 읽기 실패 또는 미생성";
  if (error) {
    return { items: [], table, error, probe: `${probe} · ${error}` };
  }
  const items: MentorChannelListItem[] = [];
  for (const row of rows) {
    const id = rowId(row);
    if (!id) continue;
    items.push({
      id,
      title: rowTitle(row),
      bucket: inferBucket(row),
      publicLabel: publicStatusLabel(row),
    });
  }
  return { items, table, error: null, probe };
}

export function groupChannelItemsByBucket(items: MentorChannelListItem[]): Record<ChannelMediaBucket, MentorChannelListItem[]> {
  const empty: Record<ChannelMediaBucket, MentorChannelListItem[]> = {
    shortform: [],
    explanation: [],
    material: [],
    featured_other: [],
  };
  for (const it of items) {
    empty[it.bucket].push(it);
  }
  return empty;
}
