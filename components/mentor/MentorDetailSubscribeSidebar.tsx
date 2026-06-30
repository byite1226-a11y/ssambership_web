"use client";

import Link from "next/link";
import { useState } from "react";
import { PlanComparisonCards } from "@/components/subscribe/PlanComparisonCards";
import type { PlansByTier, SubscribePlanTier } from "@/lib/subscribe/subscribePageQueries";
import { formatIndividualQuestionPrice } from "@/lib/individualQuestion/individualQuestionFormat";

const BENEFITS = [
  "연결노트 제공 — 내 공부 흐름을 한눈에 정리",
  "1:1 맞춤 답변 — 전공 멘토의 상세한 답변",
  "구독 해지 후에도 이전 질문·답변 전체 열람 가능",
] as const;

export function MentorDetailSubscribeSidebar(props: {
  mentorId: string;
  byTier: PlansByTier;
  plansError: string | null;
  isLoggedIn: boolean;
  freeQuestionRemaining?: number | null;
  subscriptionClosed?: boolean;
  individualQuestionHref: string;
  individualQuestionPriceCents?: number | null;
}) {
  const [selectedTier, setSelectedTier] = useState<SubscribePlanTier>("standard");
  const subscribeHref = `/subscribe?mentorId=${encodeURIComponent(props.mentorId)}&plan=${selectedTier}`;
  const loginSubscribe = `/login/student?next=${encodeURIComponent(subscribeHref)}`;
  const freeHref = props.isLoggedIn
    ? `/question-room?mentorId=${encodeURIComponent(props.mentorId)}`
    : `/login/student?next=${encodeURIComponent(`/mentors/${props.mentorId}`)}`;

  const freeLabel =
    props.freeQuestionRemaining != null
      ? `무료 질문권 사용하기 [${props.freeQuestionRemaining}]`
      : props.isLoggedIn
        ? "무료 질문권 사용하기"
        : "무료 질문 7개 받기";

  return (
    <aside className="w-full min-w-0 lg:sticky lg:top-24 lg:self-start">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-lg font-black text-slate-900">구독 요금제</h2>

        <div className="mt-4 min-w-0">
          <PlanComparisonCards
            mentorId={props.mentorId}
            byTier={props.byTier}
            selectedTier={selectedTier}
            onSelectTier={setSelectedTier}
            plansError={props.plansError}
            layout="radio-rail"
          />
        </div>

        {props.subscriptionClosed ? (
          <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-center">
            <p className="text-sm font-extrabold text-slate-500">구독 마감</p>
            <p className="mt-1 text-[11px] font-medium text-slate-500">
              이 멘토는 현재 구독을 받지 않습니다. 프로필 열람과 찜은 계속 가능해요.
            </p>
          </div>
        ) : (
          <Link
            href={props.isLoggedIn ? subscribeHref : loginSubscribe}
            className="mt-4 flex min-h-[52px] w-full items-center justify-center rounded-xl bg-[#2563EB] text-sm font-extrabold text-white shadow-md transition hover:bg-[#1D4ED8]"
          >
            구독하기 →
          </Link>
        )}

        <Link
          href={freeHref}
          className="mt-2 flex min-h-[48px] w-full items-center justify-center rounded-xl border-2 border-[#2563EB] bg-white text-sm font-extrabold text-[#2563EB] transition hover:bg-blue-50/40"
        >
          {freeLabel}
        </Link>

        {/* 개별 질문 단가 — 구독(主)보다 한 단계 낮은 보조 표시. 채운 강조 카드/큰 CTA 금지: 옅은 구분선 + 한 줄 + 작은 텍스트 링크. */}
        {props.individualQuestionPriceCents ? (
          <div className="mt-4 border-t border-slate-100 pt-4">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[11px] font-bold text-slate-500">개별 질문 · 구독 없이 1건씩</p>
                <p className="mt-0.5 text-sm font-extrabold text-slate-900">
                  {formatIndividualQuestionPrice(props.individualQuestionPriceCents)}
                  <span className="ml-1 text-[11px] font-medium text-slate-400">/ 1건</span>
                </p>
              </div>
              <Link
                href={props.individualQuestionHref}
                className="shrink-0 text-xs font-bold text-[#2563EB] hover:underline"
              >
                질문하기 →
              </Link>
            </div>
          </div>
        ) : (
          <p className="mt-4 border-t border-slate-100 pt-4 text-[11px] font-medium text-slate-400">
            이 멘토는 개별 질문을 받지 않아요.
          </p>
        )}

        <div className="mt-5 border-t border-slate-100 pt-4">
          <p className="text-xs font-black text-slate-900">구독 혜택</p>
          <ul className="mt-2 space-y-2">
            {BENEFITS.map((b) => (
              <li key={b} className="flex gap-2 text-[11px] font-medium leading-snug text-slate-600">
                <span className="shrink-0 text-[#2563EB]" aria-hidden>
                  ✓
                </span>
                {b}
              </li>
            ))}
          </ul>
        </div>

        <p className="mt-2 text-[10px] font-medium text-slate-500">
          추가 질문은 구독을 통해서 이용할 수 있습니다.
        </p>
      </div>
    </aside>
  );
}
