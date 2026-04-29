import Link from "next/link";
import type { MentorApplicationWithPostHint } from "@/lib/customRequest/customRequestQueries";
import { pickDisplayField } from "@/lib/customRequest/customRequestQueries";
import { mentorApplicationStatusLabelForUi } from "@/lib/customRequest/mentorCustomRequestDisplay";

export function MentorAppliedListSection(props: { items: MentorApplicationWithPostHint[]; listFailed: boolean }) {
  if (props.listFailed) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-slate-50/90 px-4 py-4 text-sm text-slate-700 sm:px-5 sm:py-5">
        <p className="font-extrabold text-slate-900">지원 이력을 불러오지 못했어요</p>
        <p className="mt-1.5">잠시 후 다시 시도해 주세요.</p>
      </div>
    );
  }
  if (!props.items.length) {
    return (
      <p className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-5 text-center text-sm font-bold text-slate-700 sm:px-6">
        아직 제출하신 지원이 없어요
      </p>
    );
  }
  return (
    <ul className="space-y-3 text-sm text-slate-800">
      {props.items.map((it) => {
        const a = it.application;
        const stRaw = pickDisplayField(a, ["status", "state"]);
        const stLabel = mentorApplicationStatusLabelForUi(stRaw === "—" ? "" : stRaw);
        return (
          <li
            key={String(a.id)}
            className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm sm:p-4"
          >
            <div className="flex flex-col gap-2.5 min-[400px]:flex-row min-[400px]:items-center min-[400px]:justify-between">
              <div className="min-w-0">
                <Link
                  className="break-words text-base font-extrabold text-blue-800 hover:underline"
                  href={it.href}
                >
                  {it.postTitle}
                </Link>
                <p className="mt-1 text-xs text-slate-500 sm:text-sm">지원 상태: {stLabel}</p>
              </div>
              <Link
                className="inline-flex min-h-[40px] shrink-0 items-center justify-center self-start rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm font-bold text-slate-800 hover:bg-slate-100 min-[400px]:self-center"
                href={it.href}
              >
                열기
              </Link>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
