"use client";

import type { LucideIcon } from "lucide-react";
import { Bell, ClipboardList, Inbox, MessageCircle } from "lucide-react";

export function notificationTypeIcon(type: string | null): LucideIcon {
  const t = (type ?? "").toLowerCase();
  if (t === "question_answered") return MessageCircle;
  if (t === "new_application") return ClipboardList;
  if (t === "new_order_message") return Inbox;
  return Bell;
}
