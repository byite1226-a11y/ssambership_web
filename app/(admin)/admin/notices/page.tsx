import { PageScaffold } from "@/components/shell/PageScaffold";
import { AdminNoticesList } from "@/components/admin/AdminNoticesList";
import { AdminNoticesFormSkeleton } from "@/components/admin/AdminNoticesFormSkeleton";
import { createClient } from "@/lib/supabase/server";
import { getNoticeTableColumnHints, loadAdminNoticesPage } from "@/lib/admin/adminNoticesQueries";
import { ADMIN_NOTICES_DATA_MODEL } from "@/lib/admin/adminNoticesDataModel";

type PageProps = { searchParams?: Promise<{ error?: string; ok?: string; new?: string }> };

export default async function AdminNoticesPage(props: PageProps) {
  const sp = (await props.searchParams) ?? {};
  const err = typeof sp.error === "string" && sp.error.length ? sp.error : null;
  const ok = sp.ok === "1";
  const supabase = await createClient();
  const { noticeSection, promoSection, mappedNotices, mappedPromos, listErrors, probeSummary } = await loadAdminNoticesPage(
    supabase,
    50
  );
  const hintTable = noticeSection?.table ?? promoSection?.table ?? null;
  const hints = hintTable ? await getNoticeTableColumnHints(supabase, hintTable) : null;

  return (
    <PageScaffold
      eyebrow="Admin / W25 / Notices"
      title="공지 · 프로모션"
      description="notices / promotions(후보명) 실제 select + draft insert(컬럼 후보). 학생·멘토·QnA·캐시·맞춤의뢰·마이페이지 라우트/쿼리는 변경 없음. — 요청: ssambeship execution master(W25)와 동일한 데이터 뼈대만."
      ctas={[
        { href: "/admin", label: "대시보드", tone: "slate" },
        { href: "/admin/audit-logs", label: "감사 로그", tone: "blue" },
      ]}
      sections={[
        { title: "Probe", body: probeSummary, status: "connected" },
        { title: "목록", body: "제목·유형·타겟·기간·활성(컬럼 스캐닝) — 수동 수정은 /admin/notices?edit= (후속).", status: "connected" },
        { title: "발행", body: "예약·다단계 워크플로 — 후속. 이번: draft insert", status: "skeleton" },
      ]}
      emptyState="목록 0건이면 아래 + 생성 폼."
      loadingState="RSC에서 테이블 probe·목록. 클라 SWR(후속)."
      errorState={listErrors.length ? listErrors.join(" | ") : "쿼리/RLS 오류 시 배너 + 폼 `?error=`."}
      dataPoints={[...ADMIN_NOTICES_DATA_MODEL]}
    >
      <div className="space-y-5">
        {listErrors.length ? <p className="text-sm text-amber-900">조회: {listErrors.join(" — ")}</p> : null}
        {noticeSection ? <AdminNoticesList label="공지(추정)" table={noticeSection.table} rows={mappedNotices} error={noticeSection.error} /> : null}
        {promoSection ? <AdminNoticesList label="프로모션(추정)" table={promoSection.table} rows={mappedPromos} error={promoSection.error} /> : null}
        <AdminNoticesFormSkeleton hints={hints} errorMessage={err} ok={ok} hintTable={hintTable} />
      </div>
    </PageScaffold>
  );
}
