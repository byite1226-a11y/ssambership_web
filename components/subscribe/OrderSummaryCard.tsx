import {
  priceLabelFromPlanRow,
  weeklyQuestionsLabel,
  type PlansByTier,
  type SubscribePlanTier,
} from "@/lib/subscribe/subscribePageQueries";

export function OrderSummaryCard(props: {
  mentorName: string;
  selectedTier: SubscribePlanTier;
  byTier: PlansByTier;
  hasSubRow: boolean;
}) {
  const row = props.byTier[props.selectedTier];
  return (
    <section className="rounded-2xl border border-slate-200 bg-slate-50/80 p-5">
      <h3 className="text-sm font-extrabold text-slate-900">주문 요약</h3>
      <dl className="mt-3 space-y-2 text-sm">
        <div className="flex justify-between gap-2">
          <dt className="text-slate-500">멘토</dt>
          <dd className="font-bold text-slate-900">{props.mentorName}</dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-slate-500">플랜</dt>
          <dd className="font-bold text-slate-900">{props.selectedTier.toUpperCase()}</dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-slate-500">결제 예정</dt>
          <dd className="font-extrabold text-slate-900">{priceLabelFromPlanRow(row, props.selectedTier)}</dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-slate-500">주간 질문</dt>
          <dd className="text-slate-800">{weeklyQuestionsLabel(row)}</dd>
        </div>
        <div className="border-t border-slate-200 pt-2 text-xs text-slate-500">
          <p>기존 구독: {props.hasSubRow ? "있음" : "없음"}</p>
          <p className="mt-1">최근 결제 정보는 멘토·플랜 설정에 따라 달라질 수 있어요.</p>
        </div>
      </dl>
    </section>
  );
}
