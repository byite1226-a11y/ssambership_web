import Link from "next/link";
import { ArrowRight, CreditCard, MessageCircle, Search, TrendingUp } from "lucide-react";
import { SUBSCRIBE_PLAN_CATALOG } from "@/lib/subscribe/subscribePlanCatalog";

const STATS = [
  { value: "30명+", label: "멘토" },
  { value: "1,200개+", label: "누적 답변" },
  { value: "98%", label: "학생 만족도" },
  { value: "15분", label: "평균 답변" },
] as const;

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

function QuestionRoomMockup() {
  return (
    <div
      className="relative mx-auto w-full max-w-md rounded-2xl border border-white/10 bg-white/95 p-4 shadow-2xl shadow-black/20 backdrop-blur sm:p-5"
      aria-hidden
    >
      <div className="mb-3 flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-full bg-slate-200" />
          <div>
            <p className="text-[11px] font-black text-slate-900">김멘토</p>
            <p className="text-[9px] font-medium text-slate-500">서울대 · 수학과</p>
          </div>
        </div>
        <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[9px] font-bold text-emerald-700">온라인</span>
      </div>
      <div className="space-y-2">
        <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
          <p className="text-[10px] font-black text-[#1A56DB]">질문 2</p>
          <p className="mt-1 text-[11px] font-bold text-slate-800">미적분 극한 문제 풀이</p>
          <span className="mt-2 inline-block rounded-full bg-amber-50 px-2 py-0.5 text-[8px] font-bold text-amber-800">
            답변대기
          </span>
        </div>
        <div className="ml-auto max-w-[85%] rounded-2xl rounded-tr-sm bg-[#1A56DB] px-3 py-2 text-[10px] font-medium text-white">
          멘토님, 이 풀이 과정에서 막혔어요!
        </div>
        <div className="max-w-[85%] rounded-2xl rounded-tl-sm border border-slate-200 bg-white px-3 py-2 text-[10px] text-slate-700">
          극한 정의를 먼저 적어 보면 좋아요.
        </div>
      </div>
      <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
        {["연결노트", "단원 정리", "오답 노트"].map((t) => (
          <span
            key={t}
            className="shrink-0 rounded-lg border border-slate-200 bg-white px-2 py-1 text-[9px] font-bold text-slate-600"
          >
            {t}
          </span>
        ))}
      </div>
    </div>
  );
}

function LandingFooter() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-10 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <div>
          <p className="text-lg font-black text-slate-900">쌤버십</p>
          <p className="mt-1 text-sm font-medium text-slate-500">구독형 질문 멘토링 플랫폼</p>
        </div>
        <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm font-bold text-slate-600">
          <Link href="/legal/terms" className="hover:text-[#1A56DB]">
            이용약관
          </Link>
          <Link href="/legal/privacy" className="hover:text-[#1A56DB]">
            개인정보처리방침
          </Link>
          <Link href="/login?next=%2Fmypage" className="hover:text-[#1A56DB]">
            고객센터
          </Link>
        </nav>
        <p className="text-xs font-medium text-slate-400">© {new Date().getFullYear()} SSAMBESHIP. All rights reserved.</p>
      </div>
    </footer>
  );
}

export function PublicGuestLanding() {
  return (
    <div className="w-full">
      {/* Section 1 — Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#0F172A] via-[#1A56DB] to-[#0F172A] text-white">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.12),transparent_50%)]" />
        <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 sm:py-20 lg:grid-cols-2 lg:items-center lg:gap-12 lg:px-8 lg:py-24">
          <div className="min-w-0 text-center lg:text-left">
            <h1 className="whitespace-pre-line text-3xl font-black leading-tight tracking-tight sm:text-4xl lg:text-[44px] lg:leading-[1.15]">
              {"대학생 멘토와 함께\n질문을 누적하며 성장하세요"}
            </h1>
            <p className="mt-5 whitespace-pre-line text-sm font-medium leading-relaxed text-blue-100/90 sm:text-base">
              {
                "같은 멘토에게 질문을 쌓고, 연결노트로 장기 학습 관리를 받는\n구독형 질문 멘토링 플랫폼"
              }
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center lg:justify-start">
              <Link
                href="/mentors"
                className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-[#1A56DB] px-6 text-sm font-extrabold text-white shadow-lg ring-2 ring-white/25 transition hover:bg-[#1648c0]"
              >
                멘토 찾기
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/signup"
                className="inline-flex min-h-[48px] items-center justify-center rounded-xl border-2 border-white bg-transparent px-6 text-sm font-extrabold text-white transition hover:bg-white/10"
              >
                무료로 시작하기
              </Link>
            </div>
          </div>
          <div className="flex justify-center lg:justify-end">
            <QuestionRoomMockup />
          </div>
        </div>
      </section>

      {/* Section 2 — Stats */}
      <section className="bg-white py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-6 lg:grid-cols-4 lg:gap-8">
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
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <h2 className="text-2xl font-black text-white sm:text-3xl">지금 시작하면 무료 질문권 3개 제공</h2>
          <p className="mt-3 text-sm font-medium text-blue-100">가입 후 멘토를 구독하고 질문방을 열어 보세요</p>
          <Link
            href="/mentors"
            className="mt-8 inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-white px-8 text-sm font-extrabold text-[#1A56DB] shadow-lg transition hover:bg-blue-50"
          >
            멘토 찾기
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <LandingFooter />
    </div>
  );
}
