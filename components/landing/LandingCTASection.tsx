import Link from "next/link";

export function LandingCTASection() {
  return (
    <section className="rounded-2xl border border-slate-900 bg-slate-900 p-8 text-center text-white">
      <h2 className="text-xl font-black">지금 시작하기</h2>
      <p className="mt-2 text-sm text-slate-300">멘토를 찾고, 질문방에서 대화를 열 수 있습니다.</p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link href="/mentors" className="rounded-xl bg-white px-5 py-2.5 text-sm font-extrabold text-slate-900">
          멘토 찾기
        </Link>
        <Link href="/signup" className="rounded-xl border border-white/40 px-5 py-2.5 text-sm font-extrabold text-white hover:bg-white/10">
          회원가입
        </Link>
        <Link href="/login" className="rounded-xl border border-white/40 px-5 py-2.5 text-sm font-extrabold text-white hover:bg-white/10">
          로그인
        </Link>
      </div>
    </section>
  );
}
