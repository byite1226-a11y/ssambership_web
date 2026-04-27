const steps = [
  { title: "1. 의뢰 등록", body: "카테고리·기한·예산·요구사항·동의" },
  { title: "2. 멘토 제안", body: "가격·납기·범위·커버노트 비교" },
  { title: "3. 주문·진행", body: "선정 후 주문/대화(연락은 플랫폼)" },
  { title: "4. 납품·마감", body: "버전 납품·수정·수락·분쟁 신청" },
] as const;

export function CustomRequestSteps() {
  return (
    <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {steps.map((s) => (
        <div key={s.title} className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-sm font-extrabold text-slate-900">{s.title}</p>
          <p className="mt-1 text-xs text-slate-600">{s.body}</p>
        </div>
      ))}
    </section>
  );
}
