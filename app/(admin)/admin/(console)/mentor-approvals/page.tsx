import { PageScaffold } from "@/components/shell/PageScaffold";
import { AdminStatusBadge } from "@/components/admin/AdminStatusBadge";
import { AdminMentorApprovalsTable } from "@/components/admin/AdminMentorApprovalsTable";
import { createClient } from "@/lib/supabase/server";
import { fetchAdminUsersDisplayByIds, loadMentorApprovalsList } from "@/lib/admin/adminQueries";
import { mentorProfilesAdminReadClient } from "@/lib/admin/mentorProfilesAdminRead";
import { toAdminDisplayError } from "@/lib/admin/adminDisplayError";

type PageProps = { searchParams?: Promise<Record<string, string | string[] | undefined>> };

export default async function AdminMentorApprovalsPage(props: PageProps) {
  const sp = (await props.searchParams) ?? {};
  const errParam = sp.error;
  const okParam = sp.ok;
  const flashErrRaw = typeof errParam === "string" ? errParam : Array.isArray(errParam) ? errParam[0] : null;
  const flashOkRaw = typeof okParam === "string" ? okParam : Array.isArray(okParam) ? okParam[0] : null;
  const flashErr = flashErrRaw ? (toAdminDisplayError(flashErrRaw, "mentorApprovals") ?? "처리에 실패했습니다.") : null;
  const flashOk =
    flashOkRaw === "approve" ? "멘토 신청을 승인했습니다." : flashOkRaw === "reject" ? "멘토 신청을 반려했습니다." : null;

  const supabase = await createClient();
  const list = await loadMentorApprovalsList(supabase, 30);
  const readDb = mentorProfilesAdminReadClient(supabase);
  const userIds = list.rows
    .map((r) => String((r as Record<string, unknown>).user_id ?? "").trim())
    .filter((x) => x.length > 0);
  const userById = await fetchAdminUsersDisplayByIds(readDb, userIds);

  return (
    <PageScaffold
      hideFooterPlaceholderCards
      eyebrow="관리자 / 멘토 승인"
      title="멘토 승인 관리"
      description="멘토 신청 내역을 검토하고 승인 또는 반려할 수 있습니다."
      ctas={[
        { href: "/admin", label: "대시보드", tone: "slate" },
        { href: "/admin/audit-logs", label: "감사 로그", tone: "blue" },
      ]}
      sections={[
        { title: "목록", body: "승인 대기 건이 우선 표시됩니다.", status: list.table ? "connected" : "skeleton" },
        { title: "알림", body: "승인·반려 결과 알림은 추후 연결됩니다.", status: "skeleton" },
      ]}
      emptyState=""
      loadingState=""
      errorState=""
      dataPoints={[]}
    >
      <div className="space-y-4">
        {flashOk ? (
          <p className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-3 text-sm font-semibold text-emerald-950">{flashOk}</p>
        ) : null}
        {flashErr ? (
          <p className="rounded-2xl border border-red-200 bg-red-50/80 p-3 text-sm font-semibold text-red-950">{flashErr}</p>
        ) : null}

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-extrabold text-slate-800">승인 대기 목록</span>
          <AdminStatusBadge result={list} hint="최근 신청부터 최대 30건" />
        </div>
        <AdminMentorApprovalsTable list={list} userById={userById} />
      </div>
    </PageScaffold>
  );
}
