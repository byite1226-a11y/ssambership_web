"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell } from "lucide-react";
import { NotificationDropdown } from "@/components/notifications/NotificationDropdown";
import { createClient } from "@/lib/supabase/client";
import type { NotificationBellItem } from "@/lib/notifications/notificationBellQueries";
import type { AppRole } from "@/lib/types/user";

type Props = {
  userId: string;
  role: AppRole;
  initialUnreadCount: number;
  initialItems: NotificationBellItem[];
  iconClassName?: string;
};

export function NotificationBell(props: Props) {
  const { userId, iconClassName } = props;
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(props.initialUnreadCount);
  const [items, setItems] = useState(props.initialItems);
  const rootRef = useRef<HTMLDivElement>(null);
  const supabase = useMemo(() => createClient(), []);

  const refreshSnapshot = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications/bell", { cache: "no-store" });
      if (!res.ok) return;
      const json = (await res.json()) as { unreadCount: number; items: NotificationBellItem[] };
      setUnreadCount(json.unreadCount ?? 0);
      setItems(json.items ?? []);
    } catch {
      /* ignore */
    }
  }, []);

  const refreshSnapshotRef = useRef(refreshSnapshot);
  refreshSnapshotRef.current = refreshSnapshot;

  useEffect(() => {
    setUnreadCount(props.initialUnreadCount);
    setItems(props.initialItems);
  }, [props.initialUnreadCount, props.initialItems]);

  useEffect(() => {
    if (!userId) return;

    const channelName = `notifications-bell:${userId}`;

    // 동일 이름 채널이 이미 존재하면 먼저 제거 (topic은 realtime: 접두사 포함)
    const existing = supabase.getChannels().find(
      (ch) => ch.topic === `realtime:${channelName}`
    );
    if (existing) {
      supabase.removeChannel(existing);
    }

    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes" as const,
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        () => {
          setUnreadCount((prev) => prev + 1);
        }
      )
      .on(
        "postgres_changes" as const,
        {
          event: "UPDATE",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        () => {
          refreshSnapshotRef.current?.();
        }
      );

    channel.subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, supabase]);

  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  const badge =
    unreadCount > 0 ? (
      <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-black text-white">
        {unreadCount > 99 ? "99+" : unreadCount}
      </span>
    ) : null;

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={
          iconClassName ??
          "inline-flex h-9 w-9 shrink-0 items-center justify-center text-slate-500 transition hover:text-slate-800"
        }
        aria-label="알림"
        title="알림"
        aria-expanded={open}
      >
        <span className="relative inline-flex">
          <Bell className="h-[18px] w-[18px] shrink-0" strokeWidth={2} />
          {badge}
        </span>
      </button>
      {open ? (
        <NotificationDropdown
          items={items}
          role={props.role}
          onSelect={async (item) => {
            setOpen(false);
            const { markNotificationReadByIdAction } = await import("@/lib/notifications/notificationReadActions");
            await markNotificationReadByIdAction(item.id);
            if (!item.isRead) {
              setUnreadCount((c) => Math.max(0, c - 1));
            }
            router.push(item.href);
          }}
          onViewAll={() => {
            setOpen(false);
            router.push("/notifications");
          }}
        />
      ) : null}
    </div>
  );
}
