import { CustomRequestFlowStepper } from "@/components/customRequest/CustomRequestFlowStepper";

const INTRO = [
  {
    title: "1. 의뢰 요청 등록",
    body: "필요한 범위·일정·예산을 정리해 올려요.",
  },
  { title: "2. 멘토 지원", body: "멘토가 제안가·납기·진행 방식을 보내요." },
  { title: "3. 멘토 선택", body: "비교한 뒤 한 분을 골라 이어가요." },
  { title: "4. 상담 & 피드백", body: "첨부·수정·완료는 이후 단계에서 안내돼요." },
] as const;

export function CustomRequestSteps() {
  return (
    <section className="space-y-3" id="flow-steps">
      <h2 className="text-base font-extrabold text-slate-900 sm:text-lg">이렇게 진행돼요</h2>
      <CustomRequestFlowStepper activeStep={1} />
      <div className="mt-2 grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
        {INTRO.map((s) => (
          <div key={s.title} className="rounded-2xl border border-slate-200/90 bg-white p-3.5 shadow-sm sm:p-4">
            <p className="text-sm font-extrabold text-slate-900">{s.title}</p>
            <p className="mt-1.5 break-words text-xs leading-relaxed text-slate-600 sm:text-sm">{s.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
