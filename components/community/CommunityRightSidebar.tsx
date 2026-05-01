import Link from "next/link";

const TOPICS = ["학습 루틴 나누기", "포트폴리오 피드백", "면접 질문 모음", "자격증 후기", "이직 준비 팁"];

export function CommunityRightSidebar() {
  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="text-sm font-extrabold text-slate-900">실시간 인기 주제</h3>
        <ol className="mt-3 space-y-2 text-sm text-slate-700">
          {TOPICS.map((t, i) => (
            <li key={t} className="flex gap-2">
              <span className="font-black text-blue-600">{i + 1}</span>
              <span>{t}</span>
            </li>
          ))}
        </ol>
      </section>
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="text-sm font-extrabold text-slate-900">주간 인기 멘토</h3>
        <ul className="mt-3 space-y-2 text-xs text-slate-600">
          <li className="rounded-lg bg-slate-50 px-2 py-2">멘토 A</li>
          <li className="rounded-lg bg-slate-50 px-2 py-2">멘토 B</li>
          <li className="rounded-lg bg-slate-50 px-2 py-2">멘토 C</li>
        </ul>
      </section>
      <section className="rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 p-4 shadow-sm">
        <h3 className="text-sm font-extrabold text-slate-900">우수 활동자 도전</h3>
        <p className="mt-2 text-xs leading-relaxed text-slate-600">이번 주 활동으로 배지와 노출 기회를 노려 보세요.</p>
        <Link
          href="/community/board"
          className="mt-3 inline-flex w-full items-center justify-center rounded-xl bg-blue-600 py-2 text-center text-xs font-bold text-white shadow-sm hover:bg-blue-700"
        >
          게시판 둘러보기
        </Link>
      </section>
    </div>
  );
}
