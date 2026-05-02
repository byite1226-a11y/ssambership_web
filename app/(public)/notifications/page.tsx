import { redirect } from "next/navigation";
import { PageScaffold } from "@/components/shell/PageScaffold";
import { NotificationsHubView } from "@/components/notifications/NotificationsHubView";
import { getServerUserWithProfile } from "@/lib/auth/getServerUserWithProfile";
import { getPostLoginPath } from "@/lib/auth/getPostLoginPath";
import { createClient } from "@/lib/supabase/server";
import { loadNotificationsHub, NOTIFICATIONS_HUB_DATA_MODEL } from "@/lib/notifications/notificationsHubQueries";
import type { AppRole } from "@/lib/types/user";
import { USER_UI_LOAD_FAILED, USER_UI_OPS_ISSUE } from "@/lib/constants/userFacingMessages";

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
  if (hub.error) {
    console.error("[notifications] hub load", hub.error);
  }

  const role: AppRole = (profile?.role as AppRole) ?? "student";
  if (authErr && !profile) {
    /* RLS may still return rows; 프로필 없이도 알림 id만 맞으면 읽힘 */
  }

  return (
    <PageScaffold
      eyebrow="알림"
      title="알림"
      description="받은 알림을 확인하고, 관련 화면으로 이동할 수 있습니다."
      ctas={[
        { href: getPostLoginPath(role), label: role === "mentor" ? "멘토 홈" : "학생 홈", tone: "slate" },
        { href: role === "mentor" ? "/mentor/question-room" : "/question-room", label: "질문방", tone: "blue" },
        { href: role === "student" ? "/wallet/charge" : "/mentor/payouts", label: role === "mentor" ? "정산" : "캐시", tone: "slate" },
      ]}
      sections={[
        {
          title: "수신함",
          body: hub.error ? USER_UI_LOAD_FAILED : `${hub.rows.length}건 (${f === "unread" ? "읽지 않음" : "전체"})`,
          status: hub.error && hub.rows.length === 0 ? "skeleton" : "connected",
        },
        { title: "바로가기", body: "알림 유형에 따라 질문방·지갑 등으로 연결될 수 있어요.", status: "connected" },
        { title: "읽음 표시", body: "읽음 처리는 이후 업데이트에서 지원할 예정이에요.", status: "skeleton" },
      ]}
      emptyState="새 알림이 없습니다."
      loadingState="불러오는 중입니다."
      errorState={hub.error && hub.rows.length === 0 ? USER_UI_OPS_ISSUE : "—"}
      dataPoints={[...NOTIFICATIONS_HUB_DATA_MODEL]}
    >
      <NotificationsHubView hub={hub} filter={f} role={role} />
    </PageScaffold>
  );
}
