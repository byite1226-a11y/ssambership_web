import type { PromotionsLoad } from "@/lib/subscribe/subscribePageQueries";

export function PromotionNoticeBox(props: { promotions: PromotionsLoad }) {
  const p = props.promotions;
  return (
    <section className="space-y-4">
      <div className="rounded-2xl border border-blue-200 bg-blue-50/80 p-5">
        <h3 className="text-sm font-extrabold text-blue-950">무료 15질문 정책</h3>
        <p className="mt-2 text-sm text-blue-900">
          가입·초기 혜택으로 <strong>무료 15회 질문</strong>을 사용할 수 있습니다(상세·소진 조건은 운영 정책 확정 후
          이 영역에 반영).
        </p>
        <p className="mt-2 text-xs text-blue-900/80">promotions / notices DB 연동은 아래 Supabase 섹션.</p>
      </div>

      <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-5">
        <h3 className="text-sm font-extrabold text-amber-950">구매 전 유의사항</h3>
        <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-amber-950">
          <li>PG 결제·웹훅은 이후 단계에서 연결됩니다. 현재 CTA는 자리만 둡니다.</li>
          <li>환불·해지는 정책/분쟁 플로우를 따릅니다.</li>
          <li>
            결제 완료 후 <code className="text-xs">mentor_student_rooms</code> 생성 등 질문방 개설은 별 훅(예정).
          </li>
        </ul>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <h3 className="text-sm font-extrabold text-slate-900">프로모션 / 공지 (Supabase)</h3>
        <p className="mt-1 text-xs text-slate-500">{p.table ? `${p.table} · ` : ""}{p.probe}</p>
        {p.error ? <p className="mt-2 text-sm font-bold text-red-800">{p.error}</p> : null}
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
          <p className="mt-2 text-sm text-slate-600">활성 공지 0건 또는 RLS. 스키마 확정 후 fill.</p>
        ) : null}
      </div>
    </section>
  );
}
