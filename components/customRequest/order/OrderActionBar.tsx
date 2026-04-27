import { startCustomOrderWorkAction } from "@/lib/customRequest/orderMentorActions";
import { acceptCustomOrderDeliverableAction } from "@/lib/customRequest/orderStudentActions";
import type { AppRole } from "@/lib/types/user";

type Props = {
  view: "student" | "mentor";
  actorRole: AppRole;
  orderId: string;
  /** null이면 학생 납품 수락 폼 활성 */
  studentAcceptDisabledReason: string | null;
  /** null이면 멘토 작업 시작 폼 활성 */
  mentorStartDisabledReason: string | null;
  /** null이면 작성 가능(또는 #order-revisions 이동). 막힌 이유(학생·주문상태) */
  studentRevisionRequestDisabledReason: string | null;
  /** null이면 #order-disputes 로 이동 가능(학생·멘토) */
  openDisputeApplicationDisabledReason: string | null;
  /** terminal 주문에서 분쟁 액션이 막힐 때 짧은 안내(고객센터) */
  postTerminalDisputeSupportLine?: string | null;
};

/**
 * 연결된 액션만 활성. 나머지는 disabled 유지.
 */
export function OrderActionBar(props: Props) {
  const {
    view,
    actorRole,
    orderId,
    studentAcceptDisabledReason,
    mentorStartDisabledReason,
    studentRevisionRequestDisabledReason,
    openDisputeApplicationDisabledReason,
    postTerminalDisputeSupportLine,
  } = props;
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
    <div className="w-full" role="group" aria-label="주문 액션">
      <div className="flex flex-wrap gap-2">
      {view === "student" && actorRole === "student" && canStudentRevisionJumps ? (
        <a
          href="#order-revisions"
          className="rounded-lg bg-slate-900 px-3 py-1.5 text-sm font-bold text-white hover:bg-slate-800"
        >
          수정 요청
        </a>
      ) : view === "mentor" && actorRole === "mentor" ? (
        <a
          href="#order-revisions"
          className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-bold text-slate-800 hover:bg-slate-50"
        >
          수정 요청
        </a>
      ) : view === "student" && actorRole === "student" ? (
        <button
          type="button"
          disabled
          className="cursor-not-allowed rounded-lg bg-slate-300 px-3 py-1.5 text-sm font-bold text-slate-600"
          title={studentRevisionRequestDisabledReason ?? "수정 요청을 보낼 수 없습니다."}
        >
          수정 요청
        </button>
      ) : null}
      {view === "mentor" ? (
        canMentorStart ? (
          <form action={startCustomOrderWorkAction} className="inline">
            <input type="hidden" name="orderId" value={orderId} />
            <button
              type="submit"
              className="rounded-lg bg-slate-900 px-3 py-1.5 text-sm font-bold text-white hover:bg-slate-800"
            >
              작업 시작
            </button>
          </form>
        ) : (
          <button
            type="button"
            disabled
            className="cursor-not-allowed rounded-lg bg-slate-300 px-3 py-1.5 text-sm font-bold text-slate-600"
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
            <button
              type="submit"
              className="rounded-lg bg-slate-900 px-3 py-1.5 text-sm font-bold text-white hover:bg-slate-800"
            >
              납품 수락
            </button>
          </form>
        ) : (
          <button
            type="button"
            disabled
            className="cursor-not-allowed rounded-lg bg-slate-300 px-3 py-1.5 text-sm font-bold text-slate-600"
            title={studentAcceptDisabledReason ?? "사용할 수 없음"}
          >
            납품 수락
          </button>
        )
      ) : null}
      {canDisputeJump ? (
        <a
          href="#order-disputes"
          className="rounded-lg bg-amber-900 px-3 py-1.5 text-sm font-bold text-white hover:bg-amber-800"
        >
          분쟁 신청
        </a>
      ) : (
        <button
          type="button"
          disabled
          className="cursor-not-allowed rounded-lg bg-amber-200/80 px-3 py-1.5 text-sm font-bold text-amber-950"
          title={openDisputeApplicationDisabledReason ?? "분쟁을 신청할 수 없습니다."}
        >
          분쟁 신청
        </button>
      )}
      </div>
      {postTerminalDisputeSupportLine ? (
        <p className="mt-2 max-w-xl text-xs leading-snug text-slate-500">{postTerminalDisputeSupportLine}</p>
      ) : null}
    </div>
  );
}
