import type { DisputeBundle } from "@/lib/disputes/disputeQueries";
import { DisputeDetailView } from "@/components/disputes/DisputeDetailView";

// 멘토 분쟁 상세 — 공유 뷰에 role="mentor"(초록 액센트)로 위임. 구조는 학생과 동일, 색만 다름.
export function DisputeMentorPageBody(props: { bundle: DisputeBundle }) {
  return <DisputeDetailView bundle={props.bundle} role="mentor" />;
}
