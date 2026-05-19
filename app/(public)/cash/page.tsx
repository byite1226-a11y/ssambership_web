import { redirect } from "next/navigation";
import { PageScaffold } from "@/components/shell/PageScaffold";
import { CashTopUpEntry } from "@/components/cash/CashTopUpEntry";
import { getServerUserWithProfile } from "@/lib/auth/getServerUserWithProfile";
import { createClient } from "@/lib/supabase/server";
import { fetchCashTopupPackages, fetchWalletBalanceByUserId, formatWalletRowDisplay } from "@/lib/cash/cashQueries";
import { USER_UI_OPS_ISSUE } from "@/lib/constants/userFacingMessages";

const CASH_PUBLIC_DATA_POINTS = [
  "충전 금액(패키지) 안내",
  "학생 로그인 후 잔액 확인",
  "캐시 사용 내역은 원장 메뉴에서 확인",
  "멤버십 구독은 별도 메뉴에서 진행",
  "결제·알림은 단계적으로 연결 예정",
] as const;

export default async function PublicCashTopUpPage() {
  const supabase = await createClient();
  const { user, profile } = await getServerUserWithProfile();
  if (profile?.role === "mentor") {
    redirect("/mentor/dashboard");
  }
  const pkg = await fetchCashTopupPackages(supabase);
  if (pkg.error) {
    /* 패키지 조회 실패는 상단 안내로 처리 */
  }

  let balanceLine = "";
  let balanceError: string | null = null;
  if (user && profile?.role === "student") {
    const w = await fetchWalletBalanceByUserId(supabase, user.id);
    if (w.error) {
      balanceError = w.error;
    } else if (w.row) balanceLine = formatWalletRowDisplay(w.row);
  }

  return (
    <PageScaffold
      hideFooterPlaceholderCards
      eyebrow="캐시"
      title="캐시 충전"
      description="캐시 충전 안내와 충전 상품을 확인하고, 학생 로그인 후 정식 충전 화면으로 이동할 수 있습니다. 맞춤의뢰 결제와는 별도입니다."
      ctas={[
        { href: `/login/student?next=${encodeURIComponent("/cash")}`, label: "학생 로그인", tone: "blue" },
        { href: "/wallet/charge", label: "캐시 충전(정식·학생)", tone: "blue" },
        { href: "/wallet/ledger", label: "캐시 원장(정식·학생)", tone: "slate" },
        { href: "/mentors", label: "멤버십(멘토 선택)", tone: "slate" },
      ]}
      sections={[
        { title: "충전 안내", body: "아래에서 충전 상품과 잔액을 확인한 뒤, 필요 시 정식 충전 화면으로 이동하세요.", status: "connected" },
        { title: "잔액", body: "학생으로 로그인하면 현재 잔액을 볼 수 있어요.", status: "connected" },
        { title: "이용 범위", body: "캐시는 멤버십·질문 등 서비스 내 이용에 쓰여요.", status: "connected" },
        { title: "맞춤의뢰", body: "맞춤의뢰 주문·결제는 전용 메뉴에서 진행해 주세요.", status: "connected" },
      ]}
      emptyState="표시할 항목이 없을 수 있어요. 아래에서 안내를 확인해 주세요."
      loadingState="불러오는 중입니다."
      errorState={pkg.error || balanceError ? USER_UI_OPS_ISSUE : "—"}
      dataPoints={[...CASH_PUBLIC_DATA_POINTS]}
    >
      <CashTopUpEntry
        balanceLine={balanceLine}
        balanceLoading={false}
        balanceError={balanceError}
        packageRows={pkg.rows}
        packageError={pkg.error}
        notices={
          <>
            <p>· 캐시는 충전, 잔액 확인, 사용 내역(원장) 확인 전용입니다.</p>
            <p>· 맞춤의뢰·견적 기반 맞춤 거래는 이 화면에 섞지 않습니다.</p>
            <p>· 멤버십 구독은 멘토 선택 후 구독·결제 화면에서 진행합니다(캐시와 분리).</p>
          </>
        }
        primaryCta={{ href: `/login/student?next=${encodeURIComponent("/cash")}`, label: "학생 로그인 후 충전" }}
        secondaryCta={{ href: "/wallet/charge", label: "학생 캐시 충전 화면" }}
      />
    </PageScaffold>
  );
}
