import Link from "next/link";
import Image from "next/image";
import { ArrowRight, CreditCard, MessageCircle, Search, TrendingUp } from "lucide-react";
import type { LandingPublicStats } from "@/lib/landing/landingPageQueries";
import { SUBSCRIBE_PLAN_CATALOG } from "@/lib/subscribe/subscribePlanCatalog";

function formatLandingStatCount(n: number | null): string {
  if (n == null || n <= 0) return "준비 중";
  return `${n.toLocaleString("ko-KR")}+`;
}

function buildStats(stats: LandingPublicStats) {
  return [
    { value: formatLandingStatCount(stats.mentorCount), label: "멘토(등록)" },
    { value: formatLandingStatCount(stats.shortformCount), label: "숏폼 글" },
    { value: formatLandingStatCount(stats.boardCount), label: "게시판 글" },
  ] as const;
}

const FEATURES = [
  {
    emoji: "💬",
    title: "질문 카드 누적",
    description: "단발성 Q&A가 아닌 같은 멘토와 질문을 쌓아가는 구조",
  },
  {
    emoji: "📝",
    title: "연결노트",
    description: "멘토와 학생이 함께 만드는 장기 학습 기록",
  },
  {
    emoji: "✅",
    title: "검증된 멘토",
    description: "대학교 재학 인증, 학생증 검수 완료된 멘토만 활동",
  },
] as const;

const PLAN_BENEFITS: Record<string, string[]> = {
  limited: ["주 4개 신규 질문", "1:1 질문방 이용", "연결노트 기록"],
  standard: ["주 9개 신규 질문", "균형 잡힌 질문 한도", "연결노트 + 진행 관리"],
  premium: ["질문 무제한", "집중 멘토링", "연결노트 + 맞춤 피드백"],
};

const STEPS = [
  { icon: Search, title: "멘토 찾기", description: "학교·과목으로 나에게 맞는 멘토를 찾아요" },
  { icon: CreditCard, title: "구독하기", description: "플랜을 선택하고 캐시로 간편 결제해요" },
  { icon: MessageCircle, title: "질문하기", description: "질문방에서 답변을 받고 대화를 이어가요" },
  { icon: TrendingUp, title: "성장하기", description: "누적 질문과 연결노트로 장기 성장해요" },
] as const;

