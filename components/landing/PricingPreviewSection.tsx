import Link from "next/link";
import {
  priceLabelFromPlanRow,
  weeklyQuestionsLabel,
  type PlansByTier,
} from "@/lib/subscribe/subscribePageQueries";
import type { GlobalPlansLoad } from "@/lib/landing/landingPageQueries";

const TIERS: { id: keyof PlansByTier; label: string; rec?: boolean }[] = [
  { id: "limited", label: "Limited" },
  { id: "standard", label: "Standard", rec: true },
  { id: "premium", label: "Premium" },
];

export function PricingPreviewSection(props: { plans: GlobalPlansLoad; byTier: PlansByTier; fillProbe: string }) {
  const { plans, byTier, fillProbe } = props;
  void fillProbe;
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-extrabold text-slate-900">요금제 미리보기</h2>
          <p className="mt-1 text-xs text-slate-500">아래 금액은 안내용이며, 멘토를 선택하면 확정 요금을 확인할 수 있어요.</p>
        </div>
        <Link href="/mentors" className="text-sm font-extrabold text-blue-700 underline">
          멘토 선택·구독/결제 →
        </Link>
      </div>
      {plans.error ? <p className="mt-2 text-sm font-bold text-red-800">{plans.error}</p> : null}
      <div className="mt-4 grid gap-4 md:grid-cols-3">
        {TIERS.map((t) => {
          const row = byTier[t.id];
          return (
            <div
              key={t.id}
              className={`rounded-xl border p-4 ${t.rec ? "border-emerald-500 ring-2 ring-emerald-100" : "border-slate-100"}`}
            >
              <div className="flex items-center justify-between">
                <h3 className="font-black text-slate-900">{t.label}</h3>
                {t.rec ? <span className="text-xs font-bold text-emerald-700">추천</span> : null}
              </div>
              <p className="mt-2 text-xl font-black text-slate-900">{priceLabelFromPlanRow(row)}</p>
              <p className="mt-1 text-xs text-slate-600">주간 신규 질문: {weeklyQuestionsLabel(row)}</p>
            </div>
          );
        })}
      </div>
      <p className="mt-3 text-xs text-slate-500">멘토별 가격은 멘토 선택 후 구독 화면에서 최종 확인해 주세요.</p>
    </section>
  );
}
