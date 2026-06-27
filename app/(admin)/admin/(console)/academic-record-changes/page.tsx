import { AdminAcademicRecordChangeWorkspace } from "@/components/admin/AdminAcademicRecordChangeWorkspace";
import { AdminListToolbar } from "@/components/admin/AdminListToolbar";
import { AdminListPagination } from "@/components/admin/AdminListPagination";
import { requireRole } from "@/lib/auth/routeGuard";
import { createClient } from "@/lib/supabase/server";
import {
  countAdminAcademicRecordChangesByStatus,
  fetchAdminUsersDisplayByIds,
  loadAdminAcademicRecordChangesListPaged,
} from "@/lib/admin/adminQueries";
import { mentorProfilesAdminReadClient } from "@/lib/admin/mentorProfilesAdminRead";
import { fetchAcademicRecordChangeProfilesByIds } from "@/lib/admin/mentorAcademicRecordChangeReview";
import type { MentorAcademicRecordChangeRow } from "@/lib/mentor/mentorAcademicRecordChange";
import { resolveStudentIdImageSignedUrl } from "@/lib/storage/studentIdImageStorage";
import { parseAdminListParams } from "@/lib/admin/adminListParams";

type PageProps = { searchParams?: Promise<Record<string, string | string[] | undefined>> };

export default async function AdminAcademicRecordChangesPage(props: PageProps) {
  await requireRole("admin");
  const sp = (await props.searchParams) ?? {};
  const flashErr = typeof sp.error === "string" ? sp.error : null;
  const okParam = typeof sp.ok === "string" ? sp.ok : null;
  const flashOk =
    okParam === "approve"
      ? "학적변경요청을 승인하고 학교 정보를 반영했습니다."
      : okParam === "reject"
        ? "학적변경요청을 반려했습니다."
        : okParam === "resubmit"
          ? "재제출을 요청했습니다."
          : null;

  const supabase = await createClient();
  // [보안 주석] service_role로 RLS 우회
  // 이 페이지는 (admin)/layout.tsx + (admin)/(console)/layout.tsx
  // 이중 requireRole("admin") 가드로 보호됨. 관리자 업무상 의도된 사용임.
  const readDb = mentorProfilesAdminReadClient(supabase);
  const params = parseAdminListParams(sp, { defaultPageSize: 25, defaultStatus: "pending" });
  const [paged, byStatus] = await Promise.all([
    loadAdminAcademicRecordChangesListPaged(supabase, params),
    countAdminAcademicRecordChangesByStatus(supabase),
  ]);
  const list = {
    rows: paged.rows as unknown as MentorAcademicRecordChangeRow[],
    error: paged.error,
  };
  const ACADEMIC_BASE_PATH = "/admin/academic-record-changes";
  const statusTabs = [
    { value: "pending", label: "대기", count: byStatus.pending ?? 0 },
    { value: "resubmit_required", label: "재제출 필요", count: byStatus.resubmit_required ?? 0 },
    { value: "approved", label: "승인", count: byStatus.approved ?? 0 },
    { value: "rejected", label: "반려", count: byStatus.rejected ?? 0 },
    { value: "all", label: "전체", count: byStatus.all ?? 0 },
  ];

  const mentorIds = list.rows.map((r) => r.mentor_id).filter(Boolean);
  const [userMap, profileByMentorId] = await Promise.all([
    fetchAdminUsersDisplayByIds(readDb, mentorIds),
    fetchAcademicRecordChangeProfilesByIds(readDb, mentorIds),
  ]);

  const userById: Record<string, { nickname: string | null; full_name: string | null }> = {};
  userMap.forEach((v, k) => {
    userById[k] = v;
  });

  const signedUrlById: Record<string, string | null> = {};
  for (const r of list.rows) {
    signedUrlById[r.id] = await resolveStudentIdImageSignedUrl(readDb, r.document_storage_ref);
  }

  return (
    <div className="space-y-4">
      {flashOk ? (
        <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-900">{flashOk}</p>
      ) : null}
      {flashErr ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-900">{flashErr}</p>
      ) : null}
      <div>
        <h1 className="text-xl font-black text-slate-900">학적변경 요청</h1>
        <p className="mt-1 text-sm font-medium text-slate-500">
          멘토가 제출한 학적 변동 증명 서류를 확인하고 학교 정보를 갱신합니다.
        </p>
      </div>
      <AdminListToolbar
        basePath={ACADEMIC_BASE_PATH}
        params={params}
        searchPlaceholder="요청 ID/멘토/대학교/사유로 검색"
        statusTabs={statusTabs}
      />
      <AdminAcademicRecordChangeWorkspace
        rows={list.rows}
        loadError={list.error}
        userById={userById}
        profileByMentorId={profileByMentorId}
        signedUrlById={signedUrlById}
      />
      <AdminListPagination
        basePath={ACADEMIC_BASE_PATH}
        params={params}
        totalCount={paged.totalCount}
        rowsOnPage={list.rows.length}
      />
    </div>
  );
}
