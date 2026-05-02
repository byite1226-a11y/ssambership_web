import { PageScaffold } from "@/components/shell/PageScaffold";
import { CashTopUpEntry } from "@/components/cash/CashTopUpEntry";
import { getServerUserWithProfile } from "@/lib/auth/getServerUserWithProfile";
import { createClient } from "@/lib/supabase/server";
import { CASH_DATA_MODEL, fetchCashTopupPackages, fetchWalletBalanceByUserId, formatWalletRowDisplay } from "@/lib/cash/cashQueries";
import { USER_UI_OPS_ISSUE } from "@/lib/constants/userFacingMessages";

export default async function PublicCashTopUpPage() {
  const supabase = await createClient();
  const { user, profile } = await getServerUserWithProfile();
  const pkg = await fetchCashTopupPackages(supabase);
  if (pkg.error) {
    console.error("[cash] packages", pkg.error);
  }

  let balanceLine = "";
  let balanceError: string | null = null;
  if (user && profile?.role === "student") {
    const w = await fetchWalletBalanceByUserId(supabase, user.id);
    if (w.error) {
      balanceError = w.error;
      console.error("[cash] wallet balance", w.error);
    }
    else if (w.row) balanceLine = formatWalletRowDisplay(w.row);
  }

  return (
    <PageScaffold
      eyebrow="Public / Cash"
      title="캐시 충전"
      description="캐시 충전·잔액·원장은 본 흐름에서만 다루며, 맞춤의뢰(커스텀 거래)와 섞지 않습니다."
      ctas={[
        { href: `/login/student?next=${encodeURIComponent("/cash")}`, label: "학생 로그인", tone: "blue" },
        { href: "/wallet/charge", label: "캐시 충전(정식·학생)", tone: "blue" },
        { href: "/wallet/ledger", label: "캐시 원장(정식·학생)", tone: "slate" },
        { href: "/mentors", label: "멤버십(멘토 선택)", tone: "slate" },
      ]}
      sections={[
        { title: "충전 패키지", body: "이용 가능한 충전 금액을 선택할 수 있어요.", status: "skeleton" },
        { title: "잔액", body: "로그인한 학생은 잔액을 확인할 수 있어요.", status: "skeleton" },
        { title: "유의사항", body: "캐시는 멤버십·질문 등 서비스 내 이용에 쓰여요.", status: "skeleton" },
        { title: "결제", body: "결제 연동은 단계적으로 확장됩니다.", status: "skeleton" },
      ]}
      emptyState="표시할 항목이 없을 수 있어요. 아래에서 안내를 확인해 주세요."
      loadingState="불러오는 중입니다."
      errorState={pkg.error || balanceError ? USER_UI_OPS_ISSUE : "—"}
      dataPoints={["cash_topup_packages(후보)", "wallets(후보)", "payments", "refunds", "subscriptions(구독, 분리)", "notifications"]}
    >
      <CashTopUpEntry
        balanceLine={balanceLine}
        balanceLoading={false}
        balanceError={balanceError}
        packageRows={pkg.rows}
        packageError={pkg.error}
        packageTable={pkg.table}
        notices={
          <>
            <p>· 캐시는 충전, 잔액 확인, 사용 내역(원장) 확인 전용입니다.</p>
            <p>· 맞춤의뢰·견적 기반 맞춤 거래는 이 화면에 섞지 않습니다.</p>
            <p>· 멤버십 구독은 /mentors에서 멘토 선택 후 /subscribe?mentorId=… /subscriptions 흐름입니다(캐시와 분리).</p>
          </>
        }
        primaryCta={{ href: `/login/student?next=${encodeURIComponent("/cash")}`, label: "학생 로그인 후 충전" }}
        secondaryCta={{ href: "/wallet/charge", label: "정식: 캐시 충전(/wallet/charge)" }}
        dataModelPoints={CASH_DATA_MODEL}
      />
    </PageScaffold>
  );
}
