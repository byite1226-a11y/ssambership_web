import Link from "next/link";

export function HeroSection() {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-8 sm:p-10">
      <p className="text-xs font-extrabold uppercase tracking-wider text-slate-500">W02 · 메인 웹</p>
      <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">질문부터 구독까지, 한곳에서</h1>
      <p className="mt-4 max-w-2xl text-base leading-relaxed text-slate-600">
        멘토 탐색·질문방·커뮤니티·맞춤의뢰·캐시/구독 결제를 하나의 제품 흐름으로 연결합니다. 아래 블록은 Supabase 실조회(또는 RLS로 빈 상태)입니다.
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        <Link href="/mentors" className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-extrabold text-white hover:bg-blue-500">
          멘토 찾기
        </Link>
        <Link href="/signup" className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-extrabold text-slate-900 hover:bg-slate-50">
          회원가입
        </Link>
      </div>
    </section>
  );
}
