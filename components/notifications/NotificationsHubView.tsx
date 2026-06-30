import { NotificationFilterTabs } from "@/components/notifications/NotificationFilterTabs";
import { NotificationList } from "@/components/notifications/NotificationList";
import { isNotificationReadRow, type NotificationHubLoad } from "@/lib/notifications/notificationsHubQueries";
import type { AppRole } from "@/lib/types/user";
import { USER_UI_LOAD_FAILED } from "@/lib/constants/userFacingMessages";

type Filter = "all" | "unread";

export function NotificationsHubView(props: {
  hub: NotificationHubLoad;
  filter: Filter;
  role: AppRole;
}) {
  const { hub, filter, role } = props;
  if (hub.error) {
    console.error("[NotificationsHubView] hub.error", hub.error, hub.probe);
  }

  const unreadCount = hub.error
    ? 0
    : hub.rows.filter((r) => !isNotificationReadRow(r as Record<string, unknown>, hub.readColumn)).length;

  return (
    <div className="space-y-4">
      {/* 안 읽음 수 + 필터 탭 한 줄 정돈 (페이지 제목은 상단 스캐폴드가 표시) */}
      <header className="flex flex-wrap items-center justify-between gap-3">
        <span className="text-xs font-bold text-slate-500">
          {unreadCount > 0 ? (
            <>
              안 읽음 <span className="text-[#2563EB]">{unreadCount}</span>건
            </>
          ) : (
            "모두 확인했어요"
          )}
        </span>
        <NotificationFilterTabs current={filter} />
      </header>

      {hub.error ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 p-2 text-sm text-amber-950">{USER_UI_LOAD_FAILED}</p>
      ) : null}
      {hub.unreadFilterBlocked ? (
        <p className="text-xs text-amber-800">읽지 않음 필터는 아직 모든 환경에서 지원되지 않을 수 있어요.</p>
      ) : null}
      {hub.unreadUsedMemoryFilter && filter === "unread" && !hub.unreadFilterBlocked ? (
        <p className="text-xs text-slate-500">읽지 않은 알림만 모아 보여 드리고 있어요.</p>
      ) : null}

      <NotificationList hub={hub} filter={filter} role={role} />
    </div>
  );
}
