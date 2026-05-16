import { AlertTriangle, CheckCircle2, ChevronRight, Pencil, Play } from "lucide-react";
import { startCustomOrderWorkAction } from "@/lib/customRequest/orderMentorActions";
import { acceptCustomOrderDeliverableAction } from "@/lib/customRequest/orderStudentActions";
import {
  ORDER_ROOM_CARD_CLASS,
  ORDER_ROOM_TERMINAL_MENTOR_NOTICE,
  ORDER_ROOM_TERMINAL_STUDENT_NOTICE,
} from "@/lib/customRequest/orderLifecycleConstants";
import type { AppRole } from "@/lib/types/user";

const cardPrimary =
  "flex w-full items-center justify-between gap-3 rounded-xl border px-4 py-3 text-left shadow-sm transition-colors disabled:cursor-not-allowed disabled:opacity-40";
const subtleLinkBar =
  "flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm font-semibold text-slate-700 transition hover:bg-slate-50";
const mutedLink =
  `${subtleLinkBar} opacity-55 cursor-not-allowed hover:bg-transparent`;

const greenCardPrimary = `${cardPrimary} border-green-200 bg-green-50 text-green-800 hover:bg-green-100`;
const blueCardPrimary = `${cardPrimary} border-blue-200 bg-blue-50 text-blue-900 hover:bg-blue-100`;
const orangeNoticeCard = `${cardPrimary} border-orange-200 bg-orange-50 text-orange-900 hover:bg-orange-100`;

/** 분쟁 신청 진입 — 보조(밑줄 위주). 주 액션과 시각 역할 분리 */
const disputeSubtleHref = `${subtleLinkBar} text-red-900/95 hover:underline`;

type Props = {
  view: "student" | "mentor";
  actorRole: AppRole;
  orderId: string;
  /** 종료·완료 주문: 진행성 액션 전부 숨기고 안내만 */
  orderTerminal?: boolean;
  studentAcceptDisabledReason: string | null;
  mentorStartDisabledReason: string | null;
  studentRevisionRequestDisabledReason: string | null;
  openDisputeApplicationDisabledReason: string | null;
  hasActiveDispute?: boolean;
  mentorRevisionJumpDisabledReason?: string | null;
};

function Chevr() {
  return <ChevronRight className="h-4 w-4 shrink-0 opacity-60" aria-hidden />;
}

