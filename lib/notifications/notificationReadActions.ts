"use server";

import { revalidatePath } from "next/cache";
import { getServerUserWithProfile } from "@/lib/auth/getServerUserWithProfile";
import { isNotificationReadRow } from "@/lib/notifications/notificationsHubQueries";
import { pickExistingColumn } from "@/lib/qna/safeSelect";
import { createClient } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";

type Row = Record<string, unknown>;

const TABLE = "notifications";
const USER_FK = ["user_id", "recipient_id", "student_id", "mentor_id", "target_user_id", "owner_id"] as const;
const READ_FK = ["read_at", "read_at_utc", "is_read", "seen_at", "opened_at", "viewed_at", "acknowledged_at"] as const;

async function resolveRecipientColumn(supabase: SupabaseClient, userId: string): Promise<string | null> {
  for (const col of USER_FK) {
    const p = await supabase.from(TABLE).select("id").eq(col, userId).limit(1);
    if (!p.error) {
      return col;
    }
  }
  return null;
}

/**
 * 수신자 본인 알림만 읽음 처리. read 컬럼은 스키마 탐지(is_read vs read_at 등).
 */
export async function markNotificationReadFormAction(formData: FormData): Promise<void> {
  const notificationId = String(formData.get("notificationId") ?? "").trim();
  if (!notificationId) {
    return;
  }

  const { user } = await getServerUserWithProfile();
  if (!user) {
    return;
  }

  const supabase = await createClient();
  const userColumn = await resolveRecipientColumn(supabase, user.id);
  if (!userColumn) {
    return;
  }

  const { column: readCol } = await pickExistingColumn(supabase, TABLE, READ_FK);
  if (!readCol) {
    return;
  }

  const { data: row, error: fe } = await supabase
    .from(TABLE)
    .select("*")
    .eq("id", notificationId)
    .eq(userColumn, user.id)
    .maybeSingle();

  if (fe || !row) {
    return;
  }

  const r = row as Row;
  if (isNotificationReadRow(r, readCol)) {
    revalidatePath("/notifications");
    return;
  }

  const patch: Record<string, unknown> = {};
  if (readCol === "is_read" || readCol === "read" || readCol === "acknowledged") {
    patch[readCol] = true;
  } else {
    patch[readCol] = new Date().toISOString();
  }

  const { error: ue } = await supabase.from(TABLE).update(patch).eq("id", notificationId).eq(userColumn, user.id);
  if (!ue) {
    revalidatePath("/notifications");
  }
}
