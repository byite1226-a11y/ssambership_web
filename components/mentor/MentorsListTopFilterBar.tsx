"use client";

import Link from "next/link";
import { LayoutGrid, LayoutList, SlidersHorizontal, X } from "lucide-react";
import { useState } from "react";
import { MentorsListFilterSidebar } from "@/components/mentor/MentorsListFilterSidebar";
import { MentorsListQuickLinks } from "@/components/mentor/MentorsListQuickLinks";
import type { MentorsListFilters } from "@/lib/mentor/mentorsListSearchParams";
import {
  MENTOR_SORT_OPTIONS,
  MENTOR_SUBJECT_OPTIONS,
  filtersToHrefRecord,
  mentorsListHref,
} from "@/lib/mentor/mentorsListSearchParams";

export function MentorsListTopFilterBar(props: {
  filters: MentorsListFilters;
  favoriteCount: number;
  totalCount: number;
}) {
  const hrefBase = filtersToHrefRecord(props.filters);
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <>
      <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <form method="get" action="/mentors" className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center">
            <input type="hidden" name="view" value={props.filters.view} />
            {props.filters.sort !== "popular" ? <input type="hidden" name="sort" value={props.filters.sort} /> : null}
            {props.filters.grades.length ? (
              <input type="hidden" name="grades" value={props.filters.grades.join(",")} />
            ) : null}
            {props.filters.mentorTypes.length ? (
              <input type="hidden" name="mentorTypes" value={props.filters.mentorTypes.join(",")} />
            ) : null}
            {props.filters.priceBand ? <input type="hidden" name="priceBand" value={props.filters.priceBand} /> : null}
            {props.filters.priceMin != null ? (
              <input type="hidden" name="priceMin" value={props.filters.priceMin} />
            ) : null}
            {props.filters.priceMax != null ? (
              <input type="hidden" name="priceMax" value={props.filters.priceMax} />
            ) : null}
            {props.filters.subject ? <input type="hidden" name="subject" value={props.filters.subject} /> : null}
            <input
              type="search"
              name="q"
              defaultValue={props.filters.q}
              placeholder="과목, 멘토 이름, 학교 등 검색"
              className="min-h-[44px] flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-medium outline-none focus:border-[#1A56DB] focus:ring-2 focus:ring-[#1A56DB]/20"
            />
            <button
              type="submit"
              className="min-h-[44px] shrink-0 rounded-xl bg-[#1A56DB] px-6 text-sm font-extrabold text-white hover:bg-[#1648c0]"
            >
              검색
            </button>
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="inline-flex min-h-[44px] shrink-0 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-extrabold text-slate-800 lg:hidden"
            >
              <SlidersHorizontal className="h-4 w-4" />
              필터
            </button>
          </form>
          <MentorsListQuickLinks favoriteCount={props.favoriteCount} />
        </div>

        <div className="flex flex-wrap gap-2">
          {MENTOR_SUBJECT_OPTIONS.map((o) => {
            const active = props.filters.subject === o.id;
            const href = mentorsListHref(hrefBase, { subject: o.id || null, page: null });
            return (
              <Link
                key={o.id || "all-subject"}
                href={href}
                className={`rounded-full px-3 py-1.5 text-[11px] font-black transition ${
                  active ? "bg-[#1A56DB] text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {o.label}
              </Link>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
          <span className="text-[10px] font-extrabold uppercase tracking-wide text-slate-500">정렬</span>
          {MENTOR_SORT_OPTIONS.map((s) => {
            const active = props.filters.sort === s.id;
            const href = mentorsListHref(hrefBase, {
              sort: s.id === "popular" ? null : s.id,
              page: null,
            });
            return (
              <Link
                key={s.id}
                href={href}
                className={`rounded-full px-3 py-1.5 text-[11px] font-black transition ${
                  active ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {s.label}
              </Link>
            );
          })}

          <div className="ml-auto flex items-center gap-1 rounded-lg border border-slate-200 p-0.5">
            <Link
              href={mentorsListHref(hrefBase, { view: "list", page: null })}
              className={`inline-flex h-8 w-8 items-center justify-center rounded-md transition ${
                props.filters.view === "list" ? "bg-[#1A56DB] text-white" : "text-slate-500 hover:bg-slate-100"
              }`}
              aria-label="리스트 보기"
              title="리스트"
            >
              <LayoutList className="h-4 w-4" />
            </Link>
            <Link
              href={mentorsListHref(hrefBase, { view: "grid", page: null })}
              className={`inline-flex h-8 w-8 items-center justify-center rounded-md transition ${
                props.filters.view === "grid" ? "bg-[#1A56DB] text-white" : "text-slate-500 hover:bg-slate-100"
              }`}
              aria-label="그리드 보기"
              title="그리드"
            >
              <LayoutGrid className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>

      {drawerOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="닫기"
            className="absolute inset-0 bg-slate-900/40"
            onClick={() => setDrawerOpen(false)}
          />
          <div className="absolute bottom-0 left-0 right-0 max-h-[90vh] overflow-y-auto rounded-t-2xl bg-white p-5 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-black text-slate-900">상세 필터</h2>
              <button type="button" onClick={() => setDrawerOpen(false)} className="rounded-lg p-2 hover:bg-slate-100">
                <X className="h-5 w-5" />
              </button>
            </div>
            <MentorsListFilterSidebar
              filters={props.filters}
              totalCount={props.totalCount}
              idPrefix="drawer"
            />
          </div>
        </div>
      ) : null}
    </>
  );
}
