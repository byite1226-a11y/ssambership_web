import Link from "next/link";
import type { MentorApplicationWithPostHint } from "@/lib/customRequest/customRequestQueries";
import { pickDisplayField } from "@/lib/customRequest/customRequestQueries";
import { mentorApplicationStatusLabelForUi } from "@/lib/customRequest/mentorCustomRequestDisplay";

function timeAgo(dateStr: string): string {
  if (!dateStr || dateStr === "—") return "";
  try {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMin = Math.round((now.getTime() - d.getTime()) / (1000 * 60));
    if (diffMin < 1) return "방금 전";
    if (diffMin < 60) return `${diffMin}분 전`;
    if (diffMin < 60 * 24) return `${Math.round(diffMin / 60)}시간 전`;
    return `${Math.round(diffMin / (60 * 24))}일 전`;
  } catch {
    return "";
  }
}

export function MentorAppliedListSection(props: { items: MentorApplicationWithPostHint[]; listFailed: boolean }) {
  if (props.listFailed) {
    return (
      <div className="rounded-xl border border-slate-200 bg-slate-50/90 px-5 py-5 text-[13px] text-slate-700">
        <p className="font-bold text-slate-900">지원 이력을 불러오지 못했어요</p>
        <p className="mt-1.5">잠시 후 다시 시도해 주세요.</p>
      </div>
    );
  }
  if (!props.items.length) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 bg-white px-6 py-12 text-center shadow-sm">
        <p className="text-[14px] font-bold text-slate-800">아직 제출하신 제안서가 없습니다</p>
        <p className="mt-2 text-[13px] font-medium text-slate-500 leading-relaxed">
          새 의뢰 목록 탭에서 내 분야에 맞는 의뢰를 찾고<br className="hidden sm:inline" />
          학생에게 멋진 제안서를 보내 새로운 인연을 만들어보세요!
        </p>
        <Link
          href="/mentor/custom-request/posts"
          className="mt-5 inline-flex min-h-[40px] items-center justify-center rounded-lg bg-blue-600 px-5 text-[13px] font-bold text-white shadow-md hover:bg-blue-700 transition"
        >
          새 의뢰 목록 보러가기
        </Link>
      </div>
    );
  }
  return (
    <ul className="space-y-3">
      {props.items.map((it) => {
        const a = it.application;
        const stRaw = pickDisplayField(a, ["status", "state"]);
        const labelRaw = mentorApplicationStatusLabelForUi(stRaw === "—" ? "" : stRaw);
        const stLabel = (labelRaw === "—" || labelRaw === "상태 확인 필요" || !labelRaw.trim()) ? "제안서 제출됨" : labelRaw;
        const createdRaw = pickDisplayField(a, ["created_at", "submitted_at"]);
        const hasCreated = createdRaw !== "—" && createdRaw.trim().length > 0;

        const isPending = !stRaw || stRaw === "—" || stRaw.toLowerCase().includes("pending") || stRaw.toLowerCase().includes("wait") || stRaw === "";

        const badgeCls = isPending
          ? "bg-amber-50 text-amber-700 border border-amber-200"
          : "bg-blue-50 text-blue-700 border border-blue-200";

        const titleText = (!it.postTitle || it.postTitle === "—" || !it.postTitle.trim()) ? "의뢰 제목 확인 중" : it.postTitle;
        const timeLabel = hasCreated ? timeAgo(createdRaw) : "";
        const dateShort = hasCreated ? createdRaw.substring(0, 10).replace(/-/g, ".") : "";

        return (
          <li
            key={String(a.id)}
            className="group overflow-hidden rounded-xl border border-slate-200/70 bg-white p-5 shadow-sm hover:border-blue-200 hover:shadow-md transition-all duration-200"
          >
            {/* Top row */}
            <div className="flex items-center gap-2 mb-3">
              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold ${badgeCls}`}>
                {stLabel}
              </span>
              {timeLabel && (
                <span className="text-[11px] text-slate-400">{timeLabel}</span>
              )}
            </div>

            {/* Title */}
            <Link
              className="block text-[15px] font-black tracking-tight text-slate-900 hover:text-blue-600 transition-colors"
              href={it.href}
            >
              {titleText}
            </Link>

            {/* Meta */}
            {hasCreated && (
              <p className="mt-2 text-[12px] text-slate-500">
                제안 일시: <span className="font-medium text-slate-700">{dateShort}</span>
              </p>
            )}

            {/* Status indicator */}
            <div className="mt-3 rounded-lg bg-slate-50 border border-slate-100 px-3 py-2.5">
              <p className="text-[12px] font-semibold text-slate-700">
                {isPending ? "매칭 심사 대기 중 — 학생이 제안서를 검토 중입니다." : "의뢰 진행 가능 상태입니다."}
              </p>
            </div>

            {/* Actions */}
            <div className="mt-4 flex items-center gap-2 border-t border-slate-100 pt-4">
              <Link
                href={it.href}
                className="inline-flex h-9 items-center justify-center rounded-lg border border-slate-200 bg-white px-4 text-[13px] font-semibold text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition"
              >
                의뢰 상세
              </Link>
              <span className="text-[12px] text-slate-400 ml-1">제안서 제출 후 수정 불가</span>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
