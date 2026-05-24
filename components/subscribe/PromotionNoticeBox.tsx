import type { PromotionsLoad } from "@/lib/subscribe/subscribePageQueries";
import { FREE_QUESTION_POLICY_SHORT } from "@/lib/mentor/freeQuestionPolicy";
import { USER_UI_LOAD_FAILED } from "@/lib/constants/userFacingMessages";

export function PromotionNoticeBox(props: { promotions: PromotionsLoad }) {
  const p = props.promotions;
  void p.table;
  void p.probe;
  return (
    <section className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 md:items-start">
        <div className="rounded-2xl border border-blue-200 bg-blue-50/90 p-5 shadow-sm">
          <h3 className="text-sm font-extrabold text-blue-950">무료 질문 정책</h3>
          <p className="mt-2 text-sm leading-relaxed text-blue-900">{FREE_QUESTION_POLICY_SHORT}</p>
          <p className="mt-3 text-xs leading-snug text-blue-900/85">멘토별 구독 전에도 무료 질문권을 활용할 수 있어요.</p>
        </div>

        <div className="rounded-2xl border border-amber-200 bg-amber-50/90 p-5 shadow-sm">
          <h3 className="text-sm font-extrabold text-amber-950">구매 전 안내</h3>
          <ul className="mt-2 list-inside list-disc space-y-1.5 text-sm leading-relaxed text-amber-950">
            <li>결제·영수증 연동은 순차적으로 제공될 예정입니다.</li>
            <li>환불·해지는 서비스 정책과 분쟁 처리 절차를 따릅니다.</li>
            <li>결제 완료 후 질문방이 열리는 절차는 안내에 따라 진행됩니다.</li>
          </ul>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-sm font-extrabold text-slate-900">프로모션 · 공지</h3>
        {p.error ? <p className="mt-2 text-sm font-bold text-red-800">{USER_UI_LOAD_FAILED}</p> : null}
        {p.rows.length ? (
          <ul className="mt-2 space-y-2">
            {p.rows.map((r, i) => {
              const id = (r as { id?: string }).id ?? `row-${i}`;
              const title = typeof r.title === "string" ? r.title : typeof r.name === "string" ? r.name : "공지";
              const body = typeof r.body === "string" ? r.body : typeof r.content === "string" ? r.content : "";
              return (
                <li key={String(id)} className="text-sm text-slate-800">
                  <span className="font-bold">{title}</span>
                  {body ? <p className="line-clamp-2 text-slate-600">{body}</p> : null}
                </li>
              );
            })}
          </ul>
        ) : !p.error ? (
          <p className="mt-2 text-sm text-slate-600">등록된 공지가 없어요.</p>
        ) : null}
      </div>
    </section>
  );
}
