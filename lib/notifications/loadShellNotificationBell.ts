import { loadNotificationBellData } from "@/lib/notifications/notificationBellQueries";
import { createClient } from "@/lib/supabase/server";
import type { AppRole } from "@/lib/types/user";

export async function loadShellNotificationBell(userId: string, role: AppRole) {
  const supabase = await createClient();
  const data = await loadNotificationBellData(supabase, userId, role);
  return {
    userId,
    role,
    unreadCount: data.unreadCount,
    items: data.items,
  };
}

/** 레이아웃 공통 — 알림 조회 실패 시 null(페이지 500 방지) */
export async function loadShellNotificationBellSafe(userId: string, role: AppRole) {
  try {
    return await loadShellNotificationBell(userId, role);
  } catch (err) {
    console.error("[loadShellNotificationBellSafe]", role, userId, err);
    return null;
  }
}
