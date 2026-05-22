"use client";

import Link from "next/link";
import { useState } from "react";
import type { MentorsListFilters } from "@/lib/mentor/mentorsListSearchParams";
import {
  MENTOR_GRADE_OPTIONS,
  MENTOR_PRICE_BAND_OPTIONS,
  MENTOR_SUBJECT_OPTIONS,
  MENTOR_TYPE_OPTIONS,
  filtersToHrefRecord,
} from "@/lib/mentor/mentorsListSearchParams";

export function MentorsListFilterSidebar(props: {
  filters: MentorsListFilters;
  totalCount: number;
  className?: string;
  idPrefix?: string;
}) {
  const id = props.idPrefix ?? "mentors";
  const [customMin, setCustomMin] = useState(
    props.filters.priceBand === "custom" && props.filters.priceMin != null
      ? String(props.filters.priceMin)
      : "",
  );
  const [customMax, setCustomMax] = useState(
    props.filters.priceBand === "custom" && props.filters.priceMax != null
      ? String(props.filters.priceMax)
      : "",
  );
  const [extraSort, setExtraSort] = useState(
    props.filters.sort === "rating" || props.filters.sort === "response" ? props.filters.sort : "",
  );

  const sortValue = extraSort || (props.filters.sort !== "popular" ? props.filters.sort : "");

  return (
    <div className={props.className ?? ""}>
      <form method="get" action="/mentors" className="flex flex-col">
        <div className="max-h-[calc(100vh-12rem)] space-y-6 overflow-y-auto pr-1 lg:max-h-[calc(100vh-10rem)]">
          <input type="hidden" name="q" value={props.filters.q} />
          {props.filters.view === "grid" ? <input type="hidden" name="view" value="grid" /> : null}
          {sortValue ? <input type="hidden" name="sort" value={sortValue} /> : null}

          <fieldset>
            <legend className="text-[12px] font-black text-slate-900">과목</legend>
            <div className="mt-2 space-y-2">
              <label className="flex cursor-pointer items-center gap-2 text-[12px] font-medium text-slate-700">
                <input
                  type="radio"
                  name="subject"
                  value=""
                  defaultChecked={!props.filters.subject}
                  className="accent-[#1A56DB]"
                />
                전체
              </label>
              {MENTOR_SUBJECT_OPTIONS.filter((o) => o.id !== "").map((o) => (
                <label
                  key={o.id}
                  className="flex cursor-pointer items-center gap-2 text-[12px] font-medium text-slate-700"
                >
                  <input
                    type="radio"
                    name="subject"
                    value={o.id}
                    defaultChecked={props.filters.subject === o.id}
                    className="accent-[#1A56DB]"
                  />
                  {o.label}
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend className="text-[12px] font-black text-slate-900">대상 학년</legend>
            <div className="mt-2 space-y-2">
              {MENTOR_GRADE_OPTIONS.map((o) => (
                <label
                  key={o.id}
                  className="flex cursor-pointer items-center gap-2 text-[12px] font-medium text-slate-700"
                >
                  <input
                    type="checkbox"
                    name="grades"
                    value={o.id}
                    defaultChecked={props.filters.grades.includes(o.id)}
                    className="accent-[#1A56DB]"
                  />
                  {o.label}
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend className="text-[12px] font-black text-slate-900">구독 요금</legend>
            <div className="mt-2 space-y-2">
              {MENTOR_PRICE_BAND_OPTIONS.map((o) => (
                <label
                  key={o.id}
                  className="flex cursor-pointer items-center gap-2 text-[12px] font-medium text-slate-700"
                >
                  <input
                    type="radio"
                    name="priceBand"
                    value={o.id}
                    defaultChecked={props.filters.priceBand === o.id}
                    className="accent-[#1A56DB]"
                  />
                  {o.label}
                </label>
              ))}
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
                <label className="text-[10px] font-bold text-slate-500">
                  최소(캐시)
                  <input
                    name="priceMin"
                    type="number"
                    min={0}
                    step={1000}
                    defaultValue={customMin}
                    onChange={(e) => setCustomMin(e.target.value)}
                    className="mt-1 w-full rounded-lg border px-2 py-1.5 text-xs"
                  />
                </label>
                <label className="text-[10px] font-bold text-slate-500">
                  최대(캐시)
                  <input
                    name="priceMax"
                    type="number"
                    min={0}
                    step={1000}
                    defaultValue={customMax}
                    onChange={(e) => setCustomMax(e.target.value)}
                    className="mt-1 w-full rounded-lg border px-2 py-1.5 text-xs"
                  />
                </label>
              </div>
          </fieldset>

          <fieldset>
            <legend className="text-[12px] font-black text-slate-900">멘토 유형</legend>
            <div className="mt-2 space-y-2">
              {MENTOR_TYPE_OPTIONS.map((o) => (
                <label
                  key={o.id}
                  className="flex cursor-pointer items-center gap-2 text-[12px] font-medium text-slate-700"
                >
                  <input
                    type="checkbox"
                    name="mentorTypes"
                    value={o.id}
                    defaultChecked={props.filters.mentorTypes.includes(o.id)}
                    className="accent-[#1A56DB]"
                  />
                  {o.label}
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend className="text-[12px] font-black text-slate-900">추가 필터</legend>
            <div className="mt-2 space-y-2">
              <label className="flex cursor-pointer items-center gap-2 text-[12px] font-medium text-slate-700">
                <input
                  type="radio"
                  name="sortExtra"
                  value="response"
                  checked={extraSort === "response"}
                  onChange={() => setExtraSort("response")}
                  className="accent-[#1A56DB]"
                />
                답변 속도 빠른 순
              </label>
              <label className="flex cursor-pointer items-center gap-2 text-[12px] font-medium text-slate-700">
                <input
                  type="radio"
                  name="sortExtra"
                  value="rating"
                  checked={extraSort === "rating"}
                  onChange={() => setExtraSort("rating")}
                  className="accent-[#1A56DB]"
                />
                평점 높은 순
              </label>
              <label className="flex cursor-pointer items-center gap-2 text-[12px] font-medium text-slate-700">
                <input
                  type="radio"
                  name="sortExtra"
                  value=""
                  checked={!extraSort}
                  onChange={() => setExtraSort("")}
                  className="accent-[#1A56DB]"
                />
                기본 정렬 유지
              </label>
            </div>
          </fieldset>
        </div>

        <div className="sticky bottom-0 mt-4 space-y-2 border-t border-slate-100 bg-white pt-4">
          <button
            type="submit"
            className="min-h-[44px] w-full rounded-xl bg-[#1A56DB] px-4 text-sm font-extrabold text-white hover:bg-[#1648c0]"
          >
            검색 결과 {props.totalCount.toLocaleString("ko-KR")}명 보기
          </button>
          <Link
            href="/mentors"
            className="inline-flex min-h-[44px] w-full items-center justify-center rounded-xl border border-slate-200 bg-white text-sm font-extrabold text-slate-800 hover:bg-slate-50"
          >
            초기화
          </Link>
        </div>
      </form>
    </div>
  );
}
