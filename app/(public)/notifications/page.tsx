import { redirect } from "next/navigation";
import { PageScaffold } from "@/components/shell/PageScaffold";
import { NotificationsHubView } from "@/components/notifications/NotificationsHubView";
import { getServerUserWithProfile } from "@/lib/auth/getServerUserWithProfile";
import { getPostLoginPath } from "@/lib/auth/getPostLoginPath";
import { createClient } from "@/lib/supabase/server";
import { loadNotificationsHub } from "@/lib/notifications/notificationsHubQueries";
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
  if (hub.error) {
    console.error("[notifications] hub load", hub.error);
  }

  const role: AppRole = (profile?.role as AppRole) ?? "student";
  if (authErr && !profile) {
    /* 프로필 없이도 알림 id가 일치하면 목록이 표시될 수 있음 */
  }

  return (
    <PageScaffold
      hideFooterPlaceholderCards
      eyebrow="알림"
      title="알림"
      description="받은 알림을 확인하고, 관련 화면으로 이동할 수 있습니다."
      ctas={[
        { href: getPostLoginPath(role), label: role === "mentor" ? "멘토 홈" : "학생 홈", tone: "slate" },
        { href: role === "mentor" ? "/mentor/question-room" : "/question-room", label: "질문방", tone: "blue" },
        { href: role === "student" ? "/wallet/charge" : "/mentor/payouts", label: role === "mentor" ? "정산" : "캐시", tone: "slate" },
      ]}
    >
      <NotificationsHubView hub={hub} filter={f} role={role} />
    </PageScaffold>
  );
}
