import Link from "next/link";
import { PageScaffold } from "@/components/shell/PageScaffold";
import { MentorCheckoutSummary } from "@/components/subscribe/MentorCheckoutSummary";
import { OrderSummaryCard } from "@/components/subscribe/OrderSummaryCard";
import { PaymentForm } from "@/components/subscribe/PaymentForm";
import { PlanComparisonCards } from "@/components/subscribe/PlanComparisonCards";
import { PromotionNoticeBox } from "@/components/subscribe/PromotionNoticeBox";
import { requireRole } from "@/lib/auth/routeGuard";
import { SUBSCRIBE_PAGE_DATA_MODEL } from "@/lib/subscribe/subscribeDataModel";
import { loadStudentSubscribePage, type SubscribePlanTier } from "@/lib/subscribe/subscribePageQueries";
import { createClient } from "@/lib/supabase/server";
import { USER_UI_LOAD_FAILED, USER_UI_NOTHING_TO_SHOW, USER_UI_OPS_ISSUE } from "@/lib/constants/userFacingMessages";

type Props = { searchParams?: Promise<Record<string, string | string[] | undefined>> };

function one(sp: Record<string, string | string[] | undefined>, k: string): string | undefined {
  const v = sp[k];
  if (Array.isArray(v)) return v[0];
  return typeof v === "string" && v ? v : undefined;
}

function parseSelectedPlan(v: string | undefined): SubscribePlanTier {
  if (v === "limited" || v === "standard" || v === "premium") return v;
  return "standard";
}

