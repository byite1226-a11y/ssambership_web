"use client";

import type { PublicNoticeItem } from "@/lib/notices/publicNoticesQueries";

const TYPE_BADGE: Record<string, string> = {
  공지: "bg-slate-100 text-slate-800",
  이벤트: "bg-violet-50 text-violet-900",
  점검: "bg-amber-50 text-amber-950",
  업데이트: "bg-blue-50 text-blue-900",
};

export function PublicNoticesList(props: { items: PublicNoticeItem[] }) {
  if (!props.items.length) return null;

  return (
    <ul className="space-y-3">
      {props.items.map((item) => {
        const badgeCls = TYPE_BADGE[item.typeLabel] ?? "bg-slate-100 text-slate-800";
        return (
          <li key={item.id}>
            <details className="group rounded-2xl border border-[#eef0f3] bg-white">
              <summary className="cursor-pointer list-none px-4 py-4 sm:px-5 sm:py-5 [&::-webkit-details-marker]:hidden">
                <div className="flex flex-wrap items-start gap-2 sm:items-center">
                  <span className={`rounded-md px-2 py-0.5 text-[10px] font-extrabold ${badgeCls}`}>
                    {item.typeLabel}
                  </span>
                  {item.isPinned ? (
                    <span className="rounded-md bg-red-50 px-2 py-0.5 text-[10px] font-extrabold text-red-800">
                      중요
                    </span>
                  ) : null}
                  <h2 className="min-w-0 flex-1 text-base font-extrabold text-slate-900 group-open:text-[#1A56DB]">
                    {item.title}
                  </h2>
                  {item.createdAtLabel ? (
                    <time className="shrink-0 text-xs text-slate-400">{item.createdAtLabel}</time>
                  ) : null}
                </div>
                <p className="mt-1 text-xs font-medium text-slate-500 group-open:hidden">내용 보기</p>
              </summary>
              <div className="border-t border-slate-100 px-4 pb-4 pt-3 sm:px-5 sm:pb-5">
                {item.body ? (
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">{item.body}</p>
                ) : (
                  <p className="text-sm text-slate-500">본문이 없습니다.</p>
                )}
              </div>
            </details>
          </li>
        );
      })}
    </ul>
  );
}
