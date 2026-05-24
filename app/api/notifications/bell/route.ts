import { NextResponse } from "next/server";
import { getServerUserWithProfile } from "@/lib/auth/getServerUserWithProfile";
import { loadNotificationBellData } from "@/lib/notifications/notificationBellQueries";
import { createClient } from "@/lib/supabase/server";
import type { AppRole } from "@/lib/types/user";

export const dynamic = "force-dynamic";

export async function GET() {
  const { user, profile } = await getServerUserWithProfile();
  if (!user || !profile?.role || profile.role === "admin") {
    return NextResponse.json({ unreadCount: 0, items: [] });
  }

  const supabase = await createClient();
  const data = await loadNotificationBellData(supabase, user.id, profile.role as AppRole);
  return NextResponse.json(data);
}