export default async function StudentSubscribePage(props: Props) {
  const { user } = await requireRole("student");
  const sp = (await props.searchParams) ?? {};
  const mentorId = one(sp, "mentorId") ?? null;
  const planParam = parseSelectedPlan(one(sp, "plan"));
  const checkoutSuccess = one(sp, "success") === "1";
  const supabase = await createClient();
  const data = await loadStudentSubscribePage(supabase, { mentorId, studentId: user.id });

  if (data.kind === "no_mentor") {
    return (
      <PageScaffold
        hideFooterPlaceholderCards
        eyebrow="Subscribe"
        title="멘토를 선택해 주세요"
        description="멘토를 선택한 뒤 구독 화면으로 들어와 주세요. 멘토 상세 또는 목록에서 구독을 눌러 주세요."
        ctas={[
          { href: "/mentors", label: "멘토 찾기", tone: "blue" },
          { href: "/home", label: "홈", tone: "slate" },
        ]}
        sections={[]}
        emptyState=""
        dataPoints={[...SUBSCRIBE_PAGE_DATA_MODEL]}
      >
        <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-6 text-sm text-amber-950">
          <p>예: <code className="font-mono">/subscribe?mentorId=…</code></p>
          <p className="mt-2">로그인된 학생만 이 화면을 사용할 수 있습니다.</p>
        </div>
      </PageScaffold>
    );
  }

  if (data.kind === "mentor_error") {
    console.error("[subscribe] mentor_error", data.message);
    return (
      <PageScaffold
        hideFooterPlaceholderCards
        eyebrow="구독"
        title="멘토를 불러올 수 없습니다"
        description="멘토 정보를 확인하는 중 문제가 생겼습니다. 잠시 후 다시 시도해 주세요."
        ctas={[
          { href: "/mentors", label: "멘토 찾기", tone: "slate" },
        ]}
        sections={[]}
        emptyState=""
        dataPoints={[...SUBSCRIBE_PAGE_DATA_MODEL]}
      >
        <p className="text-sm text-red-800">{USER_UI_LOAD_FAILED}</p>
      </PageScaffold>
    );
  }

  const d = data;
  const hasPlanData = d.plans.rows.length > 0;
  const hasPlanForTier = Boolean(d.byTier[planParam]);

  return (
    <PageScaffold
      hideFooterPlaceholderCards
      eyebrow="구독"
      title="구독·결제"
      description="선택한 멘토의 플랜을 비교하고 구독·결제를 진행할 수 있습니다."
      ctas={[
        { href: `/mentors/${d.mentorId}`, label: "멘토 공개 프로필", tone: "slate" },
        { href: "/subscriptions", label: "내 구독", tone: "green" },
      ]}
      sections={[
        { title: "멘토", body: d.display.displayName, status: "connected" },
        {
          title: "플랜",
          body: d.plans.error ? USER_UI_LOAD_FAILED : hasPlanData ? "요금제를 불러왔습니다." : USER_UI_NOTHING_TO_SHOW,
          status: hasPlanData ? "connected" : "skeleton",
        },
        {
          title: "기존 구독",
          body: d.subscription.row ? "이전 구독 정보가 있습니다." : "표시할 기존 구독이 없습니다.",
          status: d.subscription.row ? "connected" : "skeleton",
        },
        {
          title: "결제",
          body: d.payment.row ? "최근 결제 정보를 확인했습니다." : "표시할 결제 샘플이 없습니다.",
          status: d.payment.row ? "connected" : "skeleton",
        },
      ]}
      emptyState={USER_UI_NOTHING_TO_SHOW}
      loadingState="불러오는 중입니다."
      errorState={d.plans.error || d.profileError ? USER_UI_OPS_ISSUE : "—"}
      dataPoints={[...SUBSCRIBE_PAGE_DATA_MODEL]}
    >
      <div className="space-y-6">
        {d.plans.error || !hasPlanData
          ? (
              <div className="rounded-2xl border border-amber-200 bg-amber-50/95 p-4 text-sm text-amber-950" role="status">
                <p className="font-bold">구독을 시작하려면 멘토 요금제가 필요합니다.</p>
                <p className="mt-1">{d.plans.error ? USER_UI_LOAD_FAILED : "이 멘토에 등록된 플랜이 아직 없을 수 있어요. 잠시 후 다시 확인해 주세요."}</p>
              </div>
            )
          : null}
        {checkoutSuccess
          ? (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/90 p-4 text-sm text-emerald-950">
                <p className="font-extrabold">구독 결제·완료 처리가 끝났습니다.</p>
                <p className="mt-1">질문방에서 멘토와 이어갈 수 있습니다. (room ID가 있으면 intent 완료 직후 질문방으로 이동합니다.)</p>
                <p className="mt-2 flex flex-wrap gap-2 text-xs">
                  <Link className="font-bold text-blue-800 underline" href="/question-room">
                    질문방 목록
                  </Link>
                  <Link className="font-bold text-blue-800 underline" href="/subscriptions">
                    내 구독
                  </Link>
                </p>
              </div>
            )
          : null}
        <MentorCheckoutSummary mentorId={d.mentorId} display={d.display} profileError={d.profileError} />
        <PlanComparisonCards
          mentorId={d.mentorId}
          byTier={d.byTier}
          selectedTier={planParam}
          plansError={d.plans.error}
          plansProbe={d.plans.probe}
          fillProbe={d.fillProbe}
        />
        <PromotionNoticeBox promotions={d.promotions} />
        <div className="grid gap-4 lg:grid-cols-2">
          <OrderSummaryCard
            mentorName={d.display.displayName}
            selectedTier={planParam}
            byTier={d.byTier}
            hasSubRow={Boolean(d.subscription.row)}
          />
          <PaymentForm
            mentorId={d.mentorId}
            selectedTier={planParam}
            hasPlanForTier={hasPlanForTier}
            disabledReason={
              d.plans.error
                ? USER_UI_LOAD_FAILED
                : !hasPlanData
                  ? "표시할 멘토 요금제가 없습니다."
                  : !hasPlanForTier
                    ? "선택한 플랜에 맞는 요금제가 없습니다. 다른 티어를 선택해 주세요."
                    : undefined
            }
          />
        </div>
        <p className="text-xs text-slate-500">결제는 안내에 따라 진행되며, 완료 후 질문방 등 후속 단계가 이어질 수 있어요.</p>
        <p className="text-xs text-slate-500">
          결제 내역은 <Link href="/payments" className="font-bold text-blue-700">결제 목록</Link>에서 확인할 수 있어요.
        </p>
      </div>
    </PageScaffold>
  );
}
