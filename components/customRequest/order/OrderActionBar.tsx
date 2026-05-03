import { AlertTriangle, CheckCircle2, ChevronRight, Pencil, Play } from "lucide-react";
import { startCustomOrderWorkAction } from "@/lib/customRequest/orderMentorActions";
import { acceptCustomOrderDeliverableAction } from "@/lib/customRequest/orderStudentActions";
import {
  ORDER_ROOM_CARD_CLASS,
  ORDER_ROOM_TERMINAL_MENTOR_NOTICE,
  ORDER_ROOM_TERMINAL_STUDENT_NOTICE,
} from "@/lib/customRequest/orderLifecycleConstants";
import type { AppRole } from "@/lib/types/user";

const cardBase =
  "flex w-full items-center justify-between gap-3 rounded-xl border px-4 py-3 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-40";

const greenCard =
  `${cardBase} border-green-200 bg-green-50 text-green-700 hover:bg-green-100`;
const orangeCard =
  `${cardBase} border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-100`;
/** 분쟁 신청: 한 화면에서 주 액션과 겹치지 않게 윤곽 위주 */
const disputeOutlineCard = `${cardBase} border-2 border-red-300 bg-white text-red-800 hover:bg-red-50`;
const blueCard = `${cardBase} border-blue-200 bg-blue-50 text-blue-800 hover:bg-blue-100`;
const neutralCard = `${cardBase} border-slate-200 bg-white text-slate-800 hover:bg-slate-50`;
const disabledCard = `${cardBase} border-slate-200 bg-slate-100 text-slate-500`;

type Props = {
  view: "student" | "mentor";
  actorRole: AppRole;
  orderId: string;
  /** 종료·완료 주문: 진행성 액션 전부 숨기고 안내만 */
  orderTerminal?: boolean;
  /** null이면 학생 납품 수락 폼 활성 */
  studentAcceptDisabledReason: string | null;
  /** null이면 멘토 작업 시작 폼 활성 */
  mentorStartDisabledReason: string | null;
  /** null이면 작성 가능(또는 #order-revisions 이동). 막힌 이유(학생·주문상태) */
  studentRevisionRequestDisabledReason: string | null;
  /** null이면 #order-disputes 로 이동 가능(학생·멘토) */
  openDisputeApplicationDisabledReason: string | null;
  /** 진행 중 분쟁이 있으면 신규 신청 대신 아래 패널로 안내 */
  hasActiveDispute?: boolean;
  /** null이면 멘토도 #order-revisions 링크(진행 중 분쟁 시 잠금) */
  mentorRevisionJumpDisabledReason?: string | null;
};

function Chevr() {
  return <ChevronRight className="h-4 w-4 shrink-0" aria-hidden />;
}

/**
 * 연결된 액션만 활성. 나머지는 disabled 유지.
 */
