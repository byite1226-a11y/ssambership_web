import Link from "next/link";
import { PageScaffold } from "@/components/shell/PageScaffold";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/routeGuard";
import { fetchMentorProfileRow } from "@/lib/mentor/mentorProfileQueries";
import { getUserProfileById } from "@/lib/auth/getCurrentProfile";
import { buildMentorProfileDisplay, mentorVerificationKo } from "@/lib/mentor/mentorDisplayFields";

type Props = { params: Promise<{ id: string }> };

/** `id`는 멘토 `user_id`(uuid)로 해석합니다. */
export default async function AdminMentorApprovalDetailPage(props: Props) {
  await requireRole("admin");
  const { id } = await props.params;
  const supabase = await createClient();
  const { row, error } = await fetchMentorProfileRow(supabase, id);
  const { data: userRow } = await getUserProfileById(supabase, id);
  const display = buildMentorProfileDisplay(row, userRow ?? null);

  return (
    <PageScaffold
      hideFooterPlaceholderCards
      eyebrow="관리자 / 멘토 승인"
      title="멘토 승인 상세"
      description="멘토 프로필·인증 상태를 확인합니다. 승인·반려는 목록 화면의 액션을 사용해 주세요."
      ctas={[
        { href: "/admin/mentor-approvals", label: "목록", tone: "blue" },
        { href: `/mentors/${encodeURIComponent(id)}`, label: "공개 프로필", tone: "slate" },
      ]}
      sections={[]}
      dataPoints={[]}
    >
      <div className="space-y-4">
        <Link href="/admin/mentor-approvals" className="text-sm font-extrabold text-indigo-800 underline" prefetch={false}>
          ← 멘토 승인 목록
        </Link>
        {error ? <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-900">{error}</p> : null}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-extrabold text-slate-900">표시명</p>
          <p className="text-lg font-black text-slate-800">{display.displayName}</p>
          <p className="mt-2 text-sm text-slate-600">
            인증: <span className="font-bold">{mentorVerificationKo(display.verification)}</span>
          </p>
          <p className="mt-3 text-xs text-slate-500">서류 이미지·반려 사유 필드는 스키마 확정 후 이 화면에 붙일 수 있어요.</p>
        </div>
      </div>
    </PageScaffold>
  );
}
