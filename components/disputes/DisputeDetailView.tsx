import Link from "next/link";
import { Gavel } from "lucide-react";
import type { DisputeBundle } from "@/lib/disputes/disputeQueries";
import { formatModLogLine, pickText, statusBadgeText } from "@/lib/disputes/disputeQueries";
import { partyDisputeStatusKo, partyDisputeTypeKo, shortDisputeRef } from "@/lib/disputes/disputeListQueries";
import { orderStatusLabelForUi } from "@/lib/customRequest/orderLifecycleConstants";

type Row = Record<string, unknown>;
type Cat = "review" | "done" | "rejected";

// 상태 색은 의미색(검토중=주황/완료=초록/반려=빨강). 역할 액센트(학생 파랑/멘토 초록)와 분리.
const CAT: Record<
  Cat,
  { headline: string; tileBg: string; tileFg: string; badge: string; dot: string; ring: string }
> = {
  review: {
    headline: "분쟁을 확인하고 있어요",
    tileBg: "bg-amber-50",
    tileFg: "text-amber-600",
    badge: "border-amber-200 bg-amber-50 text-amber-700",
    dot: "bg-amber-500",
    ring: "ring-amber-500/20",
  },
  done: {
    headline: "처리가 완료됐어요",
    tileBg: "bg-emerald-50",
    tileFg: "text-[#059669]",
    badge: "border-emerald-200 bg-emerald-50 text-[#059669]",
    dot: "bg-emerald-500",
    ring: "ring-emerald-500/20",
  },
  rejected: {
    headline: "신청이 반려됐어요",
    tileBg: "bg-red-50",
    tileFg: "text-red-600",
    badge: "border-red-200 bg-red-50 text-red-700",
    dot: "bg-red-500",
    ring: "ring-red-500/20",
  },
};

function categoryOf(raw: string): Cat {
  const s = raw.trim().toLowerCase();
  if (/reject|dismiss/.test(s)) return "rejected";
  if (/resolv|approved|complete|closed|done/.test(s)) return "done";
  return "review";
}

const STEPS = ["접수됨", "검토 중", "처리 완료"] as const;

function formatDateKo(v: string): string | null {
  if (!v || v === "—") return null;
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return null;
  return new Intl.DateTimeFormat("ko-KR", { dateStyle: "medium" }).format(d);
}

