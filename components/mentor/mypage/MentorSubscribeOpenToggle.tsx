import { setMentorSubscribeOpenAction } from "@/lib/mentor/mentorSubscribeOpenActions";

/**
 * 멘토 self "신규 구독 받기 / 그만 받기" 토글.
 * 표시·flag 쓰기만 — 기존 학생 구독·정산·환불·cap 과 무관.
 */
export function MentorSubscribeOpenToggle({ open }: { open: boolean }) {
  return (
    <section className="mb-6 rounded-2xl border border-slate-200 bg-white px-5 py-4">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-sm font-black text-slate-900">신규 구독 받기</h2>
          <p className="mt-1 text-xs font-medium leading-relaxed text-slate-500">
            {open
              ? "현재 신규 구독을 받는 중이에요. 정원 안에서 새 학생이 구독할 수 있어요."
              : "신규 구독을 받지 않는 중 · 기존 학생 구독은 그대로 유지돼요."}
          </p>
        </div>
        <span
          className={`shrink-0 rounded-lg border px-2.5 py-1 text-xs font-bold ${
            open
              ? "border-emerald-200 bg-emerald-50 text-[#059669]"
              : "border-slate-200 bg-slate-50 text-slate-600"
          }`}
        >
          {open ? "받는 중" : "마감"}
        </span>
      </div>
      <form action={setMentorSubscribeOpenAction} className="mt-3">
        <input type="hidden" name="open" value={open ? "false" : "true"} />
        <button
          type="submit"
          className={
            open
              ? "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
              : "w-full rounded-lg bg-[#059669] px-3 py-2 text-xs font-bold text-white hover:bg-[#047857]"
          }
        >
          {open ? "신규 구독 그만 받기" : "신규 구독 받기"}
        </button>
      </form>
    </section>
  );
}
