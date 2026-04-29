import { startCustomOrderWorkAction } from "@/lib/customRequest/orderMentorActions";
import { acceptCustomOrderDeliverableAction } from "@/lib/customRequest/orderStudentActions";
import { ORDER_ROOM_CARD_CLASS, ORDER_ROOM_TERMINAL_ACTIONS_NOTICE } from "@/lib/customRequest/orderLifecycleConstants";
import type { AppRole } from "@/lib/types/user";

const primaryBtn = "rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-bold text-white hover:bg-blue-500";
const secondaryBtn =
  "rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-bold text-slate-800 shadow-sm hover:bg-slate-50";
const disabledBtn = "cursor-not-allowed rounded-lg bg-slate-200/90 px-3 py-1.5 text-sm font-bold text-slate-500";

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
};

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
  } = props;
  if (orderTerminal) {
    return (
      <div className={ORDER_ROOM_CARD_CLASS} role="status" aria-label="주문 완료 안내">
        <p className="text-sm leading-relaxed text-slate-700">{ORDER_ROOM_TERMINAL_ACTIONS_NOTICE}</p>
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
    !openDisputeApplicationDisabledReason &&
    orderId.trim().length > 0;

  return (
    <div className={`${ORDER_ROOM_CARD_CLASS} w-full`} role="group" aria-label="주문 액션">
      <div className="flex flex-wrap gap-2">
      {view === "student" && actorRole === "student" && canStudentRevisionJumps ? (
        <a href="#order-revisions" className={primaryBtn}>
          수정 요청
        </a>
      ) : view === "mentor" && actorRole === "mentor" ? (
        <a href="#order-revisions" className={secondaryBtn}>
          수정 요청
        </a>
      ) : view === "student" && actorRole === "student" ? (
        <button
          type="button"
          disabled
          className={disabledBtn}
          title={studentRevisionRequestDisabledReason ?? "수정 요청을 보낼 수 없습니다."}
        >
          수정 요청
        </button>
      ) : null}
      {view === "mentor" ? (
        canMentorStart ? (
          <form action={startCustomOrderWorkAction} className="inline">
            <input type="hidden" name="orderId" value={orderId} />
            <button type="submit" className={primaryBtn}>
              작업 시작
            </button>
          </form>
        ) : (
          <button
            type="button"
            disabled
            className={disabledBtn}
            title={mentorStartDisabledReason ?? "사용할 수 없음"}
          >
            작업 시작
          </button>
        )
      ) : null}
      {view === "student" ? (
        canStudentAccept ? (
          <form action={acceptCustomOrderDeliverableAction} className="inline">
            <input type="hidden" name="orderId" value={orderId} />
            <button type="submit" className={primaryBtn}>
              납품 수락
            </button>
          </form>
        ) : (
          <button
            type="button"
            disabled
            className={disabledBtn}
            title={studentAcceptDisabledReason ?? "사용할 수 없음"}
          >
            납품 수락
          </button>
        )
      ) : null}
      {canDisputeJump ? (
        <a href="#order-disputes" className={secondaryBtn}>
          분쟁 신청
        </a>
      ) : (
        <button
          type="button"
          disabled
          className={disabledBtn}
          title={openDisputeApplicationDisabledReason ?? "분쟁을 신청할 수 없습니다."}
        >
          분쟁 신청
        </button>
      )}
      </div>
    </div>
  );
}
