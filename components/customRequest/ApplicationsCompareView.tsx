import type { CustomListResult, EnrichedApplication } from "@/lib/customRequest/customRequestQueries";
import { maskContact, pickDisplayField } from "@/lib/customRequest/customRequestQueries";
import { SelectMentorApplicationForm } from "@/components/customRequest/SelectMentorApplicationForm";
import Link from "next/link";

type Row = Record<string, unknown>;

function maskRowContact(row: Row) {
  const e = pickDisplayField(row, ["mentor_email", "email", "contact_email", "kakao_id", "phone", "tel"]);
  if (e === "—" || e.length < 2) return "—(선정 전·마스킹)";
  return maskContact(e);
}

export function ApplicationsCompareView(props: {
  list: CustomListResult;
  postId: string;
  enriched: EnrichedApplication[];
  /** 이미 이 의뢰·학생으로 주문이 열렸으면 CTA 대신 링크 */
  existingOrderId: string | null;
}) {
  const { list, postId, enriched, existingOrderId } = props;
  if (list.error && !list.rows.length) {
    return <p className="text-sm text-amber-800">Supabase: {list.error}</p>;
  }
  if (!list.rows.length) {
    return <p className="text-sm text-slate-600">이 의뢰({postId})에 대한 지원서가 아직 없습니다. {list.sourceNote}</p>;
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-slate-500">
        연락처는 멘토 선정/주문 전 마스킹 — applications: {list.table} · custom_request_orders(선정 후) ·{" "}
        <span className="font-mono">disputes</span> 연동 예정
      </p>

      {existingOrderId ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/90 p-4 text-sm text-emerald-900">
          <p className="font-extrabold">이미 멘토를 선택해 주문이 열렸습니다(1의뢰 1주문 정책).</p>
          <Link className="mt-2 inline-block font-bold text-emerald-800 underline" href={`/custom-request/orders/${existingOrderId}`}>
            주문방 열기 →
          </Link>
        </div>
      ) : null}

      <ul className="space-y-4">
        {enriched.map((e, i) => {
          const r = e.row;
          const nameBlock = e.display
            ? `${e.display.displayName} · ${e.display.university || "—"} / ${e.display.department || "—"} · ${e.display.subjects || "—"}`
            : pickDisplayField(r, ["mentor_name", "mentor_display_name", "mentor_nickname", "mentor_id"]);
          return (
            <li key={String(pickDisplayField(r, ["id", "key"]) + String(i))} className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 text-sm">
                <p>
                  <span className="text-xs text-slate-500">멘토(프로필+지원)</span>
                  <br />
                  <span className="font-extrabold text-slate-900">{nameBlock}</span>
                </p>
                <p>
                  <span className="text-xs text-slate-500">제안 가격</span>
                  <br />
                  {pickDisplayField(r, ["proposed_price", "price", "amount", "bid_amount", "price_cents"])}{" "}
                  {pickDisplayField(r, ["currency", "ccy"])}
                </p>
                <p>
                  <span className="text-xs text-slate-500">납기</span>
                  <br />
                  {pickDisplayField(r, ["proposed_due", "deliver_by", "delivery_at", "due_at", "deadline"])}
                </p>
                <p className="sm:col-span-2">
                  <span className="text-xs text-slate-500">제공 범위</span>
                  <br />
                  {pickDisplayField(r, ["scope", "offer_scope", "includes", "services_offered", "deliverables_summary"])}
                </p>
                <p>
                  <span className="text-xs text-slate-500">연락(마스킹)</span>
                  <br />
                  <span className="font-mono text-xs text-slate-600">{maskRowContact(r)}</span>
                </p>
              </div>
              <p className="mt-3 text-sm text-slate-800">
                <span className="text-xs font-extrabold text-slate-500">자기소개 / 커버노트</span>
                <br />
                {pickDisplayField(r, ["note", "cover_letter", "message", "self_intro", "bio", "pitch", "content"])}
              </p>
              <p className="mt-2 text-sm text-slate-600">
                <span className="text-xs font-extrabold text-slate-500">추가 응답</span>{" "}
                {pickDisplayField(r, ["extra_answers", "answers", "notes", "qna", "replies"])}
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {!existingOrderId && e.applicationId ? (
                  <SelectMentorApplicationForm postId={postId} applicationId={e.applicationId} />
                ) : !existingOrderId && !e.applicationId ? (
                  <SelectMentorApplicationForm postId={postId} applicationId="" disabled />
                ) : null}
                <span className="text-xs text-slate-500">custom_request_orders insert 후 `/custom-request/orders/[id]`</span>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
