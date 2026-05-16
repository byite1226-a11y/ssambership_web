import Link from "next/link";
import { PageScaffold } from "@/components/shell/PageScaffold";
import { MentorCheckoutSummary } from "@/components/subscribe/MentorCheckoutSummary";
import { PaymentForm } from "@/components/subscribe/PaymentForm";
import { PlanComparisonCards } from "@/components/subscribe/PlanComparisonCards";
import { PromotionNoticeBox } from "@/components/subscribe/PromotionNoticeBox";
import { requireRole } from "@/lib/auth/routeGuard";
import {
  loadStudentSubscribePage,
  priceLabelFromPlanRow,
  weeklyQuestionsLabel,
  type SubscribePlanTier,
} from "@/lib/subscribe/subscribePageQueries";
import { createClient } from "@/lib/supabase/server";
import { USER_UI_LOAD_FAILED, USER_UI_OPS_ISSUE } from "@/lib/constants/userFacingMessages";

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

function planTierTitle(tier: SubscribePlanTier): string {
  if (tier === "limited") return "Limited";
  if (tier === "standard") return "Standard";
  return "Premium";
}

function SubscribeSelectionSummary(props: {
  mentorId: string;
  mentorName: string;
  selectedTier: SubscribePlanTier;
  priceLine: string;
  weeklyLine: string;
  canContinue: boolean;
}) {
  const { mentorId, mentorName, selectedTier, priceLine, weeklyLine, canContinue } = props;
  return (
    <div className="rounded-2xl border border-slate-200/95 bg-gradient-to-b from-white to-slate-50/90 p-5 shadow-[0_8px_30px_rgba(15,23,42,0.08)]">
      <p className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-slate-500">선택 요약</p>
      <h2 className="mt-2 break-keep text-lg font-black leading-tight text-slate-900">{mentorName}</h2>
      <dl className="mt-4 space-y-3 text-sm">
        <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-slate-100 pb-3">
          <dt className="font-bold text-slate-500">플랜</dt>
          <dd className="text-right font-black text-slate-900">{planTierTitle(selectedTier)}</dd>
        </div>
        <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-slate-100 pb-3">
          <dt className="font-bold text-slate-500">예상 요금</dt>
          <dd className="break-keep text-right text-lg font-black text-blue-700">{priceLine}</dd>
        </div>
        <div>
          <dt className="font-bold text-slate-500">질문 한도</dt>
          <dd className="mt-1 break-keep font-semibold text-slate-800">{weeklyLine}</dd>
        </div>
      </dl>
      <div className="mt-5 rounded-xl border border-blue-100 bg-blue-50/80 p-3 text-xs leading-relaxed text-blue-950">
        <p className="font-extrabold">무료 질문</p>
        <p className="mt-1">
          가입 후 제공되는 <strong>무료 15회 질문</strong>을 활용할 수 있어요. 자세한 조건은 아래 안내를 함께 봐 주세요.
        </p>
      </div>
      <div className="mt-3 rounded-xl border border-amber-100 bg-amber-50/85 p-3 text-xs leading-relaxed text-amber-950">
        <p className="font-extrabold">구매 전에 알아두면 좋아요</p>
        <ul className="mt-1.5 list-inside list-disc space-y-1">
          <li>환불·해지는 서비스 정책을 따릅니다.</li>
          <li>결제가 끝나면 질문방으로 이어질 수 있어요.</li>
        </ul>
      </div>
      <p className="mt-4 text-xs leading-relaxed text-slate-500">선택한 플랜은 결제 전에 다시 바꿀 수 있어요.</p>
      {canContinue ? (
        <a
          href="/subscribe#subscribe-payment"
          className="mt-4 flex min-h-[48px] w-full items-center justify-center rounded-xl bg-blue-600 px-4 text-center text-sm font-extrabold text-white shadow-md transition hover:bg-blue-700"
        >
          이 플랜으로 계속하기
        </a>
      ) : (
        <span className="mt-4 flex min-h-[48px] w-full items-center justify-center rounded-xl bg-slate-200 px-4 text-center text-sm font-extrabold text-slate-500">
          이 플랜으로 계속하기
        </span>
      )}
      <Link
        href={`/mentors/${encodeURIComponent(mentorId)}`}
        className="mt-3 block text-center text-sm font-bold text-slate-600 underline decoration-slate-300 underline-offset-2 hover:text-slate-900"
      >
        멘토 프로필로 돌아가기
      </Link>
    </div>
  );
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
        eyebrow="구독"
        title="멘토를 먼저 골라 주세요"
        description="멘토 상세나 목록에서 구독을 누르면 이 화면으로 연결돼요."
        ctas={[
          { href: "/mentors", label: "멘토 찾기", tone: "blue" },
          { href: "/home", label: "홈", tone: "slate" },
        ]}
        sections={[]}
        emptyState=""
        dataPoints={[]}
      >
        <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-6 text-sm text-amber-950">
          <p>멘토를 선택한 뒤 다시 들어와 주세요.</p>
          <p className="mt-2 text-slate-700">학생 계정으로 로그인한 상태에서 이용할 수 있어요.</p>
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
        title="멘토 정보를 불러오지 못했어요"
        description="잠시 후 다시 시도해 주세요."
        ctas={[
          { href: "/mentors", label: "멘토 찾기", tone: "slate" },
        ]}
        sections={[]}
        emptyState=""
        dataPoints={[]}
      >
        <p className="text-sm text-red-800">{USER_UI_LOAD_FAILED}</p>
      </PageScaffold>
    );
  }

  const d = data;
  const hasPlanData = d.plans.rows.length > 0;
  const hasPlanForTier = Boolean(d.byTier[planParam]);
  const selectedRow = d.byTier[planParam];
  const priceLine = priceLabelFromPlanRow(selectedRow);
  const weeklyLine = weeklyQuestionsLabel(selectedRow);
  const canContinue = !d.plans.error && hasPlanData && hasPlanForTier;

  const summaryProps = {
    mentorId: d.mentorId,
    mentorName: d.display.displayName,
    selectedTier: planParam,
    priceLine,
    weeklyLine,
    canContinue,
  } as const;

  return (
    <PageScaffold
      hideFooterPlaceholderCards
      eyebrow="구독"
      title="구독·결제"
      description="멘토와 연결할 플랜을 골라 보세요. 아래에서 결제를 이어가면 돼요."
      ctas={[
        { href: `/mentors/${d.mentorId}`, label: "멘토 공개 프로필", tone: "slate" },
        { href: "/subscriptions", label: "내 구독", tone: "green" },
      ]}
      sections={[]}
      emptyState=""
      loadingState="화면을 준비하고 있어요."
      errorState={d.plans.error || d.profileError ? USER_UI_OPS_ISSUE : "—"}
      dataPoints={[]}
    >
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-start lg:gap-10">
        <div className="min-w-0 space-y-6 lg:col-span-8">
          {d.plans.error || !hasPlanData
            ? (
                <div className="rounded-2xl border border-amber-200 bg-amber-50/95 p-4 text-sm text-amber-950" role="status">
                  <p className="font-bold">이 멘토의 요금제가 필요해요</p>
                  <p className="mt-1">
                    {d.plans.error
                      ? USER_UI_LOAD_FAILED
                      : "등록된 요금제가 아직 없을 수 있어요. 잠시 후 다시 확인해 주세요."}
                  </p>
                </div>
              )
            : null}
          {checkoutSuccess
            ? (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50/90 p-4 text-sm text-emerald-950">
                  <p className="font-extrabold">구독 결제가 완료됐어요</p>
                  <p className="mt-1">질문방에서 멘토와 이어갈 수 있어요.</p>
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
          <section className="space-y-4" aria-labelledby="subscribe-plan-heading">
            <div>
              <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-blue-700">요금제</p>
              <h2 id="subscribe-plan-heading" className="mt-1 text-xl font-black text-slate-900 sm:text-2xl">
                플랜 비교
              </h2>
              <p className="mt-2 max-w-2xl text-sm font-medium leading-relaxed text-slate-600">
                세 가지 티어를 비교한 뒤, 오른쪽 요약에서 결제 단계로 넘어가 주세요. 좁은 화면에서는 요약이 플랜 아래에
                이어져요.
              </p>
            </div>
            <PlanComparisonCards
              mentorId={d.mentorId}
              byTier={d.byTier}
              selectedTier={planParam}
              plansError={d.plans.error}
              plansProbe={d.plans.probe}
              fillProbe={d.fillProbe}
              layout="checkout"
            />
          </section>
          <PromotionNoticeBox promotions={d.promotions} />
          <div className="lg:hidden">
            <SubscribeSelectionSummary {...summaryProps} />
          </div>
          <section id="subscribe-payment" className="scroll-mt-28 space-y-4">
            <PaymentForm
              mentorId={d.mentorId}
              selectedTier={planParam}
              hasPlanForTier={hasPlanForTier}
              disabledReason={
                d.plans.error
                  ? USER_UI_LOAD_FAILED
                  : !hasPlanData
                    ? "이 멘토의 요금제를 찾을 수 없어요. 잠시 후 다시 시도해 주세요."
                    : !hasPlanForTier
                      ? "이 티어의 요금 정보가 아직 없어요. 다른 플랜을 골라 주세요."
                      : undefined
              }
            />
            <p className="text-xs leading-relaxed text-slate-500">
              결제는 안내에 따라 진행되며, 완료 후 질문방 등 다음 단계가 이어질 수 있어요.
            </p>
            <p className="text-xs leading-relaxed text-slate-500">
              결제 내역은 <Link href="/payments" className="font-bold text-blue-700 underline">결제 목록</Link>에서 볼 수
              있어요.
            </p>
          </section>
        </div>
        <aside className="hidden min-w-0 lg:col-span-4 lg:block">
          <div className="lg:sticky lg:top-24">
            <SubscribeSelectionSummary {...summaryProps} />
          </div>
        </aside>
      </div>
    </PageScaffold>
  );
}
