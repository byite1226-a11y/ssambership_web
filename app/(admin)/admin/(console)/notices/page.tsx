import { PageScaffold } from "@/components/shell/PageScaffold";
import { AdminNoticesList } from "@/components/admin/AdminNoticesList";
import { AdminNoticesFormSkeleton } from "@/components/admin/AdminNoticesFormSkeleton";
import { createClient } from "@/lib/supabase/server";
import { ADMIN_NOTICES_FORM_HINTS, loadAdminNoticesPage } from "@/lib/admin/adminNoticesQueries";
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

  const noticesOk = !noticeSection.error;
  const promosOk = !promoSection.error;
  const combinedEmpty =
    listErrors.length === 0 && noticesOk && promosOk && mappedNotices.length === 0 && mappedPromos.length === 0;

  return (
    <PageScaffold
      hideFooterPlaceholderCards
      eyebrow="관리자 / 공지"
      title="공지 및 프로모션"
      description="서비스 공지와 프로모션 안내를 관리합니다."
      ctas={[
        { href: "/admin", label: "대시보드", tone: "slate" },
        { href: "/admin/audit-logs", label: "감사 로그", tone: "blue" },
      ]}
      sections={[
        { title: "목록", body: "등록된 공지와 프로모션 목록", status: "connected" },
        { title: "작성", body: "새 공지 또는 프로모션", status: "connected" },
      ]}
      emptyState="등록된 공지 또는 프로모션이 없습니다."
      loadingState="목록을 불러오는 중입니다."
      errorState={listErrors.length ? adminListErrorDescription("notices") : "일시적으로 목록을 불러오지 못했습니다."}
      dataPoints={[...ADMIN_NOTICES_DATA_MODEL]}
    >
      <div className="space-y-5">
        {combinedEmpty ? (
          <p className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-5 text-sm text-slate-600">
            등록된 공지 또는 프로모션이 없습니다.
          </p>
        ) : (
          <div className="space-y-4">
            <AdminNoticesList label="공지" table={noticeSection.table} rows={mappedNotices} error={noticeSection.error} />
            <AdminNoticesList label="프로모션" table={promoSection.table} rows={mappedPromos} error={promoSection.error} />
          </div>
        )}

        <AdminNoticesFormSkeleton hints={ADMIN_NOTICES_FORM_HINTS} errorMessage={err} ok={ok} hintTable="app_notices" />
      </div>
    </PageScaffold>
  );
}
