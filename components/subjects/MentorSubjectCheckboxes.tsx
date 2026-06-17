"use client";

import { getMajorSubjects, getMinorSubjects } from "@/lib/subjects/subjectCatalog";

/**
 * 멘토 담당과목 선택 — 과목 정본(subjectCatalog) 기반 체크박스.
 * 대분류별 아코디언(details), 소분류 있으면 소분류 체크박스, 단일 대분류는 자기 자신.
 * 선택값은 정본 code 배열. (저장 직렬화는 부모가 담당)
 */
export function MentorSubjectCheckboxes(props: {
  selected: string[];
  onToggle: (code: string) => void;
  disabled?: boolean;
}) {
  const selectedSet = new Set(props.selected);

  return (
    <div className="space-y-2">
      {getMajorSubjects().map((major) => {
        const minors = getMinorSubjects(major.code);
        const items = minors.length > 0 ? minors : [major];
        const selectedCount = items.filter((it) => selectedSet.has(it.code)).length;
        return (
          <details
            key={major.code}
            open={selectedCount > 0}
            className="rounded-xl border border-slate-200 bg-white"
          >
            <summary className="flex cursor-pointer items-center justify-between gap-2 px-4 py-2.5 text-sm font-extrabold text-slate-900">
              <span>{major.label}</span>
              {selectedCount > 0 ? (
                <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-bold text-blue-600">
                  {selectedCount}
                </span>
              ) : null}
            </summary>
            <div className="grid grid-cols-2 gap-2 px-4 pb-3 sm:grid-cols-3">
              {items.map((it) => (
                <label
                  key={it.code}
                  className="flex items-center gap-2 rounded-lg border border-slate-100 bg-slate-50/60 px-2.5 py-2 text-xs font-semibold text-slate-700"
                >
                  <input
                    type="checkbox"
                    checked={selectedSet.has(it.code)}
                    disabled={props.disabled}
                    onChange={() => props.onToggle(it.code)}
                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  {it.label}
                </label>
              ))}
            </div>
          </details>
        );
      })}
    </div>
  );
}
