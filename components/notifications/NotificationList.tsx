import type { AppRole } from "@/lib/types/user";
import { NotificationItemCard } from "@/components/notifications/NotificationItemCard";
import { NotificationEmptyState } from "@/components/notifications/NotificationEmptyState";
import type { NotificationHubLoad } from "@/lib/notifications/notificationsHubQueries";

type Row = Record<string, unknown>;

type Filter = "all" | "unread";

export function NotificationList(props: {
  hub: NotificationHubLoad;
  filter: Filter;
  role: AppRole;
}) {
  const { hub, filter, role } = props;

  if (hub.unreadFilterBlocked) {
    return <NotificationEmptyState filter={filter} hadTableError={false} unreadFilterBlocked />;
  }
  if (hub.error && hub.rows.length === 0) {
    return <NotificationEmptyState filter={filter} hadTableError={true} />;
  }

  if (hub.rows.length === 0) {
    return <NotificationEmptyState filter={filter} hadTableError={false} />;
  }

  return (
    <ul className="space-y-2">
      {hub.rows.map((r, i) => (
        <li key={String((r as Row).id ?? i)}>
          <NotificationItemCard row={r as Row} hub={hub} role={role} />
        </li>
      ))}
    </ul>
  );
}
