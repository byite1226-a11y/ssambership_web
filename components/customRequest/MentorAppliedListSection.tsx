import Link from "next/link";
import { EmptyState, LinkButton, StatusBadge } from "@/components/design-system";
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

function applicationStatusKind(stRaw: string): "pending" | "active" | "default" {
  const lower = stRaw.toLowerCase();
  if (!stRaw || stRaw === "—" || lower.includes("pending") || lower.includes("wait") || lower.includes("submitted")) {
    return "pending";
  }
  if (lower.includes("accept") || lower.includes("select") || lower.includes("approved")) {
    return "active";
  }
  return "default";
}

export function MentorAppliedListSection(props: { items: MentorApplicationWithPostHint[]; listFailed: boolean }) {
  if (props.listFailed) {
    return (
      <div className="rounded-2xl border border-ds-border-subtle bg-white px-5 py-5">
        <p className="text-sm font-bold text-slate-900">지원 이력을 불러오지 못했어요</p>
        <p className="mt-1.5 text-sm text-slate-600">잠시 후 다시 시도해 주세요.</p>
      </div>
    );
  }
  if (!props.items.length) {
    return (
      <EmptyState
        title="아직 제출하신 제안서가 없습니다"
        description="새 의뢰 목록에서 관심 있는 의뢰에 제안서를 보내 보세요."
        action={
          <LinkButton href="/mentor/custom-request/posts" accent="student">
            새 의뢰 목록 보러가기
          </LinkButton>
        }
      />
    );
  }
  return (
    <ul className="grid grid-cols-1 items-stretch gap-3 lg:grid-cols-2">
      {props.items.map((it) => {
        const a = it.application;
        const stRaw = pickDisplayField(a, ["status", "state"]);
        const labelRaw = mentorApplicationStatusLabelForUi(stRaw === "—" ? "" : stRaw);
        const stLabel =
          labelRaw === "—" || labelRaw === "상태 확인 필요" || !labelRaw.trim() ? "제안서 제출됨" : labelRaw;
        const createdRaw = pickDisplayField(a, ["created_at", "submitted_at"]);
        const hasCreated = createdRaw !== "—" && createdRaw.trim().length > 0;
        const timeLabel = hasCreated ? timeAgo(createdRaw) : "";
        const dateShort = hasCreated ? createdRaw.substring(0, 10).replace(/-/g, ".") : "";
        const titleText =
          !it.postTitle || it.postTitle === "—" || !it.postTitle.trim() ? "의뢰 제목 확인 중" : it.postTitle;
        const metaParts = [dateShort ? `제안 ${dateShort}` : null, timeLabel || null].filter(Boolean);

        return (
          <li key={String(a.id)} className="min-h-0">
            <Link
              href={it.href}
              className="flex h-full items-start justify-between gap-3 rounded-2xl border border-ds-border-subtle border-l-[3px] border-l-indigo-600 bg-white px-5 py-4 transition-[box-shadow,border-color] duration-150 hover:border-indigo-400 hover:shadow-[0_2px_8px_rgba(0,0,0,0.09)]"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-slate-900">{titleText}</p>
                {metaParts.length > 0 ? (
                  <p className="mt-1 truncate text-sm text-slate-600">{metaParts.join(" · ")}</p>
                ) : null}
              </div>
              <StatusBadge
                label={stLabel}
                kind={applicationStatusKind(stRaw === "—" ? "" : stRaw)}
                size="sm"
                className="shrink-0"
              />
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