export function PublicGuestLanding(props: { stats: LandingPublicStats }) {
  const STATS = buildStats(props.stats);
  return (
    <div className="w-full">
      {/* Section 1 — Hero */}
      <section className="bg-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 sm:py-18 lg:grid-cols-2 lg:items-center lg:gap-12 lg:px-8 lg:py-24">
          <div className="min-w-0 text-center lg:text-left">
            <p className="text-xs font-semibold tracking-wide text-slate-500 sm:text-sm">
              검증된 대학생 멘토와 1:1로 연결되어
            </p>
            <h1 className="mt-3 text-4xl font-black leading-tight tracking-tight text-slate-900 sm:text-5xl lg:text-[56px] lg:leading-[1.1]">
              공부는 혼자,
              <br />
              <span className="text-[#1A56DB]">성장은 함께</span>
            </h1>
            <p className="mt-5 whitespace-pre-line text-sm font-medium leading-relaxed text-slate-600 sm:text-base">
              {"검증된 대학생 멘토와 1:1로 연결되어\n질문하고, 배우고, 함께 성장하세요."}
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center lg:justify-start">
              <Link
                href="/mentors"
                className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-[#1A56DB] px-6 text-sm font-extrabold text-white shadow-lg transition hover:bg-[#1648c0]"
              >
                멘토 찾기
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/signup"
                className="inline-flex min-h-[48px] items-center justify-center rounded-xl border border-[#1A56DB] bg-transparent px-6 text-sm font-extrabold text-[#1A56DB] transition hover:bg-blue-50"
              >
                무료 체험 시작하기
              </Link>
            </div>
          </div>
          <div className="flex justify-center lg:justify-end">
            <div className="relative w-full max-w-[660px]">
              <div className="relative aspect-[4/3] overflow-hidden rounded-3xl border border-slate-200 bg-slate-50 shadow-xl">
                <Image
                  src="/landing/hero-student-mentoring.png"
                  alt="학생이 공부하며 멘토링을 받는 모습"
                  fill
                  priority
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 660px"
                />
              </div>
              <div className="animate-float absolute right-2 top-2 rounded-2xl border border-[#1A56DB]/40 bg-white/95 px-4 py-3 shadow-lg backdrop-blur sm:right-6 sm:top-5">
                <p className="text-xs font-bold text-slate-800 sm:text-sm">🔵 새 답변 도착!</p>
              </div>
              <div className="animate-float-slow absolute bottom-3 left-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-lg sm:bottom-6 sm:left-6">
                <p className="text-xs font-bold text-slate-800 sm:text-sm">📄 학습 노트 업데이트</p>
              </div>
              <div className="animate-float-mid absolute bottom-[40%] left-2 rounded-2xl border border-emerald-200 bg-white px-4 py-3 shadow-lg sm:bottom-[36%] sm:left-8">
                <p className="text-xs font-bold text-slate-800 sm:text-sm">✅ 멘토 연결 완료</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 2 — Stats */}
      <section className="bg-white py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3 sm:gap-8">
            {STATS.map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-2xl font-black text-[#1A56DB] sm:text-3xl">{s.value}</p>
                <p className="mt-1 text-sm font-bold text-slate-600">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 3 — Features */}
      <section className="bg-slate-50 py-14 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-center text-2xl font-black text-slate-900 sm:text-3xl">쌤버십만의 학습 방식</h2>
          <p className="mx-auto mt-3 max-w-xl text-center text-sm font-medium text-slate-600">
            질문을 쌓고, 기록을 남기고, 검증된 멘토와 함께 성장하세요
          </p>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {FEATURES.map((f) => (
              <article
                key={f.title}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-[#1A56DB]/30 hover:shadow-md"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#1A56DB]/10 text-2xl select-none">
                  {f.emoji}
                </div>
                <h3 className="mt-4 text-lg font-black text-slate-900">{f.title}</h3>
                <p className="mt-2 text-sm font-medium leading-relaxed text-slate-600">{f.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Section 4 — Pricing */}
      <section className="bg-white py-14 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-center text-2xl font-black text-slate-900 sm:text-3xl">구독 플랜</h2>
          <p className="mx-auto mt-3 max-w-lg text-center text-sm font-medium text-slate-600">
            학습량에 맞는 플랜을 선택하세요. 멘토별로 요금이 안내될 수 있어요.
          </p>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {SUBSCRIBE_PLAN_CATALOG.map((plan) => {
              const benefits = PLAN_BENEFITS[plan.tier] ?? [];
              const isRec = Boolean(plan.recommend);
              return (
                <article
                  key={plan.tier}
                  className={`relative flex flex-col rounded-2xl border p-6 ${
                    isRec
                      ? "border-2 border-[#1A56DB] shadow-lg shadow-blue-100"
                      : "border-slate-200 bg-white shadow-sm"
                  }`}
                >
                  {isRec ? (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[#1A56DB] px-3 py-0.5 text-[10px] font-extrabold text-white">
                      추천
                    </span>
                  ) : null}
                  <h3 className="text-lg font-black text-slate-900">{plan.label}</h3>
                  <p className="mt-2 text-2xl font-black text-[#1A56DB]">
                    {plan.cashKrw.toLocaleString("ko-KR")}
                    <span className="text-sm font-bold text-slate-500"> 캐시/월</span>
                  </p>
                  <p className="mt-1 text-xs font-bold text-slate-500">{plan.weeklyLabel}</p>
                  <ul className="mt-5 flex-1 space-y-2 border-t border-slate-100 pt-5">
                    {benefits.map((b) => (
                      <li key={b} className="flex items-start gap-2 text-sm font-medium text-slate-700">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1A56DB]" />
                        {b}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href={`/mentors`}
                    className={`mt-6 flex min-h-[44px] items-center justify-center rounded-xl text-sm font-extrabold transition ${
                      isRec
                        ? "bg-[#1A56DB] text-white hover:bg-[#1648c0]"
                        : "border border-slate-200 bg-slate-50 text-slate-900 hover:bg-slate-100"
                    }`}
                  >
                    지금 구독하기
                  </Link>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* Section 5 — How it works */}
      <section className="bg-slate-50 py-14 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-center text-2xl font-black text-slate-900 sm:text-3xl">이용 흐름</h2>
          <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((step, i) => (
              <div key={step.title} className="relative text-center">
                {i < STEPS.length - 1 ? (
                  <span
                    className="absolute right-0 top-6 hidden h-0.5 w-full translate-x-1/2 bg-slate-200 lg:block"
                    aria-hidden
                  />
                ) : null}
                <div className="relative mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#1A56DB] text-white shadow-md">
                  <step.icon className="h-7 w-7" strokeWidth={2} />
                </div>
                <p className="mt-1 text-[10px] font-extrabold uppercase tracking-wide text-[#1A56DB]">
                  STEP {i + 1}
                </p>
                <h3 className="mt-2 text-base font-black text-slate-900">{step.title}</h3>
                <p className="mt-2 text-sm font-medium text-slate-600">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 6 — CTA */}
      <section className="bg-[#1A56DB] py-14 sm:py-16">
        <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div>
            <h2 className="text-2xl font-black text-white sm:text-3xl">회원가입하면 무료 질문권 15개 지급!</h2>
            <p className="mt-3 text-sm font-medium leading-relaxed text-blue-100 sm:text-base">
              <span className="block">한 멘토에게는 최대 3개까지 사용 가능</span>
              <span className="block">무료 질문권은 가입 후 7일 후에 소멸됩니다</span>
            </p>
          </div>
          <div className="w-full rounded-2xl bg-white/10 p-5 backdrop-blur-sm lg:w-auto lg:min-w-[440px]">
            <div className="space-y-3">
              <p className="text-sm font-semibold text-white">
                🎁 무료 질문권 15개 지급 <span className="text-blue-100">— 가입 즉시 제공</span>
              </p>
              <p className="text-sm font-semibold text-white">
                💬 한 멘토당 최대 3개 <span className="text-blue-100">— 여러 멘토에게 나눠 사용 가능</span>
              </p>
              <p className="text-sm font-semibold text-white">
                ⏰ 7일 이내 사용 <span className="text-blue-100">— 가입 7일 후 미사용 질문권 소멸</span>
              </p>
            </div>
            <Link
              href="/signup"
              className="mt-5 inline-flex min-h-[48px] w-full items-center justify-center rounded-xl bg-white px-8 text-sm font-extrabold text-[#1A56DB] shadow-lg transition hover:bg-blue-50"
            >
              무료로 시작하기
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
