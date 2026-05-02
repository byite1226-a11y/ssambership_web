import { redirect } from "next/navigation";
import { PageScaffold } from "@/components/shell/PageScaffold";
import { StudentMypageMain } from "@/components/mypage/StudentMypageMain";
import { getPostLoginPath } from "@/lib/auth/getPostLoginPath";
import { getServerUserWithProfile } from "@/lib/auth/getServerUserWithProfile";
import { createClient } from "@/lib/supabase/server";
import { loadStudentMypageBundle, MYPAGE_DATA_MODEL } from "@/lib/mypage/mypageQueries";
import { USER_UI_OPS_ISSUE } from "@/lib/constants/userFacingMessages";

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
  if (bundle.profileError) {
    console.error("[mypage] profileError", bundle.profileError);
  }

  return (
    <PageScaffold
      eyebrow="마이페이지"
      title="마이페이지"
      description="프로필과 구독·질문방·결제·캐시·알림 등 주요 메뉴로 바로 이동할 수 있어요."
      ctas={[
        { href: "/home", label: "학생 홈", tone: "slate" },
        { href: "/question-room", label: "질문방", tone: "blue" },
        { href: "/custom-request/orders", label: "맞춤의뢰 주문", tone: "slate" },
        { href: "/notifications", label: "알림", tone: "slate" },
        { href: "/support/disputes", label: "분쟁", tone: "slate" },
        { href: "/subscriptions", label: "구독", tone: "slate" },
        { href: "/wallet/charge", label: "캐시·지갑", tone: "slate" },
      ]}
      sections={bundle.scaffoldSummary}
      emptyState={
        bundle.profile
          ? "프로필의 닉네임·학년 등 필수 정보를 채우면 다음 단계로 진행할 수 있어요."
          : "계정 정보를 준비하는 중일 수 있어요. 잠시 후 다시 확인해 주세요."
      }
      loadingState="불러오는 중입니다."
      errorState={bundle.profileError ? USER_UI_OPS_ISSUE : "—"}
      dataPoints={[...MYPAGE_DATA_MODEL]}
    >
      <StudentMypageMain bundle={bundle} sessionEmail={user.email ?? null} />
    </PageScaffold>
  );
}
