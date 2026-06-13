import Link from "next/link";
import type { CustomListResult } from "@/lib/customRequest/customRequestQueries";
import { mapPostRowToPublicDetail } from "@/lib/customRequest/customRequestPostMappers";
import {
  mentorPostStatusLabelForUi,
  mentorPostStatusToken,
} from "@/lib/customRequest/mentorCustomRequestDisplay";
import { mapDataErrorMessage } from "@/lib/utils/mapDataError";

type Row = Record<string, unknown>;

function applicationCountLabel(r: Row): string {
  for (const k of ["application_count", "applications_count", "applicant_count", "bids_count"] as const) {
    const v = r[k];
    if (typeof v === "number" && Number.isFinite(v)) return String(v);
    if (typeof v === "string" && /^\d+$/.test(v)) return v;
  }
  return "0";
}

function SectionHead() {
  return (
    <div className="sec-head left">
      <h2 style={{ fontSize: 24, marginTop: 0 }}>최근 등록된 맞춤의뢰</h2>
      <p>다른 학생들이 등록한 맞춤의뢰 목록입니다.</p>
    </div>
  );
}

export function CustomRequestPostListTable(props: { list: CustomListResult; max?: number }) {
  const { list, max = 5 } = props;

  if (list.error && !list.rows.length) {
    return (
      <>
        <SectionHead />
        <div className="rounded-2xl border border-slate-200/80 bg-white px-5 py-5 text-sm text-slate-700">
          <p className="font-bold text-slate-800">맞춤의뢰를 불러오지 못했어요</p>
          <p className="mt-1.5 font-medium text-slate-600">{mapDataErrorMessage(String(list.error))}</p>
        </div>
      </>
    );
  }

  if (!list.rows.length) {
    return (
      <>
        <SectionHead />
        <div className="rounded-2xl border border-slate-200/80 bg-white px-5 py-8 text-center text-sm font-bold text-slate-500">
          모집 중인 맞춤의뢰가 아직 없습니다.
        </div>
      </>
    );
  }

  return (
    <>
      <SectionHead />
      <table className="tbl">
        <thead>
          <tr>
            <th>카테고리</th>
            <th>제목</th>
            <th>예산</th>
            <th>마감일</th>
            <th>지원 현황</th>
            <th>상태</th>
          </tr>
        </thead>
        <tbody>
          {list.rows.slice(0, max).map((r, i) => {
            const d = mapPostRowToPublicDetail(r as Row);
            const rawId = r.id;
            const id = typeof rawId === "string" || typeof rawId === "number" ? String(rawId) : null;
            const appCount = applicationCountLabel(r as Row);
            const statusLabel = mentorPostStatusLabelForUi(mentorPostStatusToken(r as Row));

            return (
              <tr key={(id ?? "row") + String(i)}>
                <td className="cat-cell">{d.category || d.subject || "분야 미지정"}</td>
                <td className="title-cell">
                  {id ? (
                    <Link href={`/custom-request/${id}`}>{d.title}</Link>
                  ) : (
                    d.title
                  )}
                </td>
                <td className="amt">{d.budgetLine || "확인 중"}</td>
                <td>{d.deadline || "—"}</td>
                <td>{appCount}명 지원</td>
                <td>
                  <span className="st-open">{statusLabel}</span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </>
  );
}