export function OrderActionBar(props: Props) {
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
        : view === "mentor" && actorRole === "mentor"
          ? ORDER_ROOM_TERMINAL_MENTOR_NOTICE
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
  const canMentorStart =
    actorRole === "mentor" && view === "mentor" && !mentorStartDisabledReason && orderId.trim().length > 0;
  const canStudentRevisionJumps =
    actorRole === "student" && view === "student" && !studentRevisionRequestDisabledReason && orderId.trim().length > 0;
  const canDisputeJump =
    (actorRole === "student" || actorRole === "mentor") &&
    !hasActiveDispute &&
    !openDisputeApplicationDisabledReason &&
    orderId.trim().length > 0;

  return (
    <div className={`${ORDER_ROOM_CARD_CLASS} w-full`} role="group" aria-label="주문 액션">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">작업 관리</p>
      <p className="mt-0.5 text-xs text-slate-500">현재 단계에서 진행할 수 있는 작업이에요</p>
      <div className="mt-4 flex flex-col gap-2.5">
        {view === "student" && actorRole === "student" && canStudentRevisionJumps ? (
          <a href="#order-revisions" className={orangeCard}>
            <div className="flex min-w-0 items-start gap-3">
              <Pencil className="mt-0.5 h-4 w-4 shrink-0" />
              <div>
                <p className="text-sm font-bold">수정 요청하기</p>
                <p className="mt-0.5 text-xs font-normal opacity-80">추가로 손봐야 할 부분이 있으면 요청해 주세요.</p>
              </div>
            </div>
            <Chevr />
          </a>
        ) : view === "mentor" && actorRole === "mentor" && !mentorRevisionJumpDisabledReason ? (
          <a href="#order-revisions" className={neutralCard}>
            <div className="flex min-w-0 items-start gap-3">
              <Pencil className="mt-0.5 h-4 w-4 shrink-0" />
              <div>
                <p className="text-sm font-bold">수정 요청하기</p>
                <p className="mt-0.5 text-xs font-normal text-slate-500">학생과 협의한 수정 요청 내역으로 이동합니다.</p>
              </div>
            </div>
            <Chevr />
          </a>
        ) : view === "mentor" && actorRole === "mentor" ? (
          <button
            type="button"
            disabled
            className={disabledCard}
            title={mentorRevisionJumpDisabledReason ?? "수정 요청 내역을 열 수 없습니다."}
          >
            <div className="flex min-w-0 items-start gap-3">
              <Pencil className="mt-0.5 h-4 w-4 shrink-0" />
              <div>
                <p className="text-sm font-bold">수정 요청하기</p>
                <p className="mt-0.5 text-xs font-normal text-slate-500">진행 중인 분쟁이 있어 이 작업은 제한됩니다.</p>
              </div>
            </div>
            <Chevr />
          </button>
        ) : view === "student" && actorRole === "student" ? (
          <button
            type="button"
            disabled
            className={disabledCard}
            title={studentRevisionRequestDisabledReason ?? "수정 요청을 보낼 수 없습니다."}
          >
            <div className="flex min-w-0 items-start gap-3">
              <Pencil className="mt-0.5 h-4 w-4 shrink-0" />
              <div>
                <p className="text-sm font-bold">수정 요청하기</p>
                <p className="mt-0.5 text-xs font-normal text-slate-500">이 단계에서는 사용할 수 없습니다.</p>
              </div>
            </div>
            <Chevr />
          </button>
        ) : null}
        {view === "mentor" ? (
          canMentorStart ? (
            <form action={startCustomOrderWorkAction} className="w-full">
              <input type="hidden" name="orderId" value={orderId} />
              <button type="submit" className={blueCard}>
                <div className="flex min-w-0 items-start gap-3">
                  <Play className="mt-0.5 h-4 w-4 shrink-0" />
                  <div>
                    <p className="text-sm font-bold">작업 시작</p>
                    <p className="mt-0.5 text-xs font-normal text-blue-900/80">의뢰 조건에 맞춰 작업에 착수합니다.</p>
                  </div>
                </div>
                <Chevr />
              </button>
            </form>
          ) : (
            <button
              type="button"
              disabled
              className={disabledCard}
              title={mentorStartDisabledReason ?? "사용할 수 없음"}
            >
              <div className="flex min-w-0 items-start gap-3">
                <Play className="mt-0.5 h-4 w-4 shrink-0" />
                <div>
                  <p className="text-sm font-bold">작업 시작</p>
                  <p className="mt-0.5 text-xs font-normal text-slate-500">이 단계에서는 사용할 수 없습니다.</p>
                </div>
              </div>
              <Chevr />
            </button>
          )
        ) : null}
        {view === "student" ? (
          canStudentAccept ? (
            <form action={acceptCustomOrderDeliverableAction} className="w-full">
              <input type="hidden" name="orderId" value={orderId} />
              <button type="submit" className={greenCard}>
                <div className="flex min-w-0 items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                  <div>
                    <p className="text-sm font-bold">수락하기</p>
                    <p className="mt-0.5 text-xs font-normal opacity-80">납품이 만족스러우면 수락해 주세요.</p>
                  </div>
                </div>
                <Chevr />
              </button>
            </form>
          ) : (
            <button
              type="button"
              disabled
              className={disabledCard}
              title={studentAcceptDisabledReason ?? "사용할 수 없음"}
            >
              <div className="flex min-w-0 items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                <div>
                  <p className="text-sm font-bold">수락하기</p>
                  <p className="mt-0.5 text-xs font-normal text-slate-500">이 단계에서는 사용할 수 없습니다.</p>
                </div>
              </div>
              <Chevr />
            </button>
          )
        ) : null}
        {hasActiveDispute ? (
          <a href="#order-disputes" className={orangeCard}>
            <div className="flex min-w-0 items-start gap-3">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
              <div>
                <p className="text-sm font-bold">진행 중인 분쟁 보기</p>
                <p className="mt-0.5 text-xs font-normal text-orange-900/85">
                  아래 분쟁 패널에서 접수하신 건의 진행 상태를 확인할 수 있어요.
                </p>
              </div>
            </div>
            <Chevr />
          </a>
        ) : canDisputeJump ? (
          <a href="#order-disputes" className={disputeOutlineCard}>
            <div className="flex min-w-0 items-start gap-3">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
              <div>
                <p className="text-sm font-bold">분쟁 신청하기</p>
                <p className="mt-0.5 text-xs font-normal opacity-80">이견·문제를 공식 절차로 올릴 수 있습니다.</p>
              </div>
            </div>
            <Chevr />
          </a>
        ) : (
          <button
            type="button"
            disabled
            className={disabledCard}
            title={openDisputeApplicationDisabledReason ?? "분쟁을 신청할 수 없습니다."}
          >
            <div className="flex min-w-0 items-start gap-3">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
              <div>
                <p className="text-sm font-bold">분쟁 신청하기</p>
                <p className="mt-0.5 text-xs font-normal text-slate-500">이 단계에서는 사용할 수 없습니다.</p>
              </div>
            </div>
            <Chevr />
          </button>
        )}
      </div>
    </div>
  );
}
