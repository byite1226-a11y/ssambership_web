import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { pickExistingColumn } from "@/lib/qna/safeSelect";

const TABLE = "notifications";

export type InsertNotificationInput = {
  recipientUserId: string;
  type: string;
  title: string;
  body: string;
  link?: string;
  metadata?: Record<string, unknown>;
};

export async function fetchUserDisplayName(
  supabase: SupabaseClient,
  userId: string
): Promise<string> {
  // users 테이블에 display_name 컬럼이 없어 select가 실패 → 이름이 항상 "사용자"로 폴백되던 버그 수정.
  const { data } = await supabase
    .from("users")
    .select("full_name, nickname")
    .eq("id", userId)
    .maybeSingle();
  const row = data as { full_name?: string | null; nickname?: string | null } | null;
  const name = (row?.full_name ?? row?.nickname ?? "").trim();
  return name || "멘토";
}

/**
 * notifications insert — RLS가 authenticated insert를 막으므로 service_role 사용.
 * 실패해도 본업무 흐름은 중단하지 않는다.
 */
export async function insertNotificationBestEffort(input: InsertNotificationInput): Promise<void> {
  try {
    const admin = createServiceRoleClient();
    const { column: userCol } = await pickExistingColumn(admin, TABLE, [
      "user_id",
      "recipient_id",
      "target_user_id",
      "owner_id",
      "student_id",
      "mentor_id",
    ]);
    if (!userCol) {
      console.error("[insertNotificationBestEffort] recipient column not found");
      return;
    }

    const meta = {
      ...(input.metadata ?? {}),
      ...(input.link ? { link: input.link } : {}),
    };

    const base: Record<string, unknown> = {
      [userCol]: input.recipientUserId,
      type: input.type,
      body: input.body,
      is_read: false,
      metadata: meta,
      data: { link: input.link ?? null, title: input.title },
    };

    const candidates: Record<string, unknown>[] = [
      { ...base, title: input.title, link: input.link ?? null },
      { ...base, subject: input.title },
      { ...base, message: input.body },
      base,
    ];

    for (const payload of candidates) {
      const { error } = await admin.from(TABLE).insert(payload);
      if (!error) return;
      if (!/column|does not exist|schema cache/i.test(error.message)) {
        console.error("[insertNotificationBestEffort] insert failed", error.message, { type: input.type });
        return;
      }
    }
    console.error("[insertNotificationBestEffort] all insert candidates failed", { type: input.type });
  } catch (e) {
    console.error("[insertNotificationBestEffort]", e);
  }
}
