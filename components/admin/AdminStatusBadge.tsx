import type { AdminListResult } from "@/lib/admin/adminQueries";

export function AdminStatusBadge(props: { result: AdminListResult }) {
  const c = props.result.keyHints.status;
  if (!c) {
    return <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-500">status 컬럼: 미확인</span>;
  }
  return <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-800">status 열: {c}</span>;
}
