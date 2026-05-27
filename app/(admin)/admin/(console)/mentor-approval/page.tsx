import { AdminMentorApprovalWorkspace } from "@/components/admin/AdminMentorApprovalWorkspace";
import { createClient } from "@/lib/supabase/server";
import { fetchAdminUsersDisplayByIds, loadMentorApprovalsList } from "@/lib/admin/adminQueries";
import { mentorProfilesAdminReadClient } from "@/lib/admin/mentorProfilesAdminRead";
import { toAdminDisplayError } from "@/lib/admin/adminDisplayError";
import { resolveStudentIdImageSignedUrl } from "@/lib/storage/studentIdImageStorage";

type PageProps = { searchParams?: Promise<Record<string, string | string[] | undefined>> };

export default async function AdminMentorApprovalPage(props: PageProps) {
  const sp = (await props.searchParams) ?? {};
  const filter = typeof sp.filter === "string" ? sp.filter : "all";
  const errParam = sp.error;
  const okParam = sp.ok;
  const flashErr =
    typeof errParam === "string" ? (toAdminDisplayError(errParam, "mentorApprovals") ?? "처리에 실패했습니다.") : null;
  const flashOk =
    okParam === "approve"
      ? "승인했습니다."
      : okParam === "reject"
        ? "반려했습니다."
        : okParam === "documents"
          ? "추가 서류를 요청했습니다."
          : null;

  const supabase = await createClient();
  const list = await loadMentorApprovalsList(supabase, 50);
  const readDb = mentorProfilesAdminReadClient(supabase);
  const userIds = list.rows.map((r) => String((r as Record<string, unknown>).user_id ?? "").trim()).filter(Boolean);
  const userMap = await fetchAdminUsersDisplayByIds(readDb, userIds);
  const userById: Record<string, { nickname: string | null; full_name: string | null }> = {};
  userMap.forEach((v, k) => {
    userById[k] = v;
  });

  const studentIdImageSignedUrlByUserId: Record<string, string | null> = {};
  for (const r of list.rows) {
    const uid = String((r as Record<string, unknown>).user_id ?? "").trim();
    if (!uid) continue;
    const stored =
      (typeof (r as Record<string, unknown>).student_id_image_url === "string" &&
        (r as Record<string, unknown>).student_id_image_url) ||
      (typeof (r as Record<string, unknown>).id_card_url === "string" &&
        (r as Record<string, unknown>).id_card_url) ||
      null;
    studentIdImageSignedUrlByUserId[uid] = await resolveStudentIdImageSignedUrl(readDb, String(stored ?? ""));
  }

  return (
    <div className="space-y-4">
      {flashOk ? <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-900">{flashOk}</p> : null}
      {flashErr ? <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-900">{flashErr}</p> : null}
      <AdminMentorApprovalWorkspace
        rows={list.rows as Record<string, unknown>[]}
        userById={userById}
        studentIdImageSignedUrlByUserId={studentIdImageSignedUrlByUserId}
        statusFilter={filter}
        statusColumn={list.keyHints.status ?? null}
      />
    </div>
  );
}
