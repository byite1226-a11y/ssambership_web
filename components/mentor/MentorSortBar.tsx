import Link from "next/link";
import type { MentorsListSort } from "@/lib/mentor/mentorsListSearchParams";
import { mentorsListHref } from "@/lib/mentor/mentorsListSearchParams";

const SORTS: { id: MentorsListSort; label: string }[] = [
  { id: "new", label: "최신" },
  { id: "rating", label: "평점" },
  { id: "reviews", label: "리뷰 수" },
  { id: "price", label: "가격 낮은 순" },
];

export function MentorSortBar(props: { current: Record<string, string | undefined>; active: MentorsListSort }) {
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
      <span className="text-xs font-extrabold text-slate-500">정렬</span>
      {SORTS.map((s) => {
        const href = mentorsListHref(props.current, { sort: s.id === "new" ? null : s.id });
        const on = props.active === s.id;
        return (
          <Link
            key={s.id}
            href={href}
            className={`rounded-lg px-3 py-1.5 text-sm font-bold ${
              on ? "bg-slate-900 text-white" : "bg-white text-slate-800 ring-1 ring-slate-200 hover:bg-slate-100"
            }`}
          >
            {s.label}
          </Link>
        );
      })}
    </div>
  );
}
