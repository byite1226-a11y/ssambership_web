import { PageScaffold } from "@/components/shell/PageScaffold";
import { DisputeMentorPageBody } from "@/components/disputes/DisputeMentorPageBody";
import { requireRole } from "@/lib/auth/routeGuard";
import { createClient } from "@/lib/supabase/server";
import { canPartyViewDispute, loadDisputeById } from "@/lib/disputes/disputeQueries";
import { USER_UI_LOAD_FAILED } from "@/lib/constants/userFacingMessages";

type PageProps = { params: Promise<{ id: string }> };

export default async function MentorDisputeDetailPage(props: PageProps) {
  const { id } = await props.params;
  const { user } = await requireRole("mentor");
  const supabase = await createClient();
  const bundle = await loadDisputeById(supabase, id);
  const row = bundle.dispute.row;
  const access = canPartyViewDispute(user.id, "mentor", row);

  const loadFailed = Boolean(bundle.dispute.error && !row);
  if (loadFailed && bundle.dispute.error) {
    console.error("[mentor/support/disputes/detail] load failed", bundle.dispute.error);
  }

  return (
    <PageScaffold hideHero hideFooterPlaceholderCards>
      {row && !access.ok ? (
        <p className="mb-3 rounded-2xl border border-amber-200 bg-amber-50/80 p-3 text-sm font-bold text-amber-950">
          이 사건에 대한 조회 권한이 없습니다.
        </p>
      ) : null}
      {row && access.ok ? (
        <DisputeMentorPageBody bundle={bundle} />
      ) : loadFailed ? (
        <p className="text-sm text-amber-900">{USER_UI_LOAD_FAILED}</p>
      ) : (
        <p className="text-sm text-slate-600">요청하신 분쟁 정보를 찾을 수 없습니다.</p>
      )}
    </PageScaffold>
  );
}