export function DisputeDetailView(props: { bundle: DisputeBundle; role: "student" | "mentor" }) {
  const { bundle, role } = props;
  const d = bundle.dispute.row;

  const stateRaw = statusBadgeText(d, ["status", "state", "phase", "progress", "resolution"]);
  const stateKo = partyDisputeStatusKo(stateRaw);
  const cat = categoryOf(stateRaw);
  const c = CAT[cat];
  const currentIndex = cat === "review" ? 1 : 2;

  const reason = pickText(d, ["reason", "description", "message", "body", "summary", "title"]);
  const typeRaw = pickText(d, ["type", "kind", "category", "dispute_type", "reason_code"]);
  const typeLabel = partyDisputeTypeKo(typeRaw === "—" ? "" : typeRaw);
  const idPick = pickText(d, ["id", "uuid"]);
  const receiptRef = shortDisputeRef(idPick === "—" ? "" : idPick);
  const createdLabel = formatDateKo(pickText(d, ["created_at", "inserted_at", "opened_at"]));

  // 관련 주문(raw UUID 비노출 — 링크에만 사용, 화면엔 상태·제목·"주문 보기").
  const co = bundle.customOrder.row;
  const orderId = pickText(d, [
    "custom_request_order_id",
    "mentor_order_id",
    "order_id_linked",
    "order_id",
    "custom_order_id",
    "request_order_id",
  ]);
  const hasOrder = orderId !== "—" && orderId.trim() !== "";
  const orderHref = hasOrder
    ? role === "mentor"
      ? `/mentor/custom-request/orders/${encodeURIComponent(orderId)}`
      : `/custom-request/orders/${encodeURIComponent(orderId)}`
    : null;
  const orderStatusRaw = pickText(co, ["status", "state", "order_status", "stage"]);
  const orderStatusKo = orderStatusRaw !== "—" ? orderStatusLabelForUi(orderStatusRaw) : null;
  const orderTitle = pickText(co, ["title", "summary", "name"]);

  // 연결 정보는 "있는 것만" 한 줄로(없음 나열 금지).
  const linkedBits: string[] = [];
  if (bundle.payment.row) linkedBits.push("결제");
  if (bundle.refund.row) linkedBits.push("환불");
  if (bundle.subscription.row) linkedBits.push("구독");

  const accentText = role === "mentor" ? "text-[#059669]" : "text-[#2563EB]";
  const card = "rounded-2xl border-[0.5px] border-slate-200 bg-white p-5";

  return (
    <div className="space-y-4">
      {/* 1) 상태 히어로 — 플랫 흰 카드 + 0.5px 보더 */}
      <section className={card}>
        <div className="flex items-start gap-4">
          <div className={`flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-xl ${c.tileBg}`}>
            <Gavel className={`h-5 w-5 ${c.tileFg}`} aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
            <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-[11px] font-bold text-slate-600">
              지원 · 분쟁
            </span>
            <h1 className="mt-2 text-xl font-black tracking-tight text-slate-900">{c.headline}</h1>
            <p className="mt-1.5 break-keep text-xs font-medium leading-relaxed text-slate-500">
              접수 {receiptRef || "—"}
              {createdLabel ? ` · ${createdLabel}` : ""} · 처리 완료까지 안전 보관 금액은 보호돼요
            </p>
          </div>
          <span className={`shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-extrabold ${c.badge}`}>{stateKo}</span>
        </div>
      </section>

      {/* 2) 신청 내용 */}
      <section className={card}>
        <h2 className="text-sm font-black text-slate-900">신청 내용</h2>
        <dl className="mt-3 space-y-3 text-sm">
          <div>
            <dt className="text-xs font-bold text-slate-500">사유</dt>
            <dd className="mt-1 break-keep font-medium text-slate-800">{reason !== "—" ? reason : "사유 미입력"}</dd>
          </div>
          <div>
            <dt className="text-xs font-bold text-slate-500">유형</dt>
            <dd className="mt-1 font-medium text-slate-800">{typeLabel !== "—" ? typeLabel : "미지정"}</dd>
          </div>
          <div>
            <dt className="text-xs font-bold text-slate-500">증빙 · 첨부</dt>
            <dd className="mt-1 text-xs font-medium text-slate-400">첨부된 증빙이 없어요.</dd>
          </div>
        </dl>
      </section>

      {/* 3) 처리 이력 — 세로 타임라인(에러 표시 금지) */}
      <section className={card}>
        <h2 className="text-sm font-black text-slate-900">처리 이력</h2>
        <ol className="mt-3" aria-label="처리 단계">
          {STEPS.map((step, i) => {
            const done = i < currentIndex;
            const current = i === currentIndex;
            return (
              <li key={step} className="relative flex gap-3 pb-5 last:pb-0">
                {i < STEPS.length - 1 ? (
                  <span
                    className={`absolute left-[11px] top-7 h-[calc(100%-1.25rem)] w-0.5 ${done ? c.dot : "bg-slate-200"}`}
                    aria-hidden
                  />
                ) : null}
                <span
                  className={`relative z-[1] mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-black ${
                    current
                      ? `${c.dot} text-white ring-4 ${c.ring}`
                      : done
                        ? `${c.dot} text-white`
                        : "border-2 border-slate-200 bg-white text-slate-400"
                  }`}
                >
                  {done ? "✓" : i + 1}
                </span>
                <div className="min-w-0 pt-0.5">
                  <p className={`text-sm font-bold ${current ? "text-slate-900" : done ? "text-slate-700" : "text-slate-400"}`}>
                    {step}
                  </p>
                  {current ? <p className="mt-0.5 text-[11px] font-semibold text-slate-500">현재 단계</p> : null}
                </div>
              </li>
            );
          })}
        </ol>
        {bundle.modLogs.rows.length ? (
          <ul className="mt-3 space-y-1.5 border-t border-slate-100 pt-3 text-xs text-slate-600">
            {bundle.modLogs.rows.map((r, i) => (
              <li key={i} className="break-keep">
                · {formatModLogLine(r as Row)}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 border-t border-slate-100 pt-3 text-xs font-medium text-slate-400">아직 처리 이력이 없어요.</p>
        )}
      </section>

      {/* 4) 관련 주문 / 결제 / 구독 — raw UUID 제거, 있는 것만 */}
      <section className={card}>
        <h2 className="text-sm font-black text-slate-900">관련 주문 · 결제</h2>
        {hasOrder ? (
          <div className="mt-3 rounded-xl border border-slate-100 bg-slate-50/70 p-4">
            <p className="text-sm font-bold text-slate-900">맞춤의뢰 주문{orderStatusKo ? ` · ${orderStatusKo}` : ""}</p>
            {orderTitle !== "—" ? <p className="mt-1 break-keep text-sm text-slate-600">{orderTitle}</p> : null}
            {orderHref ? (
              <Link href={orderHref} className={`mt-2 inline-flex items-center gap-1 text-xs font-extrabold ${accentText}`}>
                주문 보기 →
              </Link>
            ) : null}
          </div>
        ) : (
          <p className="mt-2 text-xs font-medium text-slate-400">연결된 주문이 없어요.</p>
        )}
        {linkedBits.length ? (
          <p className="mt-3 text-xs font-medium text-slate-500">연결: {linkedBits.join(" · ")}</p>
        ) : null}
      </section>
    </div>
  );
}
