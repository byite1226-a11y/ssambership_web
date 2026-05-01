import { PageScaffold } from "@/components/shell/PageScaffold";
import { AdminStatusBadge } from "@/components/admin/AdminStatusBadge";
import { AdminDetailPanelSlot } from "@/components/admin/AdminActionPlaceholders";
import { createClient } from "@/lib/supabase/server";
import {
  adminSettlementStatusLabel,
  loadAdminSettlementsList,
  type AdminListResult,
  type AdminSettlementListItem,
} from "@/lib/admin/adminQueries";
import { adminListErrorDescription } from "@/lib/admin/adminDisplayError";

const SETTLEMENTS_BADGE_RESULT: AdminListResult = {
  table: null,
  sourceNote: "",
  rows: [],
  error: null,
  keyHints: {},
};

function formatWon(n: number): string {
  return `${new Intl.NumberFormat("ko-KR", { maximumFractionDigits: 0 }).format(Math.round(n))}원`;
}

function shortUuid(id: string): string {
  if (!id) return "—";
  return id.length > 10 ? `${id.slice(0, 10)}…` : id;
}

function formatDateKo(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("ko-KR", { dateStyle: "medium", timeStyle: "short" }).format(d);
}

function SettlementTable({ rows }: { rows: AdminSettlementListItem[] }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
      <table className="w-full min-w-[1040px] text-left text-sm">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50/90">
            <th className="px-2 py-2 font-extrabold text-slate-800">정산 ID</th>
            <th className="px-2 py-2 font-extrabold text-slate-800">주문 ID</th>
            <th className="px-2 py-2 font-extrabold text-slate-800">멘토</th>
            <th className="px-2 py-2 font-extrabold text-slate-800">학생</th>
            <th className="px-2 py-2 font-extrabold text-slate-800">총 결제금액</th>
            <th className="px-2 py-2 font-extrabold text-slate-800">플랫폼 수수료</th>
            <th className="px-2 py-2 font-extrabold text-slate-800">멘토 정산금</th>
            <th className="px-2 py-2 font-extrabold text-slate-800">상태</th>
            <th className="px-2 py-2 font-extrabold text-slate-800">지급일</th>
            <th className="px-2 py-2 font-extrabold text-slate-800">생성일</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-b border-slate-100 last:border-0">
              <td className="max-w-[120px] truncate px-2 py-1.5 font-mono text-xs text-slate-800" title={r.id}>
                {shortUuid(r.id)}
              </td>
              <td
                className="max-w-[120px] truncate px-2 py-1.5 font-mono text-xs text-slate-800"
                title={r.orderMetaLine ? `${r.customRequestOrderId}\n${r.orderMetaLine}` : r.customRequestOrderId}
              >
                {shortUuid(r.customRequestOrderId)}
              </td>
              <td className="max-w-[100px] truncate px-2 py-1.5 font-mono text-xs text-slate-700" title={r.mentorId}>
                {shortUuid(r.mentorId)}
              </td>
              <td className="max-w-[100px] truncate px-2 py-1.5 font-mono text-xs text-slate-700" title={r.studentId ?? ""}>
                {r.studentId ? shortUuid(r.studentId) : "—"}
              </td>
              <td className="whitespace-nowrap px-2 py-1.5 text-slate-800">{formatWon(r.grossAmount)}</td>
              <td className="whitespace-nowrap px-2 py-1.5 text-slate-800">{formatWon(r.platformFeeAmount)}</td>
              <td className="whitespace-nowrap px-2 py-1.5 font-semibold text-slate-900">{formatWon(r.mentorAmount)}</td>
              <td className="whitespace-nowrap px-2 py-1.5 text-slate-800">{adminSettlementStatusLabel(r.status)}</td>
              <td className="whitespace-nowrap px-2 py-1.5 text-xs text-slate-700">{formatDateKo(r.paidAt)}</td>
              <td className="whitespace-nowrap px-2 py-1.5 text-xs text-slate-700">{formatDateKo(r.createdAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default async function AdminSettlementsPage() {
  const supabase = await createClient();
  const { rows, summary, queryOk, byMentorHint } = await loadAdminSettlementsList(supabase, 50);

  const summaryBody = queryOk
    ? [
        `전체 ${summary.totalRows}건`,
        `지급 대기·보류·지급 가능(멘토 정산금 합계) ${formatWon(summary.pendingMentorAmountSum)}`,
        `지급 완료(멘토 정산금 합계) ${formatWon(summary.paidMentorAmountSum)}`,
        `보류 ${summary.onHoldCount}건 · 취소 ${summary.cancelledCount}건`,
      ].join(" · ")
    : "정산 요약을 불러오지 못했습니다.";

  return (
    <PageScaffold
      eyebrow="관리자 / 정산"
      title="정산 관리"
      description="멘토 정산 대상과 지급 상태를 확인합니다."
      ctas={[
        { href: "/admin/refunds", label: "환불 관리", tone: "slate" },
        { href: "/admin/audit-logs", label: "감사 로그", tone: "blue" },
      ]}
      sections={[
        { title: "정산 요약", body: summaryBody, status: queryOk ? "connected" : "skeleton" },
        {
          title: "오류 재처리",
          body: "지급 실패 건의 자동 재처리·재시도는 아직 연결되어 있지 않습니다. 필요 시 수동으로 원장과 결제 상태를 확인해 주세요.",
          status: "skeleton",
        },
        { title: "멘토별 보기", body: byMentorHint, status: "skeleton" },
      ]}
      hideFooterPlaceholderCards
      dataPoints={["정산 대상", "지급 상태", "지급 일정", "처리 이력"]}
    >
      <div className="space-y-4">
        {!queryOk ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-3 text-sm text-amber-950">
            <p className="font-semibold">목록을 불러오지 못했습니다.</p>
            <p className="mt-1 text-xs text-amber-900/95">{adminListErrorDescription("settlements")}</p>
          </div>
        ) : null}

        {queryOk ? (
          <>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-extrabold text-slate-800">지급 예정 및 지급 내역</span>
              <AdminStatusBadge result={SETTLEMENTS_BADGE_RESULT} hint="최근 정산부터 최대 50건" />
            </div>
            {rows.length === 0 ? (
              <p className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-5 text-sm text-slate-600">
                정산 대상 내역이 없습니다.
              </p>
            ) : (
              <SettlementTable rows={rows} />
            )}
            <AdminDetailPanelSlot />
          </>
        ) : null}
      </div>
    </PageScaffold>
  );
}
