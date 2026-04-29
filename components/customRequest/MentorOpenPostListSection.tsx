import Link from "next/link";
import { mapPostRowToPublicDetail } from "@/lib/customRequest/customRequestPostMappers";
import { formatDateYMDOrDash } from "@/lib/customRequest/mentorCustomRequestDisplay";
import { MentorPostStatusBadge } from "@/components/customRequest/MentorPostStatusBadge";

type Row = Record<string, unknown>;

export function MentorOpenPostListSection(props: {
  rows: Row[];
  listStatus: "ok" | "empty" | "rpc_unavailable";
}) {
  if (props.listStatus === "rpc_unavailable") {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-5 text-sm text-amber-950">
        <p className="font-extrabold">의뢰 목록을 아직 이 화면에 연결하는 중입니다.</p>
        <p className="mt-2 text-amber-900/90">
          운영 환경에 최신 맞춤의뢰 정책이 반영되면 이곳에 모집 중인 의뢰가 표시됩니다. 잠시 후 다시 열어 주시거나, 아래「내가 지원한 의뢰」를 확인해 주세요.
        </p>
      </div>
    );
  }
  if (!props.rows.length) {
    return (
      <p className="text-sm text-slate-600">
        모집 중인 맞춤의뢰가 아직 없습니다. 다른 멘토가 먼저 응답하거나, 곧 새 의뢰가 올라올 수 있어요.
      </p>
    );
  }
  return (
    <ul className="space-y-2 text-sm text-slate-800">
      {props.rows.map((r, i) => {
        const d = mapPostRowToPublicDetail(r);
        const id = String(r.id ?? i);
        return (
          <li key={id} className="rounded-lg border border-slate-200 bg-white px-3 py-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Link href={`/mentor/custom-request/posts/${id}`} className="min-w-0 font-bold text-blue-800 hover:underline">
                {d.title}
              </Link>
              <div className="flex shrink-0 flex-wrap items-center gap-2">
                <MentorPostStatusBadge row={r} />
                <span className="text-xs text-slate-400 tabular-nums">{formatDateYMDOrDash(r.created_at)}</span>
              </div>
            </div>
            <p className="mt-1 text-xs text-slate-600">
              {d.category} · {d.subject} · {d.budgetLine} · 납기 {d.deadline}
            </p>
          </li>
        );
      })}
    </ul>
  );
}
