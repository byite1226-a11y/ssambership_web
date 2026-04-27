import { PageScaffold } from "@/components/shell/PageScaffold";
import { CashTopUpEntry } from "@/components/cash/CashTopUpEntry";
import { getServerUserWithProfile } from "@/lib/auth/getServerUserWithProfile";
import { createClient } from "@/lib/supabase/server";
import { CASH_DATA_MODEL, fetchCashTopupPackages, fetchWalletBalanceByUserId, formatWalletRowDisplay } from "@/lib/cash/cashQueries";

export default async function PublicCashTopUpPage() {
  const supabase = await createClient();
  const { user, profile } = await getServerUserWithProfile();
  const pkg = await fetchCashTopupPackages(supabase);

  let balanceLine = "";
  let balanceError: string | null = null;
  if (user && profile?.role === "student") {
    const w = await fetchWalletBalanceByUserId(supabase, user.id);
    if (w.error) balanceError = w.error;
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
        { title: "충전 패키지", body: "cash_* 패키지 카탈로그(테이블 후보 조회).", status: "skeleton" },
        { title: "잔액(학생)", body: "wallets 계열 1행 조회(로그인 학생만).", status: "skeleton" },
        { title: "유의사항", body: "캐시·원장 전용, 맞춤의뢰 제외.", status: "skeleton" },
        { title: "결제 연동", body: "payments + notifications (추후).", status: "skeleton" },
      ]}
      emptyState="로그인하지 않으면 잔액은 비어 있고, 충전 패키지는 스키마 연결 후 표시됩니다."
      loadingState="서버에서 한 번에 조회합니다(추후 Suspense/클라이언트 전환 가능)."
      errorState="테이블 미생성·RLS·컬럼명 불일치 시 하단에 오류/빈 상태로 구분됩니다."
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
