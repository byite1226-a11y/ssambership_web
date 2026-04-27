import type { NoticeBannerLoad } from "@/lib/landing/landingPageQueries";

export function NoticeBanner(props: { data: NoticeBannerLoad }) {
  const d = props.data;
  if (d.error) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-900">
        공지 조회: {d.error}
        <span className="mt-1 block text-xs font-normal text-amber-800">{d.probe}</span>
      </div>
    );
  }
  if (!d.rows.length) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
        등록된 공지 없음 · {d.probe}
      </div>
    );
  }
  return (
    <div className="rounded-xl border border-blue-200 bg-blue-50/90 px-4 py-3">
      <p className="text-xs font-extrabold uppercase text-blue-800">공지</p>
      <ul className="mt-2 space-y-1">
        {d.rows.map((r, i) => {
          const title = typeof r.title === "string" ? r.title : typeof r.name === "string" ? r.name : `항목 ${i + 1}`;
          return (
            <li key={String(r.id ?? i)} className="text-sm font-bold text-blue-950">
              {title}
            </li>
          );
        })}
      </ul>
      <p className="mt-2 text-xs text-blue-900/80">{d.table ? `${d.table} · ` : ""}{d.probe}</p>
    </div>
  );
}
