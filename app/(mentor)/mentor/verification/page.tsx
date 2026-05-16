import Link from "next/link";
import { PageScaffold } from "@/components/shell/PageScaffold";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/routeGuard";
import { fetchMentorProfileRow } from "@/lib/mentor/mentorProfileQueries";
import { buildMentorProfileDisplay, mentorVerificationKo } from "@/lib/mentor/mentorDisplayFields";
import { getUserProfileById } from "@/lib/auth/getCurrentProfile";

export default async function MentorVerificationPage() {
  const { user } = await requireRole("mentor");
  const supabase = await createClient();
  const { row } = await fetchMentorProfileRow(supabase, user.id);
  const { data: userRow } = await getUserProfileById(supabase, user.id);
  const display = buildMentorProfileDisplay(row, userRow ?? null);
  const ver = mentorVerificationKo(display.verification);

  return (
    <PageScaffold
      hideFooterPlaceholderCards
      eyebrow="멘토"
      title="인증·검수 상태"
      description="학생증·운영 검수 상태를 한곳에서 확인합니다. 반려 사유·재제출 마감은 DB 필드·운영 정책 확정 후 이 화면에 확장합니다."
      ctas={[
        { href: "/mentor/profile/edit", label: "프로필·서류 편집", tone: "blue" },
        { href: "/mentor/profile", label: "프로필 요약", tone: "slate" },
      ]}
      sections={[
        { title: "현재 상태", body: ver, status: row ? "connected" : "skeleton" },
        { title: "승인 절차", body: "운영자 검토·반려·재제출은 관리자 콘솔과 연동됩니다.", status: "skeleton" },
      ]}
      dataPoints={["mentor_profiles + verification 관련 열"]}
    >
      <div className="mx-auto max-w-2xl space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-extrabold text-slate-900">표시명</p>
        <p className="text-lg font-black text-slate-800">{display.displayName}</p>
        <p className="text-sm text-slate-600">
          인증 상태: <span className="font-bold text-slate-900">{ver}</span>
        </p>
        {!row ? <p className="text-sm text-amber-800">멘토 프로필 행을 찾지 못했습니다. 프로필 편집에서 정보를 저장해 주세요.</p> : null}
        <p className="text-xs text-slate-500">
          약관·정책 초안은{" "}
          <Link href="/legal/terms" className="font-bold text-blue-700 underline">
            이용약관(안내)
          </Link>
          에서 확인할 수 있어요.
        </p>
      </div>
    </PageScaffold>
  );
}
