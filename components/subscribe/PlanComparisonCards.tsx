import Link from "next/link";
import {
  type PlansByTier,
  priceLabelFromPlanRow,
  weeklyQuestionsLabel,
  type SubscribePlanTier,
} from "@/lib/subscribe/subscribePageQueries";
import { USER_UI_LOAD_FAILED } from "@/lib/constants/userFacingMessages";

const TIERS: { id: SubscribePlanTier; label: string; recommend?: boolean }[] = [
  { id: "limited", label: "Limited" },
  { id: "standard", label: "Standard", recommend: true },
  { id: "premium", label: "Premium" },
];

export function PlanComparisonCards(props: {
  mentorId: string;
  byTier: PlansByTier;
  selectedTier: SubscribePlanTier;
  plansError: string | null;
  plansProbe: string;
  fillProbe: string;
}) {
  const { mentorId, byTier, selectedTier, plansError, plansProbe, fillProbe } = props;
  void plansProbe;
  void fillProbe;
  if (plansError) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
        <p className="text-sm font-extrabold text-red-900">플랜 조회 오류</p>
        <p className="mt-1 text-sm text-red-800">{USER_UI_LOAD_FAILED}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="grid gap-4 md:grid-cols-3">
        {TIERS.map((t) => {
          const row = byTier[t.id];
          const selected = selectedTier === t.id;
          const isRec = t.recommend;
          return (
            <div
              key={t.id}
              className={`flex flex-col rounded-2xl border p-4 ${
                isRec
                  ? "border-emerald-500 ring-2 ring-emerald-200"
                  : selected
                    ? "border-blue-500 ring-1 ring-blue-200"
                    : "border-slate-200"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-lg font-black text-slate-900">{t.label}</h3>
                {isRec ? <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-xs font-bold text-white">추천</span> : null}
              </div>
              <p className="mt-2 text-2xl font-black text-slate-900">{priceLabelFromPlanRow(row)}</p>
              <p className="mt-1 text-xs text-slate-600">주간 신규 질문: {weeklyQuestionsLabel(row)}</p>
              {row ? (
                <p className="mt-2 line-clamp-2 text-xs text-slate-500">
                  {getStringFieldLocal(row) ?? "학습 상황에 맞춰 선택할 수 있는 구독 옵션입니다."}
                </p>
              ) : (
                <div className="mt-2 space-y-1 text-xs font-bold text-amber-800">
                  <p>현재 표시할 요금제가 없습니다.</p>
                  <p className="font-semibold text-amber-900/90">요금제 정보가 준비되면 이곳에서 확인할 수 있습니다.</p>
                </div>
              )}
              <div className="mt-auto pt-4">
                <Link
                  href={`/subscribe?mentorId=${encodeURIComponent(mentorId)}&plan=${t.id}`}
                  className={`block w-full rounded-lg py-2 text-center text-sm font-bold ${
                    selected ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-900 hover:bg-slate-200"
                  }`}
                >
                  {selected ? "선택됨" : "이 플랜으로"}
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function getStringFieldLocal(row: Record<string, unknown>) {
  for (const k of ["description", "summary", "body", "long_description"]) {
    const v = row[k];
    if (typeof v === "string" && v.trim()) return v;
  }
  return null;
}
