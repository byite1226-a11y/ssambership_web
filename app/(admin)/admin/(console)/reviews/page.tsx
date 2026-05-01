import { PageScaffold } from "@/components/shell/PageScaffold";
import { AdminStatusBadge } from "@/components/admin/AdminStatusBadge";
import { AdminReviewsTable } from "@/components/admin/AdminReviewsTable";
import { AdminRecordTable } from "@/components/admin/AdminRecordTable";
import { createClient } from "@/lib/supabase/server";
import { fetchAdminUsersDisplayByIds, loadAdminReviewsPage } from "@/lib/admin/adminQueries";
import { mentorProfilesAdminReadClient } from "@/lib/admin/mentorProfilesAdminRead";
import { toAdminDisplayError } from "@/lib/admin/adminDisplayError";

type PageProps = { searchParams?: Promise<Record<string, string | string[] | undefined>> };

export default async function AdminReviewsPage(props: PageProps) {
  const sp = (await props.searchParams) ?? {};
  const errParam = sp.error;
  const okParam = sp.ok;
  const flashErrRaw = typeof errParam === "string" ? errParam : Array.isArray(errParam) ? errParam[0] : null;
  const flashOkRaw = typeof okParam === "string" ? okParam : Array.isArray(okParam) ? okParam[0] : null;
  const flashErr = flashErrRaw ? (toAdminDisplayError(flashErrRaw, "reviews") ?? "처리에 실패했습니다.") : null;
  const flashOk =
    flashOkRaw === "hide"
      ? "리뷰를 숨김 처리했습니다."
      : flashOkRaw === "restore"
        ? "리뷰를 복원했습니다."
        : flashOkRaw === "blind"
          ? "리뷰를 블라인드 처리했습니다."
          : flashOkRaw === "review"
            ? "검토 완료로 표시했습니다."
            : null;

  const supabase = await createClient();
  const { list, meta } = await loadAdminReviewsPage(supabase, 50);
  const readDb = mentorProfilesAdminReadClient(supabase);
  const userIds = new Set<string>();
  if (meta) {
    for (const r of list.rows) {
      const row = r as Record<string, unknown>;
      if (meta.authorColumn && row[meta.authorColumn] != null) {
        const s = String(row[meta.authorColumn]).trim();
        if (s) userIds.add(s);
      }
      if (meta.mentorColumn && row[meta.mentorColumn] != null) {
        const s = String(row[meta.mentorColumn]).trim();
        if (s) userIds.add(s);
      }
    }
  }
  const userById = await fetchAdminUsersDisplayByIds(readDb, [...userIds]);

  return (
    <PageScaffold
      hideFooterPlaceholderCards
      eyebrow="관리자 / 리뷰"
      title="리뷰 관리"
      description="멘토 리뷰를 조회·조치합니다. 숨김과 블라인드는 공개 화면에서 모두 비노출되지만, 운영 기록상 구분됩니다. 기술적인 오류 메시지는 표시하지 않습니다."
      ctas={[
        { href: "/admin/reports", label: "신고 관리", tone: "slate" },
        { href: "/admin/disputes", label: "분쟁 관리", tone: "slate" },
        { href: "/admin", label: "대시보드", tone: "blue" },
      ]}
      sections={[
        {
          title: "노출·검토",
          body:
            "숨김 — 리뷰를 공개 화면과 공개 집계에서 제외합니다. (스팸, 테스트, 중복, 무관한 리뷰 등 노출하지 않을 리뷰) 블라인드 — 민감하거나 위반 가능성이 있는 리뷰를 공개 화면에서 제외하고 블라인드 상태로 기록합니다. (개인정보, 욕설, 외부 연락처, 정책 위반 가능 리뷰. 현재 버전에서도 공개 화면에서는 비노출입니다.) 검토 완료 — 현재 노출 상태를 유지한 채 검토 완료로 표시합니다. 조치 버튼은 스키마에 해당 컬럼이 있을 때만 표시됩니다.",
          status: meta ? "connected" : "skeleton",
        },
        { title: "알림", body: "조치가 끝나면 이 화면 상단에 짧은 안내가 표시됩니다.", status: "connected" },
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
          <span className="text-sm font-extrabold text-slate-800">리뷰 목록</span>
          <AdminStatusBadge result={list} hint="전체 리뷰 중 생성일 최신순 최대 50건" />
        </div>
        {meta ? <AdminReviewsTable list={list} meta={meta} userById={userById} /> : <AdminRecordTable result={list} errorDisplayContext="reviews" />}
      </div>
    </PageScaffold>
  );
}
