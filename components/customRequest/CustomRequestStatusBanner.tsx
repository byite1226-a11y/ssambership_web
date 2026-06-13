import Link from "next/link";
import { PolicyNotice } from "@/components/common/PolicyNotice";
import {
  hasActiveDisputeForOrderRows,
} from "@/lib/customRequest/orderDisputeHelpers";
import {
  normalizedPrimaryOrderStatus,
  orderStatusLabelForUi,
} from "@/lib/customRequest/orderLifecycleConstants";

type Row = Record<string, unknown>;

type Props = {
  order: Row | null;
  /** disputes.rows from bundle */
  disputeRows: Row[];
};

/**
 * 주문 행·분쟁 행이 있을 때만 구체 문구를 씁니다. 데이터가 없으면 중립 안내만 합니다.
 */
export function CustomRequestStatusBanner(props: Props) {
  const o = props.order;
  const hasDispute = hasActiveDisputeForOrderRows(props.disputeRows);
  if (hasDispute) {
    return (
      <PolicyNotice title="분쟁으로 진행이 제한될 수 있어요">
        <p>진행 중인 분쟁이 있으면 납품 수락·작업 시작 등 일부 버튼이 비활성화될 수 있습니다.</p>
      </PolicyNotice>
    );
  }

  if (!o) {
    return (
      <PolicyNotice title="주문 정보">
        <p>주문 요약을 불러오지 못했습니다. 상단 헤더와 진행 탭에서 상태를 확인해 주세요.</p>
      </PolicyNotice>
    );
  }

  const norm = normalizedPrimaryOrderStatus(o);
  const label = norm ? orderStatusLabelForUi(norm) : null;

  return (
    <PolicyNotice title="이번 주문 상태 안내">
      {label ? <p>현재 단계: {label}</p> : <p>현재 단계를 화면 상단 요약에서 확인해 주세요.</p>}
      <p>
        지원 없음·자동 취소·결제 실패·납품 지연 등 예외는 주문 상태와 이벤트 로그를 함께 확인해 주세요.{" "}
        <Link href="/legal/refund" className="font-bold text-blue-700 underline">
          환불·취소 안내
        </Link>
      </p>
    </PolicyNotice>
  );
}
