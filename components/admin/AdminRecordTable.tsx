import Link from "next/link";
import type { AdminListResult } from "@/lib/admin/adminQueries";
import type { AdminErrorDisplayContext } from "@/lib/admin/adminDisplayError";
import { adminListFetchFailedCopy } from "@/lib/admin/adminDisplayError";

type Row = Record<string, unknown>;

/** 운영 화면용 컬럼 헤더(내부 필드명과 무관하게 표시만 한국어로) */
function adminColumnLabel(key: string): string {
  const map: Record<string, string> = {
    id: "항목 ID",
    status: "상태",
    state: "상태",
    created_at: "생성일시",
    updated_at: "수정일시",
    submitted_at: "제출일시",
    target_type: "대상 유형",
    subject_type: "대상 유형",
    resource_type: "자원 유형",
    content_type: "콘텐츠 유형",
    category: "분류",
    report_status: "신고 상태",
    refund_status: "환불 상태",
    title: "제목",
    body: "본문",
    user_id: "사용자",
    mentor_id: "멘토",
    student_id: "학생",
    payment_id: "결제",
    order_id: "주문",
    dispute_id: "분쟁",
    amount: "금액",
    reason: "사유",
    type: "유형",
    kind: "종류",
    action: "작업",
    event_type: "이벤트 유형",
    metadata: "부가 정보",
  };
  return map[key] ?? key;
}

function pickColumns(row: Row, max: number): string[] {
  const keys = Object.keys(row);
  const priority = [
    "id",
    "status",
    "state",
    "created_at",
    "updated_at",
    "target_type",
    "subject_type",
    "resource_type",
    "report_status",
    "refund_status",
    "title",
    "user_id",
    "mentor_id",
    "payment_id",
  ];
  const head = priority.filter((k) => keys.includes(k));
  const rest = keys.filter((k) => !head.includes(k));
  return [...head, ...rest].slice(0, max);
}

function cell(v: unknown): string {
  if (v === null || v === undefined) return "-";
  if (typeof v === "object") return JSON.stringify(v);
  return String(v);
}

export function AdminRecordTable(props: {
  result: AdminListResult;
  maxCol?: number;
  idLabel?: string;
  /** true일 때만 목록 상단에 안내 문구 표시 (기본 false) */
  showSourceNote?: boolean;
  getDetailLink?: (row: Row) => { href: string; label: string } | null;
  /** 목록 조회 실패 시 노출할 운영자용 문구(원문 에러는 표시하지 않음) */
  errorDisplayContext?: AdminErrorDisplayContext;
}) {
  const { result, maxCol = 6, idLabel = "항목 ID", showSourceNote = false, getDetailLink, errorDisplayContext = "default" } = props;
  if (result.error && !result.rows.length) {
    const { title, description } = adminListFetchFailedCopy(errorDisplayContext);
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-4 text-sm text-amber-950">
        <p className="font-semibold">{title}</p>
        <p className="mt-1 text-xs text-amber-900/90">{description}</p>
      </div>
    );
  }
  if (!result.rows.length) {
    return (
      <p className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
        표시할 행이 없습니다.
        {showSourceNote && result.sourceNote ? (
          <span className="mt-1 block text-xs text-slate-500">{result.sourceNote}</span>
        ) : null}
      </p>
    );
  }
  const cols = pickColumns(result.rows[0] as Row, maxCol);
  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
      {showSourceNote && result.sourceNote ? (
        <p className="border-b border-slate-100 px-3 py-2 text-xs text-slate-500">{result.sourceNote}</p>
      ) : null}
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50/80">
            {cols.map((c) => (
              <th key={c} className="px-2 py-2 font-extrabold text-slate-800">
                {adminColumnLabel(c)}
              </th>
            ))}
            <th className="px-2 py-2 font-extrabold text-slate-800">상세</th>
          </tr>
        </thead>
        <tbody>
          {result.rows.map((r, i) => {
            const row = r as Row;
            const id = cell(row.id);
            return (
              <tr key={id + String(i)} className="border-b border-slate-100 last:border-0">
                {cols.map((c) => (
                  <td key={c} className="max-w-[200px] truncate px-2 py-1.5 text-slate-800">
                    {cell(row[c])}
                  </td>
                ))}
                <td className="px-2 py-1.5 text-xs" title={`${idLabel}: ${id}`}>
                  {getDetailLink ? (
                    (() => {
                      const d = getDetailLink(row);
                      if (!d) {
                        return <span className="text-slate-400">상세 링크 없음</span>;
                      }
                      return (
                        <Link className="font-bold text-indigo-800 underline" href={d.href} prefetch={false}>
                          {d.label}
                        </Link>
                      );
                    })()
                  ) : (
                    <span className="text-slate-400">상세 링크 없음</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
