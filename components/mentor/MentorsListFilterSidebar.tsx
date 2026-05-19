"use client";

import Link from "next/link";
import { useState } from "react";
import type { MentorsListFilters } from "@/lib/mentor/mentorsListSearchParams";
import {
  MENTOR_SCHOOL_OPTIONS,
  MENTOR_SUBJECT_OPTIONS,
  filtersToHrefRecord,
} from "@/lib/mentor/mentorsListSearchParams";

const PRICE_SLIDER_MAX = 300_000;
const PRICE_SLIDER_STEP = 10_000;

export function MentorsListFilterSidebar(props: {
  filters: MentorsListFilters;
  className?: string;
  idPrefix?: string;
}) {
  const hrefBase = filtersToHrefRecord(props.filters);
  const id = props.idPrefix ?? "mentors";
  const [priceMax, setPriceMax] = useState(props.filters.priceMax ?? PRICE_SLIDER_MAX);

  return (
    <div className={props.className ?? ""}>
      <form method="get" action="/mentors" className="space-y-6">
        <input type="hidden" name="q" value={props.filters.q} />
        {props.filters.sort !== "new" ? <input type="hidden" name="sort" value={props.filters.sort} /> : null}

        <fieldset>
          <legend className="text-[12px] font-black text-slate-900">과목</legend>
          <div className="mt-2 space-y-2">
            {MENTOR_SUBJECT_OPTIONS.filter((o) => o.id !== "").map((o) => (
              <label key={o.id} className="flex cursor-pointer items-center gap-2 text-[12px] font-medium text-slate-700">
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
          </div>
        </fieldset>

        <fieldset>
          <legend className="text-[12px] font-black text-slate-900">학교</legend>
          <div className="mt-2 space-y-2">
            {MENTOR_SCHOOL_OPTIONS.map((o) => (
              <label key={o.id || "all"} className="flex cursor-pointer items-center gap-2 text-[12px] font-medium text-slate-700">
                <input
                  type="radio"
                  name="school"
                  value={o.id}
                  defaultChecked={props.filters.school === o.id}
                  className="accent-[#1A56DB]"
                />
                {o.label}
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend className="text-[12px] font-black text-slate-900">가격대 (최대)</legend>
          <p className="mt-1 text-[11px] font-bold text-[#1A56DB]">
            {priceMax >= PRICE_SLIDER_MAX ? "전체" : `${priceMax.toLocaleString("ko-KR")} 캐시 이하`}
          </p>
          <input
            id={`${id}-price`}
            type="range"
            name="priceMax"
            min={0}
            max={PRICE_SLIDER_MAX}
            step={PRICE_SLIDER_STEP}
            value={priceMax}
            onChange={(e) => setPriceMax(Number(e.target.value))}
            className="mt-2 w-full accent-[#1A56DB]"
          />
          <input type="hidden" name="priceMin" value={props.filters.priceMin ?? 0} />
        </fieldset>

        <fieldset>
          <legend className="text-[12px] font-black text-slate-900">인증 여부</legend>
          <label className="mt-2 flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
            <span className="text-[12px] font-bold text-slate-700">인증 멘토만</span>
            <input
              type="checkbox"
              name="verified"
              value="1"
              defaultChecked={props.filters.verifiedOnly}
              className="h-5 w-9 shrink-0 appearance-none rounded-full bg-slate-300 checked:bg-[#1A56DB] transition"
            />
          </label>
        </fieldset>

        <div className="flex flex-col gap-2 pt-1">
          <button
            type="submit"
            className="min-h-[44px] rounded-xl bg-[#1A56DB] px-4 text-sm font-extrabold text-white hover:bg-[#1648c0]"
          >
            필터 적용
          </button>
          <Link
            href="/mentors"
            className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-slate-200 bg-white text-sm font-extrabold text-slate-800 hover:bg-slate-50"
          >
            초기화
          </Link>
        </div>
      </form>
    </div>
  );
}
