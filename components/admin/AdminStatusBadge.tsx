import type { AdminListResult } from "@/lib/admin/adminQueries";

export function AdminStatusBadge(props: {
  result: AdminListResult;
  /** 지정 시 목록 안내 문구로만 표시 */
  hint?: string;
}) {
  if (props.hint) {
    return (
      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">{props.hint}</span>
    );
  }
  return <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">최근 목록</span>;
}
