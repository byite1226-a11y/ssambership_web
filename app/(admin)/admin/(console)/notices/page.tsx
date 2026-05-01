import { PageScaffold } from "@/components/shell/PageScaffold";
import { AdminNoticesList } from "@/components/admin/AdminNoticesList";
import { AdminNoticesFormSkeleton } from "@/components/admin/AdminNoticesFormSkeleton";
import { createClient } from "@/lib/supabase/server";
import { getNoticeTableColumnHints, loadAdminNoticesPage } from "@/lib/admin/adminNoticesQueries";
import { ADMIN_NOTICES_DATA_MODEL } from "@/lib/admin/adminNoticesDataModel";
import { adminListErrorDescription, toAdminDisplayError } from "@/lib/admin/adminDisplayError";

type PageProps = { searchParams?: Promise<{ error?: string; ok?: string; new?: string }> };

export default async function AdminNoticesPage(props: PageProps) {
  const sp = (await props.searchParams) ?? {};
  const rawErr = typeof sp.error === "string" && sp.error.length ? sp.error : null;
  const err = toAdminDisplayError(rawErr, "notices");
  const ok = sp.ok === "1";
  const supabase = await createClient();
  const { noticeSection, promoSection, mappedNotices, mappedPromos, listErrors } = await loadAdminNoticesPage(supabase, 50);
  const hintTable = noticeSection?.table ?? promoSection?.table ?? null;
  const hints = hintTable ? await getNoticeTableColumnHints(supabase, hintTable) : null;

  return (
    <PageScaffold
      eyebrow="관리자 / 공지"
      title="공지 및 프로모션"
      description="서비스 공지와 프로모션 안내를 관리합니다."
      ctas={[
        { href: "/admin", label: "대시보드", tone: "slate" },
        { href: "/admin/audit-logs", label: "감사 로그", tone: "blue" },
      ]}
      sections={[
        { title: "목록", body: "등록된 공지와 프로모션을 확인합니다.", status: "connected" },
        { title: "작성", body: "새 공지 또는 프로모션을 작성할 수 있습니다.", status: "connected" },
      ]}
      emptyState="등록된 항목이 없으면 아래에서 새로 작성할 수 있습니다."
      loadingState="목록을 불러오는 중입니다."
      errorState={listErrors.length ? adminListErrorDescription("notices") : "일시적으로 목록을 불러오지 못했습니다."}
      dataPoints={[...ADMIN_NOTICES_DATA_MODEL]}
    >
      <div className="space-y-5">
        {listErrors.length ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-3 text-sm text-amber-950">
            <p className="font-semibold">목록을 불러오지 못했습니다.</p>
            <p className="mt-1 text-xs text-amber-900/95">{adminListErrorDescription("notices")}</p>
          </div>
        ) : null}
        {noticeSection ? <AdminNoticesList label="공지" table={noticeSection.table} rows={mappedNotices} error={noticeSection.error} /> : null}
        {promoSection ? <AdminNoticesList label="프로모션" table={promoSection.table} rows={mappedPromos} error={promoSection.error} /> : null}
        <AdminNoticesFormSkeleton hints={hints} errorMessage={err} ok={ok} hintTable={hintTable} />
      </div>
    </PageScaffold>
  );
}
