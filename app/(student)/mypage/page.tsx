import { redirect } from "next/navigation";
import { PageScaffold } from "@/components/shell/PageScaffold";
import { StudentMypageMain } from "@/components/mypage/StudentMypageMain";
import { getPostLoginPath } from "@/lib/auth/getPostLoginPath";
import { getServerUserWithProfile } from "@/lib/auth/getServerUserWithProfile";
import { createClient } from "@/lib/supabase/server";
import { loadStudentMypageBundle, MYPAGE_DATA_MODEL } from "@/lib/mypage/mypageQueries";

export default async function StudentMyPage() {
  const { user, profile, error: profileLoadError } = await getServerUserWithProfile();
  if (!user) {
    redirect(`/login/student?next=${encodeURIComponent("/mypage")}`);
  }
  if (profile && profile.role !== "student") {
    redirect(getPostLoginPath(profile.role));
  }

  const supabase = await createClient();
  const bundle = await loadStudentMypageBundle(
    supabase,
    user.id,
    profile,
    profileLoadError?.message ?? null
  );

  return (
    <PageScaffold
      eyebrow="Student / MyPage"
      title="마이페이지"
      description="프로필·구독·질문방·결제/캐시 진입·알림·리뷰/신고 자리를 한 화면에 묶습니다. 질문방/캐시/커뮤니티 로직은 기존 라우트를 그대로 가리킵니다."
      ctas={[
        { href: "/home", label: "학생 홈", tone: "slate" },
        { href: "/question-room", label: "질문방", tone: "blue" },
        { href: "/notifications", label: "알림", tone: "slate" },
        { href: "/support/disputes", label: "분쟁", tone: "slate" },
        { href: "/subscriptions", label: "구독", tone: "slate" },
        { href: "/wallet/charge", label: "캐시·지갑", tone: "slate" },
      ]}
      sections={bundle.scaffoldSummary}
      emptyState={
        bundle.profile
          ? "닉네임·학년 등 필수 필드가 비어 있으면 완성 CTA(다음 단계)."
          : "public.users에 아직 행이 없으면 가입 sync(트리거) 또는 수동 upsert를 점검합니다."
      }
      loadingState="loading.tsx"
      errorState={
        bundle.profileError
          ? `프로필 조회: ${bundle.profileError}`
          : "Supabase RLS·네트워크 오류 시 재시도/지원 안내(로그는 서버)."
      }
      dataPoints={[...MYPAGE_DATA_MODEL]}
    >
      <StudentMypageMain bundle={bundle} sessionEmail={user.email ?? null} />
    </PageScaffold>
  );
}
