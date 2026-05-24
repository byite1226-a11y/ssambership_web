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
