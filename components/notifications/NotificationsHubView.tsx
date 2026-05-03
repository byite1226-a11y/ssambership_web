import { NotificationFilterTabs } from "@/components/notifications/NotificationFilterTabs";
import { NotificationList } from "@/components/notifications/NotificationList";
import type { NotificationHubLoad } from "@/lib/notifications/notificationsHubQueries";
import type { AppRole } from "@/lib/types/user";
import { USER_UI_LOAD_FAILED } from "@/lib/constants/userFacingMessages";

type Filter = "all" | "unread";

const EXAMPLES = [
  "질문방에서 새 답변이 도착했을 때",
  "구독·결제 상태가 바뀌었을 때",
  "맞춤의뢰 진행 단계가 바뀌었을 때",
  "공지·프로모션이 있을 때",
  "분쟁·신고 처리 상태가 바뀌었을 때",
] as const;

export function NotificationsHubView(props: {
  hub: NotificationHubLoad;
  filter: Filter;
  role: AppRole;
}) {
  const { hub, filter, role } = props;
  if (hub.error) {
    console.error("[NotificationsHubView] hub.error", hub.error, hub.probe);
  }

  return (
    <div className="space-y-4">
      <NotificationFilterTabs current={filter} />

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

      <section className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 p-3 text-xs text-slate-600">
        <p className="font-extrabold text-slate-800">알림으로 받을 수 있는 안내 예시</p>
        <ul className="mt-1 list-inside list-disc">
          {EXAMPLES.map((e) => (
            <li key={e}>{e}</li>
          ))}
        </ul>
      </section>

    </div>
  );
}
