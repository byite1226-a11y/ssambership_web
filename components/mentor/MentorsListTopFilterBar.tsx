"use client";

import Link from "next/link";
import { SlidersHorizontal, X } from "lucide-react";
import { useState } from "react";
import { MentorsListFilterSidebar } from "@/components/mentor/MentorsListFilterSidebar";
import type { MentorsListFilters } from "@/lib/mentor/mentorsListSearchParams";
import {
  MENTOR_SCHOOL_OPTIONS,
  MENTOR_SORT_OPTIONS,
  MENTOR_SUBJECT_OPTIONS,
  filtersToHrefRecord,
  mentorsListHref,
} from "@/lib/mentor/mentorsListSearchParams";

export function MentorsListTopFilterBar(props: { filters: MentorsListFilters }) {
  const hrefBase = filtersToHrefRecord(props.filters);
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <>
      <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <form method="get" action="/mentors" className="flex flex-col gap-3 sm:flex-row sm:items-center">
          {props.filters.subject ? <input type="hidden" name="subject" value={props.filters.subject} /> : null}
          {props.filters.school ? <input type="hidden" name="school" value={props.filters.school} /> : null}
          {props.filters.verifiedOnly ? <input type="hidden" name="verified" value="1" /> : null}
          {props.filters.priceMax != null ? <input type="hidden" name="priceMax" value={props.filters.priceMax} /> : null}
          {props.filters.sort !== "new" ? <input type="hidden" name="sort" value={props.filters.sort} /> : null}
          <input
            type="search"
            name="q"
            defaultValue={props.filters.q}
            placeholder="멘토 이름, 과목, 학교 검색"
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

        <div className="flex flex-wrap gap-2">
          <span className="w-full text-[10px] font-extrabold uppercase tracking-wide text-slate-500 sm:w-auto sm:py-2">
            과목
          </span>
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

        <div className="flex flex-wrap gap-2">
          <span className="w-full text-[10px] font-extrabold uppercase tracking-wide text-slate-500 sm:w-auto sm:py-2">
            학교
          </span>
          {MENTOR_SCHOOL_OPTIONS.map((o) => {
            const active = props.filters.school === o.id;
            const href = mentorsListHref(hrefBase, { school: o.id || null, page: null });
            return (
              <Link
                key={o.id || "all-school"}
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
            const href = mentorsListHref(hrefBase, { sort: s.id === "new" ? null : s.id, page: null });
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
          <Link
            href={mentorsListHref(hrefBase, { verified: props.filters.verifiedOnly ? null : "1", page: null })}
            className={`ml-auto rounded-full px-3 py-1.5 text-[11px] font-black transition ${
              props.filters.verifiedOnly
                ? "bg-[#1A56DB] text-white"
                : "border border-slate-200 bg-white text-slate-600"
            }`}
          >
            인증 멘토
          </Link>
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
          <div className="absolute bottom-0 left-0 right-0 max-h-[85vh] overflow-y-auto rounded-t-2xl bg-white p-5 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-black text-slate-900">상세 필터</h2>
              <button type="button" onClick={() => setDrawerOpen(false)} className="rounded-lg p-2 hover:bg-slate-100">
                <X className="h-5 w-5" />
              </button>
            </div>
            <MentorsListFilterSidebar filters={props.filters} idPrefix="drawer" />
          </div>
        </div>
      ) : null}
    </>
  );
}
