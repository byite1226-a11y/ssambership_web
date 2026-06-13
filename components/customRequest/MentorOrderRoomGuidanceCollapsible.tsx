"use client";

import { CustomRequestPolicyNotice } from "@/components/customRequest/CustomRequestPolicyNotice";
import { ContactMaskingNotice } from "@/components/customRequest/ContactMaskingNotice";
import { CustomRequestStatusBanner } from "@/components/customRequest/CustomRequestStatusBanner";

type Row = Record<string, unknown>;

const WORK_TIPS = [
  "의뢰자와 원활하게 소통하며 작업을 진행해주세요.",
  "작업 중 파일은 '작업 파일' 탭에 업로드하세요.",
  "모든 작업이 완료되면 '납품하기'를 통해 결과물을 제출해주세요.",
  "의뢰자와의 대화는 소중한 기록으로 남습니다.",
] as const;

/** 멘토 작업방 우측 — 안내·정책 카드 통합(기본 접힘) */
export function MentorOrderRoomGuidanceCollapsible(props: { order: Row | null; disputeRows: Row[] }) {
  return (
    <details className="group rounded-2xl border border-ds-border-subtle bg-white">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4 text-sm font-semibold text-slate-900 [&::-webkit-details-marker]:hidden">
        <span>안내 및 정책</span>
        <span className="text-xs font-semibold text-blue-600 group-open:hidden">자세히</span>
        <span className="hidden text-xs font-semibold text-slate-600 group-open:inline">접기</span>
      </summary>
      <div className="space-y-4 border-t border-ds-border-subtle px-5 pb-5 pt-4">
        <p className="text-xs leading-relaxed text-slate-600">
          작업 안내·주문 상태·운영 정책을 확인할 수 있어요. 채팅·작업에 집중하려면 접어 두셔도 됩니다.
        </p>
        <div className="rounded-xl border border-ds-border-subtle px-4 py-3.5">
          <p className="text-xs font-semibold text-slate-900">작업 안내</p>
          <ul className="mt-2 space-y-2.5 text-xs font-medium text-slate-600">
            {WORK_TIPS.map((text) => (
              <li key={text} className="flex items-start gap-2">
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-slate-500" />
                <span className="leading-relaxed">{text}</span>
              </li>
            ))}
          </ul>
        </div>
        <CustomRequestStatusBanner order={props.order} disputeRows={props.disputeRows} />
        <CustomRequestPolicyNotice />
        <ContactMaskingNotice />
      </div>
    </details>
  );
}
