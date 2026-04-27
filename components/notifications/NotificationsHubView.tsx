import { NotificationFilterTabs } from "@/components/notifications/NotificationFilterTabs";
import { NotificationList } from "@/components/notifications/NotificationList";
import type { NotificationHubLoad } from "@/lib/notifications/notificationsHubQueries";
import type { AppRole } from "@/lib/types/user";

type Filter = "all" | "unread";

const EXAMPLES = [
  "질문방 — 새 답변 (쓰레드/room id payload 후속)",
  "구독/결제 — 갱신·결제 실패/성공 (payments 연계)",
  "맞춤의뢰 — 상태 변경, 납품 (order id)",
  "공지/프로모션 — 사이트 공지 (또는 notices)",
  "신고/분쟁 — 처리 상태 변경 (dispute id)",
] as const;

export function NotificationsHubView(props: {
  hub: NotificationHubLoad;
  filter: Filter;
  role: AppRole;
}) {
  const { hub, filter, role } = props;

  return (
    <div className="space-y-4">
      <NotificationFilterTabs current={filter} />

      {hub.error ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 p-2 text-sm text-amber-950">Supabase: {hub.error}</p>
      ) : null}
      <p className="text-xs text-slate-500">연결: {hub.probe}</p>
      {hub.unreadFilterBlocked ? (
        <p className="text-xs text-amber-800">읽지 않음 탭: DB에 read/is_read 컬럼이 없어 비어 있을 수 있습니다.</p>
      ) : null}
      {hub.unreadUsedMemoryFilter && filter === "unread" && !hub.unreadFilterBlocked ? (
        <p className="text-xs text-slate-500">읽지 않음: 수신 row를 read 컬럼으로 필터했습니다.</p>
      ) : null}

      <NotificationList hub={hub} filter={filter} role={role} />

      <section className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 p-3 text-xs text-slate-600">
        <p className="font-extrabold text-slate-800">알림 유형 예시(콘텐츠가 오면 type/kind·payload로 구분)</p>
        <ul className="mt-1 list-inside list-disc">
          {EXAMPLES.map((e) => (
            <li key={e}>{e}</li>
          ))}
        </ul>
      </section>

      <p className="text-xs text-slate-500">
        읽음·실시간·설정: 후속. <code>target_url</code>·엔티티 id가 없을 때는 휴리스틱·역할 기본 링크를 씁니다.
      </p>
    </div>
  );
}
