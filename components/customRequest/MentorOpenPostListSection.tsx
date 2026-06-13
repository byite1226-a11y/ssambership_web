import Link from "next/link";
import { EmptyState, LinkButton } from "@/components/design-system";
import { mapPostRowToPublicDetail } from "@/lib/customRequest/customRequestPostMappers";
import { pickDisplayField } from "@/lib/customRequest/customRequestQueries";

type Row = Record<string, unknown>;

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

export function MentorOpenPostListSection(props: {
  rows: Row[];
  listStatus: "ok" | "empty" | "rpc_unavailable";
}) {
  if (props.listStatus === "rpc_unavailable") {
    return (
      <div className="rounded-2xl border border-ds-border-subtle bg-white px-5 py-5">
        <p className="text-sm font-bold text-slate-900">모집 목록을 잠시 불러올 수 없어요</p>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          운영 환경에 맞춰 연결 중이에요. 잠시 후 다시 열어 보시거나, 제안한 의뢰 탭을 확인해 주세요.
        </p>
      </div>
    );
  }
  if (!props.rows.length) {
    return (
      <EmptyState
        title="모집 중인 맞춤의뢰가 아직 없어요"
        description="새로운 의뢰가 등록되면 여기에 표시됩니다."
      />
    );
  }
  return (
    <ul className="space-y-3">
      {props.rows.map((r, i) => {
        const d = mapPostRowToPublicDetail(r);
        const id = String(r.id ?? i);
        const detailHref = `/mentor/custom-request/posts/${id}`;
        const applyHref = `/mentor/custom-request/posts/${id}/apply`;
        const createdAt = String(r.created_at ?? "");
        const timeLabel = timeAgo(createdAt);
        const categoryLabel = d.category !== "—" ? d.category : "";
        const metaParts = [
          categoryLabel || null,
          d.budgetLine !== "—" ? `예상 ${d.budgetLine}` : null,
          d.deadline !== "—" ? `마감 ${d.deadline}` : null,
          timeLabel || null,
        ].filter(Boolean);

        return (
          <li key={id}>
            <div className="flex items-center justify-between gap-3 rounded-2xl border border-ds-border-subtle border-l-[3px] border-l-blue-600 bg-white px-5 py-4 transition hover:bg-slate-50/80">
              <Link href={detailHref} className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-slate-900">{d.title}</p>
                {metaParts.length > 0 ? (
                  <p className="mt-1 truncate text-sm text-slate-600">{metaParts.join(" · ")}</p>
                ) : null}
              </Link>
              <LinkButton href={applyHref} variant="secondary" className="shrink-0 text-xs">
                제안하기
              </LinkButton>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
