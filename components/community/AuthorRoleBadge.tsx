/** 행에 author_role / role 등이 있으면 표시. 없으면 스키마 연동 안내. */
export function AuthorRoleBadge(props: { row: Record<string, unknown> }) {
  const r =
    (typeof props.row.author_role === "string" && props.row.author_role) ||
    (typeof props.row.role === "string" && props.row.role) ||
    (typeof props.row.writer_type === "string" && props.row.writer_type) ||
    null;
  if (!r) {
    return <span className="rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-600">작성자 뱃지(연동 예정)</span>;
  }
  const low = r.toLowerCase();
  if (low === "mentor" || r === "멘토")
    return <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-extrabold text-emerald-900">Mentor</span>;
  if (low === "student" || r === "학생")
    return <span className="rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-xs font-extrabold text-blue-900">Student</span>;
  return <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-xs font-bold text-slate-800">{r}</span>;
}
