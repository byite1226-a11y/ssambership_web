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
        eyebrow="Subscribe"
        title="멘토를 선택해 주세요"
        description="URL에 mentorId(멘토 users.id)가 필요합니다. 멘토 상세·목록에서 구독으로 진입하세요. 더미 없음."
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
    return (
      <PageScaffold
        eyebrow="Subscribe"
        title="멘토를 불러올 수 없습니다"
        description={data.message}
        ctas={[
          { href: "/mentors", label: "멘토 찾기", tone: "slate" },
        ]}
        sections={[]}
        emptyState=""
        dataPoints={[...SUBSCRIBE_PAGE_DATA_MODEL]}
      >
        <p className="text-sm text-red-800">{data.message}</p>
      </PageScaffold>
    );
  }

  const d = data;
  const hasPlanData = d.plans.rows.length > 0;
  const hasPlanForTier = Boolean(d.byTier[planParam]);

  return (
    <PageScaffold
      eyebrow="Student / Subscribe"
      title="구독·결제"
      description="멘토·티어는 URL/카드로 고정, CTA는 /api/subscribe intent→complete(스텁). PG·웹훅·환불은 후속."
      ctas={[
        { href: `/mentors/${d.mentorId}`, label: "멘토 공개 프로필", tone: "slate" },
        { href: "/subscriptions", label: "내 구독", tone: "green" },
      ]}
      sections={[
        { title: "멘토", body: d.display.displayName, status: "connected" },
        { title: "플랜", body: d.plans.probe, status: hasPlanData ? "connected" : "skeleton" },
        { title: "기존 구독", body: d.subscription.probe, status: d.subscription.row ? "connected" : "skeleton" },
        { title: "결제(샘플)", body: d.payment.probe, status: d.payment.row ? "connected" : "skeleton" },
      ]}
      emptyState="멘토 미선택 시 상단 no_mentor."
      loadingState="loading.tsx"
      errorState={d.plans.error ?? d.profileError ?? "—"}
      dataPoints={[...SUBSCRIBE_PAGE_DATA_MODEL]}
    >
      <div className="space-y-6">
        {d.plans.error || !hasPlanData
          ? (
              <div className="rounded-2xl border border-amber-200 bg-amber-50/95 p-4 text-sm text-amber-950" role="status">
                <p className="font-bold">구독을 시작하려면 멘토 요금제(멘토 플랜)가 필요합니다.</p>
                <p className="mt-1">
                  {d.plans.error
                    ? `플랜을 불러오지 못했습니다: ${d.plans.error}`
                    : "이 멘토에 등록된 플랜이 아직 없습니다. 멘토가 요금제를 등록하거나, 운영/스테이징 DB에 mentor_plans가 있는지 확인하세요."}
                </p>
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
            subscriptionProbe={d.subscription.probe}
            paymentProbe={d.payment.probe}
            hasSubRow={Boolean(d.subscription.row)}
          />
          <PaymentForm
            mentorId={d.mentorId}
            selectedTier={planParam}
            hasPlanForTier={hasPlanForTier}
            disabledReason={
              d.plans.error
                ? `플랜 조회 오류로 결제를 열 수 없습니다: ${d.plans.error}`
                : !hasPlanData
                  ? "멘토 플랜(plans) 데이터가 없습니다."
                  : !hasPlanForTier
                    ? "이 티어에 대응하는 plans 행이 없습니다(상단 프로브 확인)."
                    : undefined
            }
          />
        </div>
        <p className="text-xs text-slate-500">
          공개 <code>mentor_profiles</code>와 직접 대화 시나리오는 RLS·정책 확정과 동일. 편집 전용(이름 입력 없음) 필드는 멘토
          쪽 이전 응답과 동일.
        </p>
        <p className="text-xs text-slate-500">
          이후: PG 위젯 자리, 웹훅에서 동일 complete, <Link href="/payments" className="font-bold text-blue-700">/payments</Link> 상세 정합.
        </p>
      </div>
    </PageScaffold>
  );
}
