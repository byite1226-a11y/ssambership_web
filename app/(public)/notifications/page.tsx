import { redirect } from "next/navigation";
import { PageScaffold } from "@/components/shell/PageScaffold";
import { NotificationsHubView } from "@/components/notifications/NotificationsHubView";
import { getServerUserWithProfile } from "@/lib/auth/getServerUserWithProfile";
import { getPostLoginPath } from "@/lib/auth/getPostLoginPath";
import { createClient } from "@/lib/supabase/server";
import { loadNotificationsHub, NOTIFICATIONS_HUB_DATA_MODEL } from "@/lib/notifications/notificationsHubQueries";
import type { AppRole } from "@/lib/types/user";

type Props = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function NotificationsPage(props: Props) {
  const { user, profile, error: authErr } = await getServerUserWithProfile();
  if (!user) {
    redirect(`/login?next=${encodeURIComponent("/notifications")}`);
  }

  const sp = (await props.searchParams) ?? {};
  const rawF = sp.filter;
  const f = (Array.isArray(rawF) ? rawF[0] : rawF) === "unread" ? "unread" : "all";

  const supabase = await createClient();
  const hub = await loadNotificationsHub(supabase, user.id, { filter: f });

  const role: AppRole = (profile?.role as AppRole) ?? "student";
  if (authErr && !profile) {
    /* RLS may still return rows; 프로필 없이도 알림 id만 맞으면 읽힘 */
  }

  return (
    <PageScaffold
      eyebrow="Ops / Notifications"
      title="알림"
      description="Supabase `notifications` 기준 수신함. 읽지 않음/전체, 유형·시간, 딥링크(placeholder 포함). 실시간·읽음 처리·설정은 후속."
      ctas={[
        { href: getPostLoginPath(role), label: role === "mentor" ? "멘토 홈" : "학생 홈", tone: "slate" },
        { href: role === "mentor" ? "/mentor/question-room" : "/question-room", label: "질문방", tone: "blue" },
        { href: role === "student" ? "/wallet/charge" : "/mentor/payouts", label: role === "mentor" ? "정산" : "캐시", tone: "slate" },
      ]}
      sections={[
        {
          title: "notifications",
          body: hub.error ?? `행 ${hub.rows.length} (filter=${f}, user=${hub.userColumn ?? "—"})`,
          status: hub.error && hub.rows.length === 0 ? "skeleton" : "connected",
        },
        { title: "딥링크", body: "target_url || type 휴리스틱 → question-room / wallet / custom-request/orders/…", status: "connected" },
        { title: "읽음", body: "배지만 표기 · 업데이트 뮤테이션은 후속", status: "skeleton" },
      ]}
      emptyState="알림이 없으면 empty 카드(더미 row 없음)."
      loadingState="/notifications/loading — 서버 조회"
      errorState="테이블 없음/RLS — 메시지·재시도(후속)"
      dataPoints={[...NOTIFICATIONS_HUB_DATA_MODEL]}
    >
      <NotificationsHubView hub={hub} filter={f} role={role} />
    </PageScaffold>
  );
}
