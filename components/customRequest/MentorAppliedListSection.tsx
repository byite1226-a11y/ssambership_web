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
      <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-12 text-center shadow-sm">
        <p className="text-sm font-black text-slate-800">아직 제출하신 제안서가 없습니다</p>
        <p className="mt-2 text-xs font-medium text-slate-500 leading-relaxed">
          새 의뢰 목록 탭에서 내 분야에 맞는 의뢰를 찾고<br className="hidden sm:inline" />
          학생에게 멋진 제안서를 보내 새로운 인연을 만들어보세요!
        </p>
        <Link
          href="/mentor/custom-request/posts"
          className="mt-5 inline-flex min-h-[36px] items-center justify-center rounded-xl bg-blue-600 px-5 text-xs font-bold text-white shadow-md shadow-blue-500/10 hover:bg-blue-700 transition"
        >
          새 의뢰 목록 보러가기
        </Link>
      </div>
    );
  }
  return (
    <ul className="space-y-3.5 text-sm text-slate-800">
      {props.items.map((it) => {
        const a = it.application;
        const stRaw = pickDisplayField(a, ["status", "state"]);
        const labelRaw = mentorApplicationStatusLabelForUi(stRaw === "—" ? "" : stRaw);
        const stLabel = (labelRaw === "—" || labelRaw === "상태 확인 필요" || !labelRaw.trim()) ? "제안서 제출됨" : labelRaw;
        const createdRaw = pickDisplayField(a, ["created_at", "submitted_at"]);
        const hasCreated = createdRaw !== "—" && createdRaw.trim().length > 0;

        const isPending = !stRaw || stRaw === "—" || stRaw.toLowerCase().includes("pending") || stRaw.toLowerCase().includes("wait") || stRaw === "";
        const badgeClass = isPending
          ? "rounded-full border border-amber-200 bg-amber-50/50 px-2.5 py-0.5 text-[11px] font-black uppercase tracking-wide text-amber-800"
          : "rounded-full border border-blue-200 bg-blue-50/50 px-2.5 py-0.5 text-[11px] font-black uppercase tracking-wide text-blue-800";

        const titleText = (!it.postTitle || it.postTitle === "—" || !it.postTitle.trim()) ? "의뢰 제목 확인 중" : it.postTitle;

        return (
          <li
            key={String(a.id)}
            className="group overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm hover:border-blue-200 hover:shadow-[0_4px_12px_rgba(30,58,138,0.03)] transition-all duration-200"
          >
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between lg:gap-6">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={badgeClass}>{stLabel}</span>
                  <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-[11px] font-black tracking-wide text-slate-500">지원한 의뢰</span>
                </div>
                <Link
                  className="mt-2.5 block text-[17px] font-black leading-snug text-slate-900 group-hover:text-blue-600 transition-colors"
                  href={it.href}
                >
                  {titleText}
                </Link>
                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs">
                  <span className="rounded-md bg-slate-50 border border-slate-100 px-2 py-1">
                    <span className="font-extrabold text-slate-400 mr-1">매칭 현황</span>
                    <span className="font-bold text-slate-700">{isPending ? "매칭 심사 대기 중" : "의뢰 진행 가능"}</span>
                  </span>
                  {hasCreated ? (
                    <span className="rounded-md bg-slate-50 border border-slate-100 px-2 py-1">
                      <span className="font-extrabold text-slate-400 mr-1">제안 일자</span>
                      <span className="font-bold text-slate-700">{createdRaw.substring(0, 10)}</span>
                    </span>
                  ) : null}
                </div>
                <p className="mt-2.5 text-[10px] font-bold tracking-wide text-slate-400">제안 완료 건</p>
              </div>
              <div className="flex w-full shrink-0 flex-col justify-center gap-2.5 border-t border-slate-100 pt-4 sm:w-auto sm:border-0 sm:pt-0 lg:w-40 lg:border-l lg:border-slate-100 lg:pl-5">
                <Link
                  className="inline-flex min-h-[40px] w-full items-center justify-center rounded-xl bg-blue-600 px-4 text-xs font-bold text-white shadow-sm hover:bg-blue-500 transition sm:w-auto"
                  href={it.href}
                >
                  상세 보기
                </Link>
                <span className="text-center text-xs font-bold text-slate-400">내 제안서 보기</span>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
