import type { DisputeBundle } from "@/lib/disputes/disputeQueries";
import { DisputeDetailView } from "@/components/disputes/DisputeDetailView";

// 학생(당사자) 분쟁 상세 — 공유 뷰에 role="student"(파랑 액센트)로 위임.
export function DisputePartyPageBody(props: { bundle: DisputeBundle; reasonLabel?: string }) {
  return <DisputeDetailView bundle={props.bundle} role="student" />;
}
