"use client";

import { useState } from "react";
import type { MentorProfileDisplay } from "@/lib/mentor/mentorDisplayFields";
import { mentorSubjectChips } from "@/lib/mentor/mentorPublicProfileDisplay";

const TABS = [
  { id: "major", label: "전공" },
  { id: "main", label: "주요 과목" },
  { id: "preferred", label: "선호 과목" },
  { id: "feature", label: "특화 과목" },
] as const;

type TabId = (typeof TABS)[number]["id"];

function chipsForTab(display: MentorProfileDisplay, tab: TabId): string[] {
  const all = mentorSubjectChips(
    [display.subjects, display.tags, display.department].filter(Boolean).join(", "),
    12
  );
  if (tab === "major") {
    const major = [display.university, display.department].filter(Boolean).join(" ");
    return major ? [major, ...all.slice(0, 3)] : all.slice(0, 4);
  }
  if (tab === "main") return all.slice(0, 6);
  if (tab === "preferred") return all.length > 3 ? all.slice(2, 8) : all;
  return all.length > 1 ? [...all].reverse().slice(0, 6) : all;
}

export function MentorDetailSubjectTabs(props: { display: MentorProfileDisplay }) {
  const [tab, setTab] = useState<TabId>("main");
  const chips = chipsForTab(props.display, tab);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <h2 className="text-lg font-black text-slate-900">전공 및 과목</h2>
      <div className="mt-4 flex flex-wrap gap-2 border-b border-slate-100 pb-3">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={[
              "rounded-full px-3 py-1.5 text-xs font-extrabold transition",
              tab === t.id ? "bg-[#1A56DB] text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200",
            ].join(" ")}
          >
            {t.label}
          </button>
        ))}
      </div>
      {chips.length > 0 ? (
        <ul className="mt-4 flex flex-wrap gap-2">
          {chips.map((c) => (
            <li
              key={`${tab}-${c}`}
              className="rounded-lg border border-[#1A56DB]/35 bg-blue-50/40 px-2.5 py-1 text-xs font-bold text-[#1A56DB]"
            >
              {c}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 text-sm text-slate-500">등록된 과목 정보가 아직 없어요.</p>
      )}
    </section>
  );
}
