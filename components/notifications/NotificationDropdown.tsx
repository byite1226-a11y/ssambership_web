"use client";

import { notificationTypeIcon } from "@/components/notifications/notificationTypeIcon";
import type { NotificationBellItem } from "@/lib/notifications/notificationBellQueries";
import type { AppRole } from "@/lib/types/user";

type Props = {
  items: NotificationBellItem[];
  role: AppRole;
  onSelect: (item: NotificationBellItem) => void | Promise<void>;
  onViewAll: () => void;
};

function formatRelativeTime(iso: string): string {
  if (iso === "—") return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso.slice(0, 16);
  const diffMs = Date.now() - d.getTime();
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 1) return "방금 전";
  if (mins < 60) return `${mins}분 전`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}일 전`;
  return d.toLocaleDateString("ko-KR", { month: "short", day: "numeric" });
}

export function NotificationDropdown(props: Props) {
  const { items, onSelect, onViewAll } = props;

  return (
    <div className="absolute right-0 top-full z-[60] mt-2 w-[min(100vw-2rem,360px)] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
      <div className="border-b border-slate-100 px-4 py-3">
        <p className="text-sm font-black text-slate-900">알림</p>
      </div>
      {items.length === 0 ? (
        <p className="px-4 py-10 text-center text-sm font-medium text-slate-500">새 알림이 없어요</p>
      ) : (
        <ul className="max-h-[320px] overflow-y-auto">
          {items.map((item) => {
            const Icon = notificationTypeIcon(item.type);
            return (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => void onSelect(item)}
                  className={`flex w-full gap-3 px-4 py-3 text-left transition hover:bg-slate-50 ${
                    item.isRead ? "bg-white" : "bg-blue-50/40"
                  }`}
                >
                  <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                    <Icon className="h-4 w-4" strokeWidth={2} aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1">
                    <p className="truncate text-sm font-extrabold text-slate-900">{item.title}</p>
                    {item.body ? (
                      <p className="mt-0.5 line-clamp-2 text-xs font-medium text-slate-600">{item.body}</p>
                    ) : null}
                    <p className="mt-1 text-[11px] font-semibold text-slate-400">{formatRelativeTime(item.createdAt)}</p>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
      <div className="border-t border-slate-100 p-2">
        <button
          type="button"
          onClick={onViewAll}
          className="flex min-h-[40px] w-full items-center justify-center rounded-xl text-sm font-extrabold text-[#1A56DB] hover:bg-blue-50/60"
        >
          전체 알림 보기
        </button>
      </div>
    </div>
  );
}