export function OrderActionBar(props: Props) {
  if (props.view === "mentor") {
    return <OrderActionBarMentor {...props} />;
  }
  const {
    view,
    actorRole,
    orderId,
    orderTerminal = false,
    studentAcceptDisabledReason,
    mentorStartDisabledReason,
    studentRevisionRequestDisabledReason,
    openDisputeApplicationDisabledReason,
    hasActiveDispute = false,
    mentorRevisionJumpDisabledReason = null,
  } = props;

  if (orderTerminal) {
    const notice =
      view === "student" && actorRole === "student"
        ? ORDER_ROOM_TERMINAL_STUDENT_NOTICE
        : "이 주문은 완료되어 추가 작업이 제한됩니다.";
    return (
      <div className={ORDER_ROOM_CARD_CLASS} role="status" aria-label="주문 완료 안내">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">작업 관리</p>
        <p className="mt-2 text-sm font-semibold text-slate-900">추가 작업 없음</p>
        <p className="mt-1 text-sm leading-relaxed text-slate-700">{notice}</p>
      </div>
    );
  }

  const canStudentAccept =
    actorRole === "student" && view === "student" && !studentAcceptDisabledReason && orderId.trim().length > 0;
  const canMentorStart = false;
  const canStudentRevisionJumps =
    actorRole === "student" && view === "student" && !studentRevisionRequestDisabledReason && orderId.trim().length > 0;
  const canDisputeJump =
    (actorRole === "student" || actorRole === "mentor") &&
    !hasActiveDispute &&
    !openDisputeApplicationDisabledReason &&
    orderId.trim().length > 0;

  const mentorPrimaryStarts = Boolean(canMentorStart);
  const studentPrimaryAccepts = Boolean(canStudentAccept);

  return (
    <div className={`${ORDER_ROOM_CARD_CLASS} w-full`} role="group" aria-label="주문 액션">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">작업 관리</p>
      <p className="mt-0.5 text-xs text-slate-500">
        현재 단계에서 꼭 눌러야 할 작업 하나를 위에 두고, 나머지는 바로 아래 텍스트 링크로 모았습니다.
      </p>

      <div className="mt-4 flex flex-col gap-2">
        {hasActiveDispute ? (
          <a href="#order-disputes" className={orangeNoticeCard}>
            <span className="flex min-w-0 items-start gap-3">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
              <span>
                <span className="block text-sm font-bold">해결 요청 상태 보기</span>
                <span className="mt-0.5 block text-xs font-normal opacity-90">검토 현황을 확인합니다.</span>
              </span>
            </span>
            <Chevr />
          </a>
        ) : null}

        {view === "student" && actorRole === "student" && studentPrimaryAccepts ? (
          <form action={acceptCustomOrderDeliverableAction} className="w-full">
            <input type="hidden" name="orderId" value={orderId} />
            <button type="submit" className={greenCardPrimary}>
              <span className="flex min-w-0 items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                <span>
                  <span className="block text-sm font-bold">수락하기</span>
                  <span className="mt-0.5 block text-xs font-normal opacity-85">납품이 만족스러우면 수락해 주세요.</span>
                </span>
              </span>
              <Chevr />
            </button>
          </form>
        ) : null}
      </div>

      <div className="mt-3 space-y-0.5 border-t border-slate-100 pt-3">
        <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">추가 링크</p>
        {view === "student" && actorRole === "student" && !studentPrimaryAccepts ? (
          <p className="py-1 text-xs text-slate-500" title={studentAcceptDisabledReason ?? undefined}>
            납품 수락은 지금 단계에서 사용할 수 없어요.
          </p>
        ) : null}
        {view === "student" && actorRole === "student" && canStudentRevisionJumps ? (
          <a href="#order-revisions" className={subtleLinkBar}>
            <span className="flex min-w-0 items-center gap-2">
              <Pencil className="h-3.5 w-3.5 shrink-0 text-slate-500" />
              수정 요청하기
            </span>
            <Chevr />
          </a>
        ) : view === "student" && actorRole === "student" ? (
          <button type="button" disabled className={mutedLink} title={studentRevisionRequestDisabledReason ?? "사용할 수 없음"}>
            <span className="flex min-w-0 items-center gap-2">
              <Pencil className="h-3.5 w-3.5 shrink-0" />
              수정 요청하기
            </span>
            <Chevr />
          </button>
        ) : null}

        {hasActiveDispute ? null : canDisputeJump ? (
          <a href="#order-disputes" className={disputeSubtleHref}>
            <span className="flex min-w-0 items-center gap-2">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" aria-hidden />
              문제 해결 요청하기
            </span>
            <Chevr />
          </a>
        ) : (
          <button
            type="button"
            disabled
            className={mutedLink}
            title={openDisputeApplicationDisabledReason ?? "지금은 문제 해결 요청을 보낼 수 없습니다."}
          >
            <span className="flex min-w-0 items-center gap-2">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" aria-hidden />
              문제 해결 요청하기
            </span>
            <Chevr />
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * ========================================================
 * MENTOR ONLY VISUAL UPGRADES (SAFETY ENCAPSULATED)
 * ========================================================
 */

function ChevrMentor() {
  return <ChevronRight className="h-4 w-4 shrink-0 opacity-60 transition-transform group-hover:translate-x-0.5" aria-hidden />;
}

function OrderActionBarMentor(props: Props) {
  const {
    actorRole,
    orderId,
    orderTerminal = false,
    mentorStartDisabledReason,
    openDisputeApplicationDisabledReason,
    hasActiveDispute = false,
    mentorRevisionJumpDisabledReason = null,
  } = props;

  if (orderTerminal) {
    const notice = actorRole === "mentor" ? ORDER_ROOM_TERMINAL_MENTOR_NOTICE : "이 주문은 완료되어 추가 작업이 제한됩니다.";
    return (
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 shadow-sm" role="status" aria-label="주문 완료 안내">
        <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">작업 관리</p>
        <p className="mt-2.5 text-xs font-black text-slate-900">추가 작업 없음</p>
        <p className="mt-1 text-xs font-bold leading-relaxed text-slate-500">{notice}</p>
      </div>
    );
  }

  const canMentorStart =
    actorRole === "mentor" && !mentorStartDisabledReason && orderId.trim().length > 0;
  const canMentorRevisionJump =
    actorRole === "mentor" && !mentorRevisionJumpDisabledReason && orderId.trim().length > 0;
  const canDisputeJump =
    actorRole === "mentor" &&
    !hasActiveDispute &&
    !openDisputeApplicationDisabledReason &&
    orderId.trim().length > 0;

  const mentorPrimaryStarts = Boolean(canMentorStart);

  return (
    <div className="rounded-xl border border-slate-200/70 bg-white px-4 py-4 shadow-[0_1px_3px_rgba(0,0,0,0.02)] w-full" role="group" aria-label="주문 액션">
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-3">작업 관리</p>

      <div className="flex flex-col gap-2">
        {hasActiveDispute ? (
          <a href="#order-disputes" className="flex w-full items-center justify-between gap-2 rounded-lg border border-orange-200 bg-orange-50/30 px-3 py-2.5 shadow-sm hover:border-orange-300 hover:bg-orange-50 transition group">
            <span className="flex items-start gap-2.5">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-orange-600" aria-hidden />
              <span className="flex flex-col text-left">
                <span className="text-[11px] font-bold text-orange-900">문제 해결 진행 중</span>
                <span className="text-[9px] font-medium text-orange-700/80">현황을 확인하세요.</span>
              </span>
            </span>
            <ChevrMentor />
          </a>
        ) : null}

        {actorRole === "mentor" && mentorPrimaryStarts ? (
          <form action={startCustomOrderWorkAction} className="w-full">
            <input type="hidden" name="orderId" value={orderId} />
            <button type="submit" className="flex w-full items-center justify-between gap-2 rounded-lg border border-blue-200 bg-blue-50/50 px-3 py-2.5 shadow-sm hover:border-blue-300 hover:bg-blue-50/80 active:scale-[0.98] transition group">
              <span className="flex items-start gap-2.5">
                <Play className="mt-0.5 h-3.5 w-3.5 shrink-0 text-blue-600" />
                <span className="flex flex-col text-left">
                  <span className="text-[11px] font-bold text-blue-900">작업 시작하기</span>
                  <span className="text-[9px] font-medium text-blue-700/80">의뢰 착수 버튼을 누릅니다.</span>
                </span>
              </span>
              <ChevrMentor />
            </button>
          </form>
        ) : null}
      </div>

      <div className="mt-3.5 space-y-0.5 border-t border-slate-100 pt-2.5">
        {actorRole === "mentor" && !mentorPrimaryStarts && (
          <p className="text-[9px] font-medium text-slate-400 py-1 px-1">※ 지금은 작업을 시작할 수 없습니다.</p>
        )}
        
        {actorRole === "mentor" && canMentorRevisionJump ? (
          <a href="#order-revisions" className="flex w-full items-center justify-between gap-2 rounded-md px-2 py-1.5 text-left text-[10px] font-bold text-slate-600 hover:bg-slate-50 hover:text-blue-600 transition group">
            <span className="flex items-center gap-2">
              <Pencil className="h-3 w-3 text-slate-400 group-hover:text-blue-500" />
              수정 요청 내역
            </span>
            <ChevrMentor />
          </a>
        ) : null}

        {hasActiveDispute ? null : canDisputeJump ? (
          <a href="#order-disputes" className="flex w-full items-center justify-between gap-2 rounded-md px-2 py-1.5 text-left text-[10px] font-bold text-red-500 hover:bg-red-50/50 transition group">
            <span className="flex items-center gap-2">
              <AlertTriangle className="h-3 w-3 text-red-400" aria-hidden />
              문제 해결 요청
            </span>
            <ChevrMentor />
          </a>
        ) : (
          <div className="flex w-full items-center justify-between gap-2 rounded-md px-2 py-1.5 text-left text-[10px] font-medium text-slate-300 cursor-not-allowed">
            <span className="flex items-center gap-2">
              <AlertTriangle className="h-3 w-3" aria-hidden />
              문제 해결 요청
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
