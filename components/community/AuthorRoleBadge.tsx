export function AuthorRoleBadge(props: { row: Record<string, unknown> }) {
  const r =
    (typeof props.row.author_role === "string" && props.row.author_role) ||
    (typeof props.row.role === "string" && props.row.role) ||
    (typeof props.row.writer_type === "string" && props.row.writer_type) ||
    null;
  if (!r) {
    return null;
  }
  const low = r.toLowerCase();
  if (low === "mentor" || r === "멘토")
    return (
      <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-extrabold text-emerald-900">멘토</span>
    );
  if (low === "student" || r === "학생")
    return (
      <span className="rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-xs font-extrabold text-blue-900">학생</span>
    );
  if (low === "admin" || r === "관리자")
    return (
      <span className="rounded-full border border-violet-200 bg-violet-50 px-2 py-0.5 text-xs font-extrabold text-violet-900">관리자</span>
    );
  if (low === "user")
    return (
      <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-xs font-bold text-slate-800">사용자</span>
    );
  return (
    <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-xs font-bold text-slate-800">사용자</span>
  );
}
